/**
 * Policy Dashboard Prediction Utilities
 * Uses the NEW model (68 features: 27 base + 5 age groups + 36 states)
 * Optimized for batch predictions on 28,392 population records
 */

import { FEATURE_WEIGHTS, INTERCEPT, SURVEY_DEFAULTS, standardizeFeatures, calculateLogit, sigmoid } from './prediction_new';

// EFInA Standard Baseline: 64% (calibrated from raw 61.21%)
export const EFINA_BASELINE_RATE = 0.64;
export const RAW_BASELINE_RATE = 0.6121;
export const CALIBRATION_FACTOR = EFINA_BASELINE_RATE / RAW_BASELINE_RATE; // ~1.046

/**
 * Predict probability for a single individual
 * Uses the standardization and prediction logic from prediction_new.js
 */
export const predictIndividual = (person) => {
  // Determine age group from age dummies
  let ageGroup = '18-24'; // default reference group
  if (person['age_25-34'] === 1) ageGroup = '25-34';
  else if (person['age_35-44'] === 1) ageGroup = '35-44';
  else if (person['age_45-54'] === 1) ageGroup = '45-54';
  else if (person['age_55-64'] === 1) ageGroup = '55-64';
  else if (person['age_65+'] === 1) ageGroup = '65+';
  
  // Create input object for standardization
  const inputs = {
    ...person,
    state: person.state || 'ABIA', // default to reference state
    age_group: ageGroup
  };
  
  // Use the standardization and prediction functions from prediction_new.js
  const standardized = standardizeFeatures(inputs);
  const logit = calculateLogit(standardized);
  const probability = sigmoid(logit);
  
  return probability;
};

/**
 * Batch predict for entire population
 * Optimized for 28k+ records
 */
export const predictPopulation = (population) => {
  const predictions = population.map(person => predictIndividual(person));
  const included = predictions.filter(p => p >= 0.5).length;
  const rate = included / population.length;
  const calibratedRate = rate * CALIBRATION_FACTOR;
  
  console.log(`Predictions: ${included}/${population.length} included (${(rate*100).toFixed(2)}% raw, ${(calibratedRate*100).toFixed(2)}% calibrated)`);
  
  return {
    predictions,
    includedCount: included,
    rate: rate,
    calibratedRate: calibratedRate,
    totalPopulation: population.length
  };
};

/**
 * Apply policy changes to population and return new predictions
 */
export const simulatePolicyImpact = (population, policyChanges) => {
  // Track baseline
  const baselinePredictions = predictPopulation(population);
  
  // Apply policy changes
  const adjustedPopulation = population.map(person => 
    applyPolicyChanges(person, policyChanges)
  );
  
  // Get new predictions
  const newPredictions = predictPopulation(adjustedPopulation);
  
  // Calculate impact
  const newlyIncluded = newPredictions.predictions.filter((pred, idx) => 
    pred >= 0.5 && baselinePredictions.predictions[idx] < 0.5
  ).length;
  
  const deltaRate = newPredictions.calibratedRate - baselinePredictions.calibratedRate;
  
  return {
    baseline: {
      rate: baselinePredictions.calibratedRate,
      rawRate: baselinePredictions.rate,
      count: baselinePredictions.includedCount
    },
    projected: {
      rate: newPredictions.calibratedRate,
      rawRate: newPredictions.rate,
      count: newPredictions.includedCount
    },
    impact: {
      deltaRate: deltaRate,
      deltaPercentagePoints: deltaRate * 100,
      newlyIncluded: newlyIncluded,
      percentAffected: (newlyIncluded / population.length) * 100
    },
    predictions: newPredictions.predictions
  };
};

/**
 * Apply policy interventions to an individual's attributes
 */
