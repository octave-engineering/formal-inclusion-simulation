// Prediction utilities for both individual and population simulation
// Updated model with NON-CIRCULAR variables (removes transactional accounts, mobile money, etc.)

// New model coefficients from logistic regression (trained on 85,341 samples)
export const FEATURE_WEIGHTS = {
  'education_numeric': 0.7789365004211213,
  'wealth_numeric': 0.7637141224864036,
  'income_numeric': 0.35732767902304935,
  'runs_out_of_money': 0.2426022946974095,
  'savings_frequency_numeric': 0.20534029000973744,
  'gender_male': 0.199851696740676,
  'urban': 0.13662317757551812,
  'Age_numeric': 0.09257011619053562,
  'Old_Age_Planning': -0.04436868607144439,
  'Diverse_Savings_Reasons': 0.034950181427358194,
  'Savings_Behavior_Score': -0.012092590690032861,
  'Informal_Savings_Mode': -0.007431563939147549,
  'Savings_Frequency_Score': -0.005925938342462554,
  'Saves_Money': -0.004931530888698402,
  'Regular_Saver': -0.004465820476498675,
};

export const INTERCEPT = 0.11329074193717088;

// Baseline inclusion rate from the data
export const BASELINE_INCLUSION_RATE = 0.5087;

// Survey defaults (median/mean values from the dataset)
export const SURVEY_DEFAULTS = {
  education_numeric: 2,        // 0=No education, 1=Primary, 2=Secondary, 3=Tertiary
  wealth_numeric: 3,           // Wealth quintile (1-5)
  income_numeric: 35000,       // Monthly income in Naira
  runs_out_of_money: 1,        // Binary: 1=runs out, 0=doesn't
  savings_frequency_numeric: 1, // 0-5 scale
  gender_male: 0,              // Binary: 1=male, 0=female
  urban: 1,                    // Binary: 1=urban, 0=rural
  Age_numeric: 37,             // Age in years
  Old_Age_Planning: 1,         // Binary: has plan for old age
  Diverse_Savings_Reasons: 0,  // Binary: saves for 2+ reasons
  Savings_Behavior_Score: 1,   // 0-5 composite score
  Informal_Savings_Mode: 0,    // Binary: uses informal savings
  Savings_Frequency_Score: 0,  // 0-5 weighted frequency
  Saves_Money: 0,              // Binary: saved in past 12 months
  Regular_Saver: 0,            // Binary: saves regularly
};

// Normalization parameters (from StandardScaler used in training)
const SCALER_MEAN = {
  education_numeric: 1.6527,
  wealth_numeric: 2.6904,
  income_numeric: 34359.68,
  runs_out_of_money: 0.6626,
  savings_frequency_numeric: 1.0139,
  gender_male: 0.4978,
  urban: 0.3662,
  Age_numeric: 36.9577,
  Old_Age_Planning: 0.2847,
  Diverse_Savings_Reasons: 0.0720,
  Savings_Behavior_Score: 0.6561,
  Informal_Savings_Mode: 0.0739,
  Savings_Frequency_Score: 0.3579,
  Saves_Money: 0.1254,
  Regular_Saver: 0.1000,
};

const SCALER_SCALE = {
  education_numeric: 0.7891,
  wealth_numeric: 1.3835,
  income_numeric: 35890.47,
  runs_out_of_money: 0.4729,
  savings_frequency_numeric: 1.4175,
  gender_male: 0.5000,
  urban: 0.4818,
  Age_numeric: 14.0986,
  Old_Age_Planning: 0.4512,
  Diverse_Savings_Reasons: 0.2586,
  Savings_Behavior_Score: 1.0156,
  Informal_Savings_Mode: 0.2617,
  Savings_Frequency_Score: 0.9043,
  Saves_Money: 0.3312,
  Regular_Saver: 0.3000,
};

// Standardize features (z-score normalization)
export const standardizeFeatures = (inputs) => {
  const standardized = {};
  for (const [key, value] of Object.entries(inputs)) {
    if (SCALER_MEAN[key] !== undefined && SCALER_SCALE[key] !== undefined) {
      standardized[key] = (value - SCALER_MEAN[key]) / SCALER_SCALE[key];
    } else {
      standardized[key] = value;
    }
  }
  return standardized;
};

// Calculate logistic regression score
export const calculateLogit = (standardized) => {
  let logit = INTERCEPT;
  for (const [key, value] of Object.entries(standardized)) {
    if (FEATURE_WEIGHTS[key] !== undefined) {
      logit += value * FEATURE_WEIGHTS[key];
    }
  }
  return logit;
};

