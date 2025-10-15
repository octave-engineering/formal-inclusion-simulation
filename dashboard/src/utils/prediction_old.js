// Prediction utilities for both individual and population simulation

export const FEATURE_WEIGHTS = {
  'Education_Ordinal': 0.14851,
  'Income_Level_Ordinal': 0.00989,
  'Formal_Employment_Binary': 0.07810,
  'Agricultural_Income_Binary': 0.01204,
  'Business_Income_Binary': 0.05915,
  'Passive_Income_Binary': 0.03390,
  'Income_Diversity_Score': 0.01444,
  'Financial_Access_Index': 0.05609,
  'Access_Diversity_Score': 0.05609,
  'Mobile_Digital_Readiness': 0.11246,
  'Formal_ID_Count': 0.16307,
  'Bank_Account': 0.06597,
  'Gender_Male': 0.06512,
  'Age_18_Plus': 0.06887,
  'Sector_Urban': 0.05631,
};

export const BASELINE_INCLUSION_RATE = 0.64;

export const SURVEY_DEFAULTS = {
  Education_Ordinal: 0.7,
  Income_Level_Ordinal: 6,
  Formal_Employment_Binary: 0,
  Agricultural_Income_Binary: 0,
  Business_Income_Binary: 0,
  Passive_Income_Binary: 0,
  Income_Diversity_Score: 0.6,
  Financial_Access_Index: 0.14,
  Access_Diversity_Score: 0.7,
  Mobile_Digital_Readiness: 1,
  Formal_ID_Count: 1.2,
  Bank_Account: 1,
  Gender_Male: 0,
  Age_18_Plus: 1,
  Sector_Urban: 1,
};

export const normalizeInputs = (inputValues) => ({
  Education_Ordinal: inputValues.Education_Ordinal / 3,
  Income_Level_Ordinal: inputValues.Income_Level_Ordinal / 19,
  Formal_Employment_Binary: inputValues.Formal_Employment_Binary,
  Agricultural_Income_Binary: inputValues.Agricultural_Income_Binary,
  Business_Income_Binary: inputValues.Business_Income_Binary,
  Passive_Income_Binary: inputValues.Passive_Income_Binary,
  Income_Diversity_Score: Math.min(inputValues.Income_Diversity_Score / 5, 1),
  Financial_Access_Index: inputValues.Financial_Access_Index,
  Access_Diversity_Score: inputValues.Access_Diversity_Score / 5,
  Mobile_Digital_Readiness: inputValues.Mobile_Digital_Readiness,
  Formal_ID_Count: inputValues.Formal_ID_Count / 2,
  Bank_Account: inputValues.Bank_Account,
  Gender_Male: inputValues.Gender_Male,
  Age_18_Plus: inputValues.Age_18_Plus,
  Sector_Urban: inputValues.Sector_Urban,
});

export const calculateScore = (normalized) => {
  let score = 0;
  for (const [key, value] of Object.entries(normalized)) {
    score += value * FEATURE_WEIGHTS[key];
  }
  return score;
};

export const predictIndividual = (inputs) => {
  const baselineNormalized = normalizeInputs(SURVEY_DEFAULTS);
  const baselineScore = calculateScore(baselineNormalized);
  
  const currentNormalized = normalizeInputs(inputs);
  const currentScore = calculateScore(currentNormalized);
  
  const scoreDelta = currentScore - baselineScore;
  const sensitivity = 1.5;
  
  const probability = BASELINE_INCLUSION_RATE + (scoreDelta * sensitivity);
  return Math.max(0.05, Math.min(0.95, probability));
};

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