const applyPolicyChanges = (person, policies) => {
  const adjusted = { ...person };
  
  // NIN ENROLLMENT DRIVE
  if (policies.NIN_Target !== undefined && policies.NIN_Target > 0) {
    if (adjusted.Has_NIN === 0) {
      // Probabilistic upgrade based on target vs current
      const upgradeProb = Math.min(policies.NIN_Target / 100, 1.0);
      if (Math.random() < upgradeProb * 0.5) { // 50% of target gap
        adjusted.Has_NIN = 1;
      }
    }
  }
  
  // DIGITAL ACCESS EXPANSION
  if (policies.Digital_Target !== undefined && policies.Digital_Target > 0) {
    const currentDigital = adjusted.Digital_Access_Index || 0;
    const targetDigital = Math.min(policies.Digital_Target, 2); // Max is 2
    
    if (targetDigital > currentDigital) {
      const upgradeProb = (targetDigital - currentDigital) / 2;
      if (Math.random() < upgradeProb * 0.4) {
        adjusted.Digital_Access_Index = Math.min(2, currentDigital + 1);
      }
    }
  }
  
  // EDUCATION PROGRAMS
  if (policies.Education_Target !== undefined) {
    const currentEd = adjusted.education_numeric || 0;
    const targetEd = policies.Education_Target;
    
    if (targetEd > currentEd) {
      const upgradeProb = 0.25; // 25% upgrade probability
      if (Math.random() < upgradeProb) {
        adjusted.education_numeric = Math.min(3, currentEd + 1);
      }
    }
  }
  
  // WEALTH/ECONOMIC EMPOWERMENT
  if (policies.Wealth_Target !== undefined) {
    const currentWealth = adjusted.wealth_numeric || 1;
    const targetWealth = policies.Wealth_Target;
    
    if (targetWealth > currentWealth) {
      const upgradeProb = 0.15; // 15% upgrade probability
      if (Math.random() < upgradeProb) {
        adjusted.wealth_numeric = Math.min(5, currentWealth + 1);
      }
    }
  }
  
  // INFRASTRUCTURE ACCESS
  if (policies.Infrastructure_Target !== undefined) {
    const currentInfra = adjusted.Infrastructure_Access_Index || 0;
    const targetInfra = policies.Infrastructure_Target;
    
    if (targetInfra > currentInfra) {
      const increase = Math.min(3, targetInfra - currentInfra); // Max 3-point increase
      const upgradeProb = increase / 12; // Proportional to gap
      if (Math.random() < upgradeProb * 0.5) {
        adjusted.Infrastructure_Access_Index = Math.min(12, currentInfra + increase);
      }
    }
  }
  
  // INCOME GROWTH PROGRAMS
  if (policies.Income_Target !== undefined) {
    const currentIncome = adjusted.income_numeric || 0;
    const targetIncome = policies.Income_Target;
    
    if (targetIncome > currentIncome * 1.1) {
      // Proportional income increase
      adjusted.income_numeric = currentIncome * 1.15; // 15% increase
    }
  }
  
  // INCOME DIVERSIFICATION
  if (policies.Income_Diversity_Boost !== undefined && policies.Income_Diversity_Boost) {
    const currentDiversity = adjusted.Income_Diversity_Score || 0;
    if (currentDiversity < 2 && Math.random() < 0.2) {
      // Add a new income source
      adjusted.Income_Diversity_Score = currentDiversity + 1;
      
      // Randomly assign new source
      if (adjusted.Business_Income === 0 && Math.random() < 0.5) {
        adjusted.Business_Income = 1;
      }
    }
  }
  
  // AGRICULTURAL FORMALIZATION (Subsistence → Commercial)
  if (policies.Agricultural_Formalization !== undefined && policies.Agricultural_Formalization > 0) {
    if (adjusted.Subsistence_Farming === 1 && adjusted.Commercial_Farming === 0) {
      const transitionProb = policies.Agricultural_Formalization / 100;
      if (Math.random() < transitionProb * 0.3) {
        adjusted.Subsistence_Farming = 0;
        adjusted.Commercial_Farming = 1;
        // Update interaction terms
        adjusted.Subsist_x_Formal = 0;
        adjusted.Subsist_x_Business = 0;
        adjusted.Subsist_x_Urban = 0;
      }
    }
  }
  
  // REDUCE DEPENDENCY (Family/Friends Support → Employment)
  if (policies.Reduce_Dependency !== undefined && policies.Reduce_Dependency) {
    if (adjusted.Family_Friends_Support === 1 && Math.random() < 0.2) {
      adjusted.Family_Friends_Support = 0;
      // Upgrade to employment
      if (Math.random() < 0.5) {
        adjusted.Formal_Employment = 1;
      } else {
        adjusted.Business_Income = 1;
      }
      adjusted.Income_Diversity_Score = Math.max(1, adjusted.Income_Diversity_Score);
    }
  }
  
  // URBANIZATION/RURAL DEVELOPMENT
  if (policies.Urbanization_Target !== undefined) {
    const isUrban = adjusted.urban === 1;
    const targetUrbanRate = policies.Urbanization_Target / 100;
    
    if (!isUrban && Math.random() < targetUrbanRate * 0.1) {
      adjusted.urban = 1;
      // Update interaction terms if subsistence farmer
      if (adjusted.Subsistence_Farming === 1) {
        adjusted.Subsist_x_Urban = 1;
      }
    }
  }
  
  return adjusted;
};

