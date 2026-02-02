import json

# Load model artifacts
with open('complete_model_results/model_coefficients.json', 'r') as f:
    coefs = json.load(f)

with open('complete_model_results/model_config.json', 'r') as f:
    config = json.load(f)

# Generate JavaScript file
js_code = '''// Prediction utilities for both individual and population simulation
// Updated model with NON-CIRCULAR variables (removes transactional accounts, mobile money, etc.)
// VERSION: 3.0 - WITH INFRASTRUCTURE AND MOBILITY INDICES (Oct 14, 2025)

// New model coefficients (64 features = 23 base + 5 age groups + 36 state dummies)
export const FEATURE_WEIGHTS = {
'''

# Add coefficients
for key, value in sorted(coefs.items(), key=lambda x: abs(x[1]), reverse=True):
    if key != 'intercept':
        js_code += f"  '{key}': {value},\n"

js_code += f'''}};\n
export const INTERCEPT = {coefs['intercept']};

// Baseline inclusion rate from the data
export const BASELINE_INCLUSION_RATE = 0.6121;

// Survey defaults (median/mean values from the dataset)
export const SURVEY_DEFAULTS = {{
  // Demographics & economics
  education_numeric: 2,        // 0=No education, 1=Primary, 2=Secondary, 3=Tertiary
  wealth_numeric: 3,           // Wealth quintile (1-5)
  income_numeric: 28400,       // Monthly income in Naira (approx mean)
  gender_male: 0,              // Binary: 1=male, 0=female
  urban: 1,                    // Binary: 1=urban, 0=rural
  age_group: '35-44',          // Age group (18-24, 25-34, 35-44, 45-54, 55-64, 65+)

  // Savings behavior (placeholders; neutral defaults)
  runs_out_of_money: 1,        // Binary
  savings_frequency_numeric: 1, // 0-5 scale
  Saves_Money: 0,              // Binary
  Regular_Saver: 0,            // Binary
  Informal_Savings_Mode: 0,    // Binary
  Diverse_Savings_Reasons: 0,  // Binary
  Savings_Frequency_Score: 0,  // 0-5
  Savings_Behavior_Score: 1,   // 0-5
  Old_Age_Planning: 0,         // Binary

  // NEW reinstated variables
  Has_NIN: 1,
  Formal_Employment: 0,
  Business_Income: 0,
  Agricultural_Income: 0,
  Passive_Income: 0,
  Income_Diversity_Score: 1,
  Digital_Access_Index: 1,
  
  // NEW: Infrastructure and Mobility
  Infrastructure_Access_Index: 3,  // 0-12: number of nearby facilities
  Mobility_Index: 4,               // 1-6: visit frequency (1=high mobility, 6=never)
}};

// Feature ordering (must match model training order)
export const FEATURE_ORDER = {json.dumps(config['features'], indent=2).replace('[', '[').replace(']', ']')};

export const SCALER_MEAN = {json.dumps(config['scaler_mean'])};

export const SCALER_SCALE = {json.dumps(config['scaler_scale'])};

export const REFERENCE_STATE = '{config['reference_state']}';
export const REFERENCE_AGE_GROUP = '{config['reference_age_group']}';
export const STATE_FEATURES = FEATURE_ORDER.filter(f => f.startsWith('state_'));
export const AGE_FEATURES = FEATURE_ORDER.filter(f => f.startsWith('age_'));

// Map UI state names to model naming (e.g., AKWA-IBOM -> AKWA IBOM, FCT ABUJA -> FCT)
const STATE_UI_TO_MODEL = {{
  'AKWA-IBOM': 'AKWA IBOM',
  'CROSS-RIVER': 'CROSS RIVER',
  'FCT ABUJA': 'FCT',
  'FCT-ABUJA': 'FCT',
}};

const STATE_MODEL_TO_UI = {{
  'AKWA IBOM': 'AKWA-IBOM',
  'CROSS RIVER': 'CROSS-RIVER',
  'FCT': 'FCT ABUJA',
}};

// State encoding (one-hot with reference state dropped)
export const encodeState = (stateName) => {{
  const dummies = {{}};
  STATE_FEATURES.forEach(sf => {{ dummies[sf] = 0; }});
  const modelName = STATE_UI_TO_MODEL[stateName] || stateName;
  if (modelName !== REFERENCE_STATE) {{
    const key = `state_${{modelName}}`;
    if (STATE_FEATURES.includes(key)) dummies[key] = 1;
  }}
  return dummies;
}};

// Age group encoding (one-hot with reference age group dropped)
export const encodeAgeGroup = (ageGroup) => {{
  const dummies = {{}};
  AGE_FEATURES.forEach(af => {{ dummies[af] = 0; }});
  const group = ageGroup || '35-44';
  if (group !== REFERENCE_AGE_GROUP) {{
    const key = `age_${{group}}`;
    if (AGE_FEATURES.includes(key)) dummies[key] = 1;
  }}
  return dummies;
}};

// Standardize features (z-score) using ordered arrays
export const standardizeFeatures = (inputs) => {{
  const stateDummies = encodeState(inputs.state);
  const ageDummies = encodeAgeGroup(inputs.age_group);
  const all = {{ ...inputs, ...stateDummies, ...ageDummies }};
  const standardized = {{}};
  FEATURE_ORDER.forEach((feat, idx) => {{
    const val = all[feat] !== undefined ? all[feat] : 0;
    standardized[feat] = (val - SCALER_MEAN[idx]) / SCALER_SCALE[idx];
  }});
  return standardized;
}};

// Calculate logistic regression score
export const calculateLogit = (standardized) => {{
  let logit = INTERCEPT;
  for (const [key, value] of Object.entries(standardized)) {{
    if (FEATURE_WEIGHTS[key] !== undefined) {{
      logit += value * FEATURE_WEIGHTS[key];
    }}
  }}
  return logit;
}};

// Convert logit to probability using sigmoid function
export const sigmoid = (logit) => {{
  return 1 / (1 + Math.exp(-logit));
}};

// Main prediction function for individuals
export const predictIndividual = (inputs) => {{
  const standardized = standardizeFeatures(inputs);
  const logit = calculateLogit(standardized);
  const probability = sigmoid(logit);
  
  // Debug logging (can be removed later)
  if (typeof window !== 'undefined' && window.DEBUG_PREDICTIONS) {{
    console.log('Prediction Debug:', {{
      age_group: inputs.age_group,
      infrastructure: inputs.Infrastructure_Access_Index,
      mobility: inputs.Mobility_Index,
      age_dummies: {{
        'age_25-34': standardized['age_25-34'],
        'age_35-44': standardized['age_35-44'],
        'age_45-54': standardized['age_45-54'],
        'age_55-64': standardized['age_55-64'],
        'age_65+': standardized['age_65+']
      }},
      logit,
      probability: (probability * 100).toFixed(2) + '%'
    }});
  }}
  
  return probability;
}};

// Population prediction with policy changes
export const predictPopulation = (population, policyChanges) => {{
  let includedCount = 0;
  let newlyIncluded = 0;
  const predictions = [];
  
  population.forEach(person => {{
    const baseInputs = {{ ...person }};
    const baseProbability = predictIndividual(baseInputs);
    const baseIncluded = baseProbability >= 0.5;
    
    const modifiedInputs = {{ ...baseInputs, ...policyChanges }};
    const modifiedProbability = predictIndividual(modifiedInputs);
    const modifiedIncluded = modifiedProbability >= 0.5;
    
    if (modifiedIncluded) includedCount++;
    if (!baseIncluded && modifiedIncluded) newlyIncluded++;
    
    predictions.push({{
      ...person,
      baseProbability,
      modifiedProbability,
      baseIncluded,
      modifiedIncluded
    }});
  }});
  
  return {{
    includedCount,
    newlyIncluded,
    totalPopulation: population.length,
    inclusionRate: includedCount / population.length,
    predictions
  }};
}};

// Helper: Get state coefficient
export const getStateCoefficient = (stateName) => {{
  const modelName = STATE_UI_TO_MODEL[stateName] || stateName;
  if (modelName === REFERENCE_STATE) return 0;
  return FEATURE_WEIGHTS[`state_${{modelName}}`] || 0;
}};

// Helper: Get state effect description
export const getStateEffect = (stateName) => {{
  const coef = getStateCoefficient(stateName);
  if (Math.abs(coef) < 0.01) return 'Neutral';
  if (coef > 0.1) return 'High positive';
  if (coef > 0) return 'Positive';
  if (coef < -0.1) return 'High negative';
  return 'Negative';
}};
'''

# Write to file
with open('dashboard/src/utils/prediction_new.js', 'w') as f:
    f.write(js_code)

print("✅ Generated dashboard/src/utils/prediction_new.js")
print(f"   Total features: {len(config['features'])}")
print(f"   Coefficients: {len(coefs) - 1}")  # -1 for intercept
print(f"   Intercept: {coefs['intercept']:.4f}")
