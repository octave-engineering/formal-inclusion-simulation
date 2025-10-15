// Prediction utilities for both individual and population simulation
// Updated model with NON-CIRCULAR variables (removes transactional accounts, mobile money, etc.)
// VERSION: 3.0 - WITH INFRASTRUCTURE AND MOBILITY INDICES (Oct 14, 2025)

// New model coefficients (64 features = 23 base + 5 age groups + 36 state dummies)
export const FEATURE_WEIGHTS = {
  'Has_NIN': 0.6664311379713055,
  'Digital_Access_Index': 0.5301916670637035,
  'education_numeric': 0.5096809645376985,
  'wealth_numeric': 0.440976815974267,
  'state_BORNO': -0.4170623058138325,
  'Infrastructure_Access_Index': 0.40262053090021466,
  'state_KATSINA': -0.34150965052067217,
  'Subsistence_Farming': -0.3282667472847593,
  'urban': 0.2698706082353374,
  'state_GOMBE': -0.2416094514415105,
  'Family_Friends_Support': -0.2257522244305486,
  'state_DELTA': 0.21845112739668565,
  'Income_Diversity_Score': 0.18838957542520873,
  'state_SOKOTO': -0.1492534943347506,
  'state_KOGI': 0.1414823556803794,
  'gender_male': 0.13248538079426458,
  'state_ADAMAWA': -0.1306404963848942,
  'state_ONDO': -0.12789065154485071,
  'state_KANO': -0.12490565162080786,
  'state_ZAMFARA': -0.12199414502871846,
  'state_LAGOS': 0.1188007615617252,
  'state_OGUN': 0.10826294182748089,
  'state_EBONYI': -0.10740374419849655,
  'age_65+': -0.10102701255707167,
  'income_numeric': 0.09640918041080916,
  'state_ENUGU': -0.08543364636352785,
  'state_ANAMBRA': -0.08289944432717439,
  'state_BAUCHI': -0.07816340227343811,
  'state_TARABA': -0.07659286349081904,
  'state_KWARA': 0.07595611261250484,
  'state_PLATEAU': -0.07510877466173516,
  'state_BENUE': -0.07465374342365515,
  'state_EKITI': -0.07358435633701518,
  'state_KADUNA': -0.07239688528977475,
  'Commercial_Farming': -0.07145766082914866,
  'state_YOBE': -0.0712879403007652,
  'Passive_Income': 0.06706201834063025,
  'state_OYO': 0.06324490826616627,
  'Subsist_x_Business': 0.06288188910623291,
  'state_JIGAWA': -0.06153752243136156,
  'Subsist_x_Urban': -0.05303287799443273,
  'age_35-44': 0.04710305320858604,
  'age_55-64': -0.045450990852175716,
  'state_NASARAWA': -0.04194215127477879,
  'age_25-34': 0.0404802947564915,
  'Business_Income': -0.039844717532876044,
  'state_AKWA IBOM': -0.03871211707424101,
  'state_EDO': 0.031015715974729328,
  'money_shortage_frequency': -0.02195617444223679,
  'state_OSUN': 0.020949293880559165,
  'state_FCT': 0.02029499715141017,
  'age_45-54': -0.014393164630684609,
  'state_NIGER': -0.010925001619083408,
  'Subsist_x_Formal': 0.010838244172022051,
  'state_IMO': -0.010804813347431894,
  'state_CROSS RIVER': 0.009331794620799458,
  'Formal_Employment': -0.009024178170979748,
  'state_KEBBI': 0.006113676869976732,
  'state_RIVERS': -0.004331251217929663,
  'state_BAYELSA': 0.0003064642980594078,
  'Savings_Behavior_Score': -6.211626801573982e-17,
  'Old_Age_Planning': -3.105813400786991e-17,
  'savings_frequency_numeric': 0.0,
  'Regular_Saver': 0.0,
  'Informal_Savings_Mode': 0.0,
  'Savings_Frequency_Score': 0.0,
  'Diverse_Savings_Reasons': 0.0,
  'Saves_Money': 0.0,
};

export const INTERCEPT = 0.2845217558466611;

// Baseline inclusion rate from the data
export const BASELINE_INCLUSION_RATE = 0.6121;

// Survey defaults (median/mean values from the dataset)
export const SURVEY_DEFAULTS = {
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

  // NEW reinstated variables (expanded income sources)
  Has_NIN: 0,
  Formal_Employment: 0,
  Business_Income: 1,  // Default income source
  Subsistence_Farming: 0,  // Small-scale farming
  Commercial_Farming: 0,   // Large-scale farming
  Passive_Income: 0,
  Family_Friends_Support: 0,  // Dependency on family/friends
  Income_Diversity_Score: 1,  // Auto-calculated from selected sources
  Digital_Access_Index: 1,
  
  // NEW: Infrastructure (Mobility commented out)
  Infrastructure_Access_Index: 6,  // 0-12: number of nearby facilities
  // Mobility_Index: 4,  // COMMENTED OUT
  
  // Interaction terms (auto-calculated)
  Subsist_x_Formal: 0,
  Subsist_x_Business: 0,
  Subsist_x_Urban: 0
};

