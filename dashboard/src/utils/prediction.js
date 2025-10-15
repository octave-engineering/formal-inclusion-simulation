// Prediction utilities for both individual and population simulation
// Updated model WITH STATE VARIABLES (51 features = 15 base + 36 state dummies)
// Model trained on 85,341 samples with 75.56% accuracy, AUC 0.8354

// Nigerian states list (for dropdown and dummy encoding)
export const NIGERIAN_STATES = [
  "ABIA", "ADAMAWA", "AKWA-IBOM", "ANAMBRA", "BAUCHI", "BAYELSA", "BENUE", "BORNO",
  "CROSS RIVER", "DELTA", "EBONYI", "EDO", "EKITI", "ENUGU", "FCT ABUJA", "GOMBE",
  "IMO", "JIGAWA", "KADUNA", "KANO", "KATSINA", "KEBBI", "KOGI", "KWARA",
  "LAGOS", "NASARAWA", "NIGER", "OGUN", "ONDO", "OSUN", "OYO", "PLATEAU",
  "RIVERS", "SOKOTO", "TARABA", "YOBE", "ZAMFARA"
];

// Reference state (dropped in one-hot encoding, coefficient = 0)
export const REFERENCE_STATE = "ABIA";

// Model coefficients from logistic regression with states
export const FEATURE_WEIGHTS = {
  // Base features
  'education_numeric': 0.7812090836891461,
  'wealth_numeric': 0.7493467001498288,
  'income_numeric': 0.36525320694975566,
  'runs_out_of_money': 0.22692983515345694,
  'savings_frequency_numeric': 0.20533843056757767,
  'gender_male': 0.19937261690069863,
  'urban': 0.13191422417950918,
  'Age_numeric': 0.08929998537425747,
  'Old_Age_Planning': -0.05110416955861476,
  'Diverse_Savings_Reasons': 0.03467645629924125,
  'Savings_Behavior_Score': -0.01432971686110098,
  'Informal_Savings_Mode': -0.005952845531674127,
  'Regular_Saver': -0.004180451509442865,
  'Savings_Frequency_Score': -0.0038491621825119176,
  'Saves_Money': -0.005861854510566979,
  
  // State dummy variables (36 states, reference = ABIA)
  'state_KOGI': 0.06872618194660643,
  'state_EDO': 0.06004958860111426,
  'state_NASARAWA': 0.05671691604699731,
  'state_KWARA': 0.053344096004085476,
  'state_CROSS RIVER': 0.0424403294210899,
  'state_FCT ABUJA': 0.04077120083267543,
  'state_DELTA': 0.0370883676595893,
  'state_EKITI': 0.030508869408599145,
  'state_PLATEAU': 0.027182050605272953,
  'state_JIGAWA': 0.014073351973808133,
  'state_YOBE': 0.013992770187459105,
  'state_EBONYI': 0.013990668354829669,
  'state_BAUCHI': 0.013873766705463378,
  'state_LAGOS': 0.011626730917896972,
  'state_ENUGU': 0.005311306232464988,
  'state_NIGER': 0.004366711468898973,
  'state_TARABA': 0.004199991521106988,
  'state_KADUNA': 0.002566201199023511,
  'state_OYO': -0.0013315100533585716,
  'state_OSUN': -0.0012353743261026735,
  'state_KEBBI': -0.001099583038559934,
  'state_GOMBE': -0.008610179866198888,
  'state_BENUE': -0.009703071354019802,
  'state_RIVERS': -0.015619684881737563,
  'state_OGUN': -0.016284998862037194,
  'state_AKWA-IBOM': -0.016735812308376855,
  'state_ANAMBRA': -0.019706264295104754,
  'state_SOKOTO': -0.023244316646585158,
  'state_IMO': -0.02489167789166703,
  'state_BORNO': -0.034836012824704644,
  'state_ONDO': -0.036290728452415676,
  'state_KATSINA': -0.04585870581683522,
  'state_ZAMFARA': -0.04924428676277526,
  'state_ADAMAWA': -0.054803210159139214,
  'state_BAYELSA': -0.05887521382493815,
  'state_KANO': -0.09115848365646938,
};

export const INTERCEPT = 0.11391884181808593;

// Baseline inclusion rate from the data
export const BASELINE_INCLUSION_RATE = 0.5087;