/**
 * Calculate demographic breakdowns
 */
export const calculateDemographicBreakdowns = (population, predictions) => {
  const breakdowns = {
    gender: { male: {}, female: {} },
    urban: { urban: {}, rural: {} },
    age: {},
    states: {}
  };
  
  // Gender
  const males = population.filter((p, idx) => p.gender_male === 1);
  const females = population.filter((p, idx) => p.gender_male === 0);
  
  breakdowns.gender.male = {
    count: males.length,
    included: predictions.filter((pred, idx) => pred >= 0.5 && population[idx].gender_male === 1).length,
    rate: predictions.filter((pred, idx) => pred >= 0.5 && population[idx].gender_male === 1).length / males.length
  };
  
  breakdowns.gender.female = {
    count: females.length,
    included: predictions.filter((pred, idx) => pred >= 0.5 && population[idx].gender_male === 0).length,
    rate: predictions.filter((pred, idx) => pred >= 0.5 && population[idx].gender_male === 0).length / females.length
  };
  
  // Urban/Rural
  const urban = population.filter(p => p.urban === 1);
  const rural = population.filter(p => p.urban === 0);
  
  breakdowns.urban.urban = {
    count: urban.length,
    included: predictions.filter((pred, idx) => pred >= 0.5 && population[idx].urban === 1).length,
    rate: predictions.filter((pred, idx) => pred >= 0.5 && population[idx].urban === 1).length / urban.length
  };
  
  breakdowns.urban.rural = {
    count: rural.length,
    included: predictions.filter((pred, idx) => pred >= 0.5 && population[idx].urban === 0).length,
    rate: predictions.filter((pred, idx) => pred >= 0.5 && population[idx].urban === 0).length / rural.length
  };
  
  // Age groups
  const ageGroups = ['age_25-34', 'age_35-44', 'age_45-54', 'age_55-64', 'age_65+'];
  ageGroups.forEach(ag => {
    const ageGroup = population.filter(p => p[ag] === 1);
    if (ageGroup.length > 0) {
      breakdowns.age[ag] = {
        count: ageGroup.length,
        included: predictions.filter((pred, idx) => pred >= 0.5 && population[idx][ag] === 1).length,
        rate: predictions.filter((pred, idx) => pred >= 0.5 && population[idx][ag] === 1).length / ageGroup.length
      };
    }
  });
  
  // States (top 10 by impact)
  const stateStats = {};
  population.forEach((person, idx) => {
    const state = person.state;
    if (!stateStats[state]) {
      stateStats[state] = { count: 0, included: 0 };
    }
    stateStats[state].count++;
    if (predictions[idx] >= 0.5) {
      stateStats[state].included++;
    }
  });
  
  Object.keys(stateStats).forEach(state => {
    stateStats[state].rate = stateStats[state].included / stateStats[state].count;
  });
  
  breakdowns.states = stateStats;
  
  return breakdowns;
};

export default {
  predictIndividual,
  predictPopulation,
  simulatePolicyImpact,
  calculateDemographicBreakdowns,
  EFINA_BASELINE_RATE,
  CALIBRATION_FACTOR
};