// Feature ordering (must match model training order)
export const FEATURE_ORDER = [
  "gender_male",
  "education_numeric",
  "income_numeric",
  "wealth_numeric",
  "urban",
  "savings_frequency_numeric",
  "money_shortage_frequency",
  "Saves_Money",
  "Informal_Savings_Mode",
  "Regular_Saver",
  "Diverse_Savings_Reasons",
  "Old_Age_Planning",
  "Savings_Frequency_Score",
  "Savings_Behavior_Score",
  "Has_NIN",
  "Formal_Employment",
  "Business_Income",
  "Subsistence_Farming",
  "Commercial_Farming",
  "Passive_Income",
  "Family_Friends_Support",
  "Income_Diversity_Score",
  "Digital_Access_Index",
  "Infrastructure_Access_Index",
  "Subsist_x_Formal",
  "Subsist_x_Business",
  "Subsist_x_Urban",
  "age_25-34",
  "age_35-44",
  "age_45-54",
  "age_55-64",
  "age_65+",
  "state_ADAMAWA",
  "state_AKWA IBOM",
  "state_ANAMBRA",
  "state_BAUCHI",
  "state_BAYELSA",
  "state_BENUE",
  "state_BORNO",
  "state_CROSS RIVER",
  "state_DELTA",
  "state_EBONYI",
  "state_EDO",
  "state_EKITI",
  "state_ENUGU",
  "state_FCT",
  "state_GOMBE",
  "state_IMO",
  "state_JIGAWA",
  "state_KADUNA",
  "state_KANO",
  "state_KATSINA",
  "state_KEBBI",
  "state_KOGI",
  "state_KWARA",
  "state_LAGOS",
  "state_NASARAWA",
  "state_NIGER",
  "state_OGUN",
  "state_ONDO",
  "state_OSUN",
  "state_OYO",
  "state_PLATEAU",
  "state_RIVERS",
  "state_SOKOTO",
  "state_TARABA",
  "state_YOBE",
  "state_ZAMFARA"
];

export const SCALER_MEAN = [0.46686919385374015, 1.5772465108087879, 28429.474618060143, 2.0864262757011405, 0.5483643728261348, 1.0, 2.8068507022410074, 0.125, 0.074, 0.1, 0.072, 0.28000000000000014, 0.36, 0.6500000000000002, 0.6784660766961652, 0.06163870910932066, 0.3301193149297759, 0.3203011491216484, 0.05419803636683838, 0.014000792497688548, 0.13798265310615065, 0.9479593184519879, 1.4928895346277462, 3.230748910315678, 0.006472064456478669, 0.042002377493065644, 0.12900101263593536, 0.28921762867080525, 0.22546559239202218, 0.12045964865935807, 0.0663496675912473, 0.0468454189230837, 0.02756130850173909, 0.02751728085237529, 0.026680755514463084, 0.026988949060009686, 0.027032976709373487, 0.028001584995377096, 0.027825474397921896, 0.026768810813190685, 0.026900893761282085, 0.027077004358737288, 0.027077004358737288, 0.027473253203011493, 0.0281776955928323, 0.02650464491700788, 0.026636727865099283, 0.027165059657464886, 0.027913529696649494, 0.027165059657464886, 0.026636727865099283, 0.027781446748558095, 0.02624047902082508, 0.024787566591819663, 0.027825474397921896, 0.026680755514463084, 0.027649363800466693, 0.02734117025492009, 0.02654867256637168, 0.02729714260555629, 0.02729714260555629, 0.027737419099194294, 0.026988949060009686, 0.026152423722097477, 0.02729714260555629, 0.02738519790428389, 0.026724783163826885, 0.02342270946154185];

export const SCALER_SCALE = [0.4989011421956248, 0.8165699392942897, 40576.73760278704, 1.0868859458749143, 0.49765539024623723, 1.0, 1.027634159332233, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.4670651554854831, 0.24049818845192414, 0.4702558376459258, 0.4665922448916184, 0.2264080590898152, 0.11749370326585684, 0.3448817776397274, 0.5959433710454279, 0.6835714436267134, 2.0357571080763783, 0.08018838343644205, 0.20059456068895704, 0.33520106111830644, 0.45339915299528455, 0.41788857251585226, 0.3254982668221477, 0.24889232451359022, 0.2113076563899294, 0.16371219495019623, 0.1635850852213208, 0.16114866676345957, 0.16205105889393592, 0.16217951436480488, 0.16497725974546848, 0.16447254291355892, 0.16140706793953694, 0.16179380604994215, 0.1623078562291247, 0.1623078562291247, 0.16345786478923158, 0.16548024976990447, 0.1606304725599449, 0.1610192926134627, 0.1625642002141654, 0.16472511817122418, 0.1625642002141654, 0.1610192926134627, 0.164346092028728, 0.15984966775562193, 0.15547714666238177, 0.16447254291355895, 0.1611486667634596, 0.16396608332791313, 0.1630755366816604, 0.1607601957927872, 0.16294787083950565, 0.16294787083950565, 0.16421953197141304, 0.16205105889393592, 0.15958845339045477, 0.16294787083950565, 0.16320309077963907, 0.16127792511274855, 0.15124181347438956];