// Convert logit to probability using sigmoid function
export const sigmoid = (logit) => {
  return 1 / (1 + Math.exp(-logit));
};

// Main prediction function for individuals
export const predictIndividual = (inputs) => {
  const standardized = standardizeFeatures(inputs);
  const logit = calculateLogit(standardized);
  const probability = sigmoid(logit);
  return probability;
};

// Population prediction with policy changes
export const predictPopulation = (population, policyChanges) => {
  let includedCount = 0;
  let newlyIncluded = 0;
  const predictions = [];
  
  population.forEach(person => {
    const result = applyPolicyChanges(person, policyChanges);
    const adjustedPerson = result.adjusted;
    const wasChanged = result.changed;
    
    // If person wasn't affected by policy changes, use their actual status
    if (!wasChanged) {
      const actualStatus = person.Formally_Included >= 0.5 ? 1 : 0;
      predictions.push(actualStatus);
      includedCount += actualStatus;
    } else {
      // Person was affected by policy - predict their new status
      const prediction = predictIndividual(adjustedPerson);
      const predictedStatus = prediction >= 0.5 ? 1 : 0;
      predictions.push(prediction);
      includedCount += predictedStatus;
      
      // Check if this is a newly included person
      const wasIncluded = person.Formally_Included >= 0.5;
      if (predictedStatus === 1 && !wasIncluded) {
        newlyIncluded++;
      }
    }
  });
  
  return {
    nationalRate: includedCount / population.length,
    predictions,
    newlyIncluded,
  };
};

// Apply policy changes to a person's attributes
const applyPolicyChanges = (person, changes) => {
  const adjusted = { ...person };
  let changed = false;
  
  // Education Policy (0=None, 1=Primary, 2=Secondary, 3=Tertiary)
  if (changes.Education_Target !== undefined) {
    const currentEducation = person.education_numeric || 0;
    const targetEducation = Math.round(changes.Education_Target);
    
    if (targetEducation > currentEducation) {
      // Probabilistically upgrade education
      const upgradeProb = 0.3; // 30% chance of upgrade per policy intervention
      if (Math.random() < upgradeProb) {
        adjusted.education_numeric = Math.min(3, currentEducation + 1);
        changed = true;
      }
    }
  }
  
  // Wealth Policy (1-5 quintiles)
  if (changes.Wealth_Target !== undefined) {
    const currentWealth = person.wealth_numeric || 1;
    const targetWealth = Math.round(changes.Wealth_Target);
    
    if (targetWealth > currentWealth) {
      const upgradeProb = 0.2;
      if (Math.random() < upgradeProb) {
        adjusted.wealth_numeric = Math.min(5, currentWealth + 1);
        changed = true;
      }
    }
  }
  
  // Income Policy
  if (changes.Income_Target !== undefined) {
    const currentIncome = person.income_numeric || 0;
    const targetIncome = changes.Income_Target;
    
    if (targetIncome > currentIncome * 1.1) { // 10% threshold
      // Increase income proportionally
      adjusted.income_numeric = currentIncome * 1.2; // 20% increase
      changed = true;
    }
  }
  
  // Savings Behavior Policies
  if (changes.Savings_Promotion !== undefined && changes.Savings_Promotion) {
    // Promote savings behavior
    if (person.Saves_Money === 0 && Math.random() < 0.3) {
      adjusted.Saves_Money = 1;
      adjusted.Savings_Behavior_Score = Math.min(5, (person.Savings_Behavior_Score || 0) + 1);
      changed = true;
    }
    
    if (person.Regular_Saver === 0 && Math.random() < 0.25) {
      adjusted.Regular_Saver = 1;
      adjusted.savings_frequency_numeric = Math.min(5, (person.savings_frequency_numeric || 0) + 1);
      changed = true;
    }
    
    if (person.Diverse_Savings_Reasons === 0 && Math.random() < 0.2) {
      adjusted.Diverse_Savings_Reasons = 1;
      changed = true;
    }
    
    if (person.Old_Age_Planning === 0 && Math.random() < 0.4) {
      adjusted.Old_Age_Planning = 1;
      changed = true;
    }
  }
  
  // Urban/Rural Policy (infrastructure development)
  if (changes.Urbanization_Target !== undefined) {
    const isUrban = person.urban >= 0.5 ? 1 : 0;
    const targetRate = changes.Urbanization_Target / 100;
    
    if (!isUrban && Math.random() < targetRate * 0.1) {
      adjusted.urban = 1;
      changed = true;
    }
  }
  
  return { adjusted, changed };
};