const applyPolicyChanges = (person, changes) => {
  const adjusted = { ...person };
  let changed = false;
  
  // Education Policy
  // Note: Data only has 0=No education, 1=Has education
  // For tertiary policy simulation, we'll upgrade people from "has education" to a higher conceptual level
  if (changes.Education_Tertiary_Target !== undefined) {
    const hasEducation = person.Education_Ordinal >= 1 ? 1 : 0;
    const targetRate = changes.Education_Tertiary_Target / 100;
    const currentRate = changes.Education_Tertiary_Current / 100;
    
    // Only upgrade people who already have some education (Education_Ordinal = 1)
    if (hasEducation && targetRate > currentRate) {
      const upgradeProb = (targetRate - currentRate) / (currentRate > 0 ? currentRate : 0.087); // Use baseline if current is 0
      if (Math.random() < upgradeProb) {
        // Mark as "upgraded" - we'll use a value > 1 to indicate tertiary
        adjusted.Education_Ordinal = Math.min(3, person.Education_Ordinal + 1);
        changed = true;
      }
    }
  }
  
  // ID Coverage Policy
  if (changes.NIN_Coverage_Target !== undefined) {
    const hasNIN = person.Formal_ID_Count >= 1 ? 1 : 0;
    const targetRate = changes.NIN_Coverage_Target;
    const currentRate = changes.NIN_Coverage_Current;
    
    if (!hasNIN && targetRate > currentRate) {
      const upgradeProb = (targetRate - currentRate) / (1 - currentRate);
      if (Math.random() < upgradeProb) {
        adjusted.Formal_ID_Count = Math.min(2, person.Formal_ID_Count + 1);
        changed = true;
      }
    }
  }
  
  // Bank Account Policy
  if (changes.Bank_Account_Target !== undefined) {
    const hasBankAccount = person.Bank_Account >= 0.5 ? 1 : 0;
    const targetRate = changes.Bank_Account_Target;
    const currentRate = changes.Bank_Account_Current;
    
    if (!hasBankAccount && targetRate > currentRate) {
      const upgradeProb = (targetRate - currentRate) / (1 - currentRate);
      if (Math.random() < upgradeProb) {
        adjusted.Bank_Account = 1;
        changed = true;
      }
    }
  }
  
  // Financial Access Index Policy
  if (changes.Financial_Access_Index_Target !== undefined) {
    const originalAccess = person.Financial_Access_Index;
    const targetAccess = changes.Financial_Access_Index_Target / 100; // Convert percentage
    if (Math.abs(targetAccess - originalAccess) > 0.01) {
      adjusted.Financial_Access_Index = targetAccess;
      changed = true;
    }
  }
  
  // Access Diversity Policy
  if (changes.Access_Diversity_Target !== undefined) {
    const originalDiversity = person.Access_Diversity_Score;
    const targetDiversity = changes.Access_Diversity_Target;
    if (Math.abs(targetDiversity - originalDiversity) > 0.05) {
      adjusted.Access_Diversity_Score = targetDiversity;
      changed = true;
    }
  }
  
  // Digital Access Policy
  if (changes.Digital_Access_Target !== undefined) {
    const hasDigitalAccess = person.Mobile_Digital_Readiness >= 0.5 ? 1 : 0;
    const targetRate = changes.Digital_Access_Target / 100;
    const currentRate = changes.Digital_Access_Current / 100;
    
    if (!hasDigitalAccess && targetRate > currentRate) {
      const upgradeProb = (targetRate - currentRate) / (1 - currentRate);
      if (Math.random() < upgradeProb) {
        adjusted.Mobile_Digital_Readiness = 1;
        changed = true;
      }
    }
  }
  
  // Employment Policies
  if (changes.Formal_Employment_Target !== undefined) {
    const hasFormalEmployment = person.Formal_Employment_Binary >= 0.5 ? 1 : 0;
    const targetRate = changes.Formal_Employment_Target / 100;
    const currentRate = changes.Formal_Employment_Current / 100;
    
    if (!hasFormalEmployment && targetRate > currentRate) {
      const upgradeProb = (targetRate - currentRate) / (1 - currentRate);
      if (Math.random() < upgradeProb) {
        adjusted.Formal_Employment_Binary = 1;
        changed = true;
      }
    }
  }
  
  if (changes.Business_Income_Target !== undefined) {
    const hasBusinessIncome = person.Business_Income_Binary >= 0.5 ? 1 : 0;
    const targetRate = changes.Business_Income_Target / 100;
    const currentRate = changes.Business_Income_Current / 100;
    
    if (!hasBusinessIncome && targetRate > currentRate) {
      const upgradeProb = (targetRate - currentRate) / (1 - currentRate);
      if (Math.random() < upgradeProb) {
        adjusted.Business_Income_Binary = 1;
        changed = true;
      }
    }
  }
  
  if (changes.Agricultural_Income_Target !== undefined) {
    const hasAgriculturalIncome = person.Agricultural_Income_Binary >= 0.5 ? 1 : 0;
    const targetRate = changes.Agricultural_Income_Target / 100;
    const currentRate = changes.Agricultural_Income_Current / 100;
    
    if (!hasAgriculturalIncome && targetRate > currentRate) {
      const upgradeProb = (targetRate - currentRate) / (1 - currentRate);
      if (Math.random() < upgradeProb) {
        adjusted.Agricultural_Income_Binary = 1;
        changed = true;
      }
    }
  }
  
  if (changes.Passive_Income_Target !== undefined) {
    const hasPassiveIncome = person.Passive_Income_Binary >= 0.5 ? 1 : 0;
    const targetRate = changes.Passive_Income_Target / 100;
    const currentRate = changes.Passive_Income_Current / 100;
    
    if (!hasPassiveIncome && targetRate > currentRate) {
      const upgradeProb = (targetRate - currentRate) / (1 - currentRate);
      if (Math.random() < upgradeProb) {
        adjusted.Passive_Income_Binary = 1;
        changed = true;
      }
    }
  }
  
  // Income Level Policy (population average)
  if (changes.Income_Level_Target !== undefined) {
    const originalLevel = person.Income_Level_Ordinal;
    const targetLevel = changes.Income_Level_Target;
    if (Math.abs(targetLevel - originalLevel) > 0.5) {
      adjusted.Income_Level_Ordinal = Math.round(targetLevel);
      changed = true;
    }
  }
  
  // Income Diversity Policy
  if (changes.Income_Diversity_Target !== undefined) {
    const originalDiversity = person.Income_Diversity_Score;
    const targetDiversity = changes.Income_Diversity_Target;
    if (Math.abs(targetDiversity - originalDiversity) > 0.1) {
      adjusted.Income_Diversity_Score = targetDiversity;
      changed = true;
    }
  }
  
  return { adjusted, changed };
};