export const REFERENCE_STATE = 'ABIA';
export const REFERENCE_AGE_GROUP = '18-24';
export const STATE_FEATURES = FEATURE_ORDER.filter(f => f.startsWith('state_'));
export const AGE_FEATURES = FEATURE_ORDER.filter(f => f.startsWith('age_'));

// Map UI state names to model naming (e.g., AKWA-IBOM -> AKWA IBOM, FCT ABUJA -> FCT)
const STATE_UI_TO_MODEL = {
  'AKWA-IBOM': 'AKWA IBOM',
  'CROSS-RIVER': 'CROSS RIVER',
  'FCT ABUJA': 'FCT',
  'FCT-ABUJA': 'FCT',
};

const STATE_MODEL_TO_UI = {
  'AKWA IBOM': 'AKWA-IBOM',
  'CROSS RIVER': 'CROSS-RIVER',
  'FCT': 'FCT ABUJA',
};

// State encoding (one-hot with reference state dropped)
export const encodeState = (stateName) => {
  const dummies = {};
  STATE_FEATURES.forEach(sf => { dummies[sf] = 0; });
  const modelName = STATE_UI_TO_MODEL[stateName] || stateName;
  if (modelName !== REFERENCE_STATE) {
    const key = `state_${modelName}`;
    if (STATE_FEATURES.includes(key)) dummies[key] = 1;
  }
  return dummies;
};

// Age group encoding (one-hot with reference age group dropped)
export const encodeAgeGroup = (ageGroup) => {
  const dummies = {};
  AGE_FEATURES.forEach(af => { dummies[af] = 0; });
  const group = ageGroup || '35-44';
  if (group !== REFERENCE_AGE_GROUP) {
    const key = `age_${group}`;
    if (AGE_FEATURES.includes(key)) dummies[key] = 1;
  }
  return dummies;
};

// Standardize features (z-score) using ordered arrays
export const standardizeFeatures = (inputs) => {
  const stateDummies = encodeState(inputs.state);
  const ageDummies = encodeAgeGroup(inputs.age_group);
  const all = { ...inputs, ...stateDummies, ...ageDummies };
  const standardized = {};
  FEATURE_ORDER.forEach((feat, idx) => {
    const val = all[feat] !== undefined ? all[feat] : 0;
    standardized[feat] = (val - SCALER_MEAN[idx]) / SCALER_SCALE[idx];
  });
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
  
  // Debug logging (can be removed later)
  if (typeof window !== 'undefined' && window.DEBUG_PREDICTIONS) {
    console.log('Prediction Debug:', {
      age_group: inputs.age_group,
      infrastructure: inputs.Infrastructure_Access_Index,
      mobility: inputs.Mobility_Index,
      age_dummies: {
        'age_25-34': standardized['age_25-34'],
        'age_35-44': standardized['age_35-44'],
        'age_45-54': standardized['age_45-54'],
        'age_55-64': standardized['age_55-64'],
        'age_65+': standardized['age_65+']
      },
      logit,
      probability: (probability * 100).toFixed(2) + '%'
    });
  }
  
  return probability;
};

// Population prediction with policy changes
export const predictPopulation = (population, policyChanges) => {
  let includedCount = 0;
  let newlyIncluded = 0;
  const predictions = [];
  
  population.forEach(person => {
    const baseInputs = { ...person };
    const baseProbability = predictIndividual(baseInputs);
    const baseIncluded = baseProbability >= 0.5;
    
    const modifiedInputs = { ...baseInputs, ...policyChanges };
    const modifiedProbability = predictIndividual(modifiedInputs);
    const modifiedIncluded = modifiedProbability >= 0.5;
    
    if (modifiedIncluded) includedCount++;
    if (!baseIncluded && modifiedIncluded) newlyIncluded++;
    
    predictions.push({
      ...person,
      baseProbability,
      modifiedProbability,
      baseIncluded,
      modifiedIncluded
    });
  });
  
  return {
    includedCount,
    newlyIncluded,
    totalPopulation: population.length,
    inclusionRate: includedCount / population.length,
    predictions
  };
};

// Helper: Get state coefficient
export const getStateCoefficient = (stateName) => {
  const modelName = STATE_UI_TO_MODEL[stateName] || stateName;
  if (modelName === REFERENCE_STATE) return 0;
  return FEATURE_WEIGHTS[`state_${modelName}`] || 0;
};

// Helper: Get state effect description
export const getStateEffect = (stateName) => {
  const coef = getStateCoefficient(stateName);
  if (Math.abs(coef) < 0.01) return 'Neutral';
  if (coef > 0.1) return 'High positive';
  if (coef > 0) return 'Positive';
  if (coef < -0.1) return 'High negative';
  return 'Negative';
};
