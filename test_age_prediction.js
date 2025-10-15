// Test age group predictions
// Run this with: node test_age_prediction.js

const FEATURE_WEIGHTS = {
  'age_25-34': 0.036174795739463764,
  'age_35-44': 0.044337919603415314,
  'age_45-54': -0.01803815295158427,
  'age_55-64': -0.04782222833135204,
  'age_65+': -0.1042597164690326,
};

const INTERCEPT = 0.25623381082859326;

// Age group feature positions in FEATURE_ORDER
const AGE_FEATURE_POSITIONS = {
  'age_25-34': 21,
  'age_35-44': 22,
  'age_45-54': 23,
  'age_55-64': 24,
  'age_65+': 25,
};

const SCALER_MEAN = [
  0.28921762867080525, // age_25-34
  0.22546559239202218, // age_35-44
  0.12045964865935807, // age_45-54
  0.0663496675912473,  // age_55-64
  0.0468454189230837   // age_65+
];

const SCALER_SCALE = [
  0.4532653195039166,   // age_25-34
  0.41808195799481116,  // age_35-44
  0.3251823868768843,   // age_45-54
  0.24907636965677833,  // age_55-64
  0.21133193821551865   // age_65+
];

function encodeAgeGroup(ageGroup) {
  const dummies = {
    'age_25-34': 0,
    'age_35-44': 0,
    'age_45-54': 0,
    'age_55-64': 0,
    'age_65+': 0,
  };
  
  // Reference group is 18-24, so all zeros means 18-24
  if (ageGroup !== '18-24') {
    const key = `age_${ageGroup}`;
    if (dummies.hasOwnProperty(key)) {
      dummies[key] = 1;
    }
  }
  
  return dummies;
}

function standardizeAge(ageDummies) {
  const standardized = {};
  const features = ['age_25-34', 'age_35-44', 'age_45-54', 'age_55-64', 'age_65+'];
  
  features.forEach((feat, idx) => {
    const val = ageDummies[feat];
    standardized[feat] = (val - SCALER_MEAN[idx]) / SCALER_SCALE[idx];
  });
  
  return standardized;
}

function calculateAgeContribution(ageGroup) {
  const dummies = encodeAgeGroup(ageGroup);
  const standardized = standardizeAge(dummies);
  
  let contribution = 0;
  for (const [key, value] of Object.entries(standardized)) {
    if (FEATURE_WEIGHTS[key] !== undefined) {
      contribution += value * FEATURE_WEIGHTS[key];
    }
  }
  
  return contribution;
}

// Test all age groups
const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

console.log('\nAge Group Contributions to Logit:');
console.log('='.repeat(50));

ageGroups.forEach(group => {
  const contribution = calculateAgeContribution(group);
  console.log(`${group.padEnd(10)} → ${contribution > 0 ? '+' : ''}${contribution.toFixed(4)}`);
});

console.log('\nExpected pattern:');
console.log('  18-24: baseline (reference)');
console.log('  25-34: slightly positive');
console.log('  35-44: most positive (peak inclusion)');
console.log('  45-54: slightly negative');
console.log('  55-64: more negative');
console.log('  65+:   most negative (lowest inclusion)');