// Survey defaults (median/mean values from the dataset)
export const SURVEY_DEFAULTS = {
  education_numeric: 2,        // 0=No education, 1=Primary, 2=Secondary, 3=Tertiary
  wealth_numeric: 3,           // Wealth quintile (1-5)
  income_numeric: 31900,       // Monthly income in Naira (updated from training data)
  runs_out_of_money: 1,        // Binary: 1=runs out, 0=doesn't
  savings_frequency_numeric: 1, // 0-5 scale
  gender_male: 0,              // Binary: 1=male, 0=female
  urban: 0,                    // Binary: 1=urban, 0=rural
  Age_numeric: 36,             // Age in years
  Old_Age_Planning: 0,         // Binary: has plan for old age
  Diverse_Savings_Reasons: 0,  // Binary: saves for 2+ reasons
  Savings_Behavior_Score: 1,   // 0-5 composite score
  Informal_Savings_Mode: 0,    // Binary: uses informal savings
  Savings_Frequency_Score: 0,  // 0-5 weighted frequency
  Saves_Money: 0,              // Binary: saved in past 12 months
  Regular_Saver: 0,            // Binary: saves regularly
  state: 'LAGOS',              // Default state for simulation
};

// Normalization parameters (from StandardScaler used in training)
// Order matches feature order in model_config.json
const SCALER_MEAN = [
  0.49635282399812514,   // gender_male
  36.285841926412,       // Age_numeric
  1.6523172017811107,    // education_numeric
  31900.295948558705,    // income_numeric
  2.689770330442934,     // wealth_numeric
  0.36657780642137333,   // urban
  0.9971730724162174,    // savings_frequency_numeric
  0.6623798921959222,    // runs_out_of_money
  0.12476564330911648,   // Saves_Money
  0.07367588469650808,   // Informal_Savings_Mode
  0.09998242324818374,   // Regular_Saver
  0.07155202718537615,   // Diverse_Savings_Reasons
  0.28401101476447155,   // Old_Age_Planning
  0.3576722521677994,    // Savings_Frequency_Score
  0.6539869932036559,    // Savings_Behavior_Score
  // State dummies (36 states)
  0.027141434262948207, 0.027156081556128427, 0.0267752519334427, 0.03111085071478791,
  0.02832786501054605, 0.026936372158425124, 0.0266287790016405, 0.025984298101710802,
  0.026511600656198734, 0.029441059292242795, 0.026453011483477853, 0.025955003515350364,
  0.02730255448793063, 0.026672720881181156, 0.026892430278884463, 0.027756620576517458,
  0.027097492383407546, 0.025911061635809703, 0.03121338176704945, 0.02636512772439653,
  0.027375790953831733, 0.02636512772439653, 0.02674595734708226, 0.027009608624326224,
  0.026672720881181156, 0.02668736817436138, 0.02636512772439653, 0.027375790953831733,
  0.026540895242559176, 0.025691352238106396, 0.026540895242559176, 0.02630653855167565,
  0.027097492383407546, 0.0268484883993438, 0.02668736817436138, 0.025134755097258026
];

const SCALER_SCALE = [
  0.4999866979302662,    // gender_male
  12.054610714715444,    // Age_numeric
  0.7337216065953476,    // education_numeric
  40627.556680022935,    // income_numeric
  1.3530216403137145,    // wealth_numeric
  0.48186981463945994,   // urban
  1.2964842582781235,    // savings_frequency_numeric
  0.47289826666043167,   // runs_out_of_money
  0.3304529884246454,    // Saves_Money
  0.2612427007797441,    // Informal_Savings_Mode
  0.2999765629005119,    // Regular_Saver
  0.25774470817271755,   // Diverse_Savings_Reasons
  0.45094207860536445,   // Old_Age_Planning
  1.1013831749085157,    // Savings_Frequency_Score
  1.3156986826400827,    // Savings_Behavior_Score
  // State dummies (36 states)
  0.16249546704169404, 0.16253808412383028, 0.16142595149895625, 0.17361729661122502,
  0.16590779690686733, 0.16189751083129086, 0.16099592271396904, 0.1590883853518925,
  0.16065097474601572, 0.16903929519491448, 0.16047819062705324, 0.15900107329156152,
  0.16296356956806085, 0.1611250658400975, 0.16176905597975097, 0.16427474118283888,
  0.16236754075226587, 0.15887000510075833, 0.17389395206767216, 0.16021862489883248,
  0.16317584693662185, 0.16021862489883248, 0.16134004807446387, 0.16211134959122062,
  0.1611250658400975, 0.16116808789052336, 0.16021862489883248, 0.16317584693662182,
  0.16073728914686433, 0.15821285238021576, 0.16073728914686436, 0.16004532039739514,
  0.16236754075226587, 0.16164048710027476, 0.16116808789052336, 0.1565343386719313
];

// Feature names in the order they appear in the model
const FEATURE_ORDER = [
  'gender_male', 'Age_numeric', 'education_numeric', 'income_numeric',
  'wealth_numeric', 'urban', 'savings_frequency_numeric', 'runs_out_of_money',
  'Saves_Money', 'Informal_Savings_Mode', 'Regular_Saver',
  'Diverse_Savings_Reasons', 'Old_Age_Planning',
  'Savings_Frequency_Score', 'Savings_Behavior_Score',
  // State dummies (order must match SCALER arrays)
  'state_ADAMAWA', 'state_AKWA-IBOM', 'state_ANAMBRA', 'state_BAUCHI',
  'state_BAYELSA', 'state_BENUE', 'state_BORNO', 'state_CROSS RIVER',
  'state_DELTA', 'state_EBONYI', 'state_EDO', 'state_EKITI',
  'state_ENUGU', 'state_FCT ABUJA', 'state_GOMBE', 'state_IMO',
  'state_JIGAWA', 'state_KADUNA', 'state_KANO', 'state_KATSINA',
  'state_KEBBI', 'state_KOGI', 'state_KWARA', 'state_LAGOS',
  'state_NASARAWA', 'state_NIGER', 'state_OGUN', 'state_ONDO',
  'state_OSUN', 'state_OYO', 'state_PLATEAU', 'state_RIVERS',
  'state_SOKOTO', 'state_TARABA', 'state_YOBE', 'state_ZAMFARA'
];

// Convert state name to dummy variables
export const encodeState = (stateName) => {
  const stateDummies = {};
  
  // If state is the reference state (ABIA), all dummies are 0
  if (stateName === REFERENCE_STATE) {
    NIGERIAN_STATES.filter(s => s !== REFERENCE_STATE).forEach(state => {
      stateDummies[`state_${state}`] = 0;
    });
    return stateDummies;
  }
  
  // Otherwise, set the dummy for this state to 1, all others to 0
  NIGERIAN_STATES.filter(s => s !== REFERENCE_STATE).forEach(state => {
    stateDummies[`state_${state}`] = (state === stateName) ? 1 : 0;
  });
  
  return stateDummies;
};

// Standardize features (z-score normalization) with state dummies
export const standardizeFeatures = (inputs) => {
  // First, encode the state into dummy variables
  // Default to LAGOS if state is missing (for backwards compatibility with old population data)
  const stateName = inputs.state || 'LAGOS';
  const stateDummies = encodeState(stateName);
  
  // Combine base features with state dummies
  const allFeatures = { ...inputs, ...stateDummies };
  
  // Create array of feature values in correct order
  const featureArray = FEATURE_ORDER.map(featName => {
    return allFeatures[featName] !== undefined ? allFeatures[featName] : 0;
  });
  
  // Standardize using scaler parameters
  const standardized = {};
  featureArray.forEach((value, idx) => {
    const mean = SCALER_MEAN[idx];
    const scale = SCALER_SCALE[idx];
    const featName = FEATURE_ORDER[idx];
    standardized[featName] = (value - mean) / scale;
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
  return probability;
};

// Get state coefficient (for display purposes)
export const getStateCoefficient = (stateName) => {
  if (stateName === REFERENCE_STATE) {
    return 0; // Reference state has coefficient of 0
  }
  const stateKey = `state_${stateName}`;
  return FEATURE_WEIGHTS[stateKey] || 0;
};

// Get state effect description
export const getStateEffect = (stateName) => {
  const coef = getStateCoefficient(stateName);
  if (coef === 0) {
    return `${stateName} is the reference state (baseline)`;
  }
  const percentage = (coef * 100).toFixed(1);
  if (coef > 0) {
    return `${stateName} residents have ${percentage}% higher likelihood than baseline`;
  } else {
    return `${stateName} residents have ${Math.abs(percentage)}% lower likelihood than baseline`;
  }
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
