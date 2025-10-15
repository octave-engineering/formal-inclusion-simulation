# Dashboard Update Plan - Non-Circular Model Integration

## Completed ✅
1. **Identified circular variables** - 11 variables removed
2. **Created savings behavior features** - 7 new features added
3. **Rebuilt dataset** - 85,341 samples with 15 features
4. **Retrained model** - 75.2% accuracy, 0.833 AUC
5. **Updated prediction.js** - New coefficients and logic

## New Model Features (15 total)

### Demographics (4)
- `education_numeric` (0-3: None, Primary, Secondary, Tertiary)
- `gender_male` (0/1)
- `urban` (0/1: Rural/Urban)
- `Age_numeric` (years)

### Economic (3)
- `wealth_numeric` (1-5: Wealth quintiles)
- `income_numeric` (Monthly income in Naira)
- `runs_out_of_money` (0/1)

### Behavioral - Existing (1)
- `savings_frequency_numeric` (0-5 scale)

### Behavioral - Savings (7)
- `Saves_Money` (0/1: Saved in past 12 months)
- `Regular_Saver` (0/1: Saves regularly)
- `Informal_Savings_Mode` (0/1: Uses informal savings)
- `Diverse_Savings_Reasons` (0/1: Saves for 2+ reasons)
- `Old_Age_Planning` (0/1: Has old age financial plan)
- `Savings_Frequency_Score` (0-5: Weighted frequency)
- `Savings_Behavior_Score` (0-5: Composite score)

## Dashboard Components to Update

### 1. Individual Mode (`IndividualMode.jsx`)
**Status**: Needs major simplification

**Changes needed**:
- Remove circular variables (IDs, bank accounts, mobile money, etc.)
- Add new savings behavior inputs
- Simplify to 15 features only
- Update input ranges and defaults

**New Input Groups**:
1. **Demographics** (4 inputs)
   - Education Level (0-3 dropdown)
   - Gender (Male/Female toggle)
   - Location (Urban/Rural toggle)
   - Age (slider 18-80)

2. **Economic Status** (3 inputs)
   - Wealth Quintile (1-5 slider)
   - Monthly Income (slider 0-200,000 Naira)
   - Runs Out of Money (Yes/No toggle)

3. **Savings Behavior** (8 inputs)
   - Savings Frequency (0-5 slider)
   - Saves Money (Yes/No)
   - Regular Saver (Yes/No)
   - Informal Savings Mode (Yes/No)
   - Diverse Savings Reasons (Yes/No)
   - Old Age Planning (Yes/No)
   - Savings Frequency Score (0-5 slider)
   - Savings Behavior Score (0-5 slider)

### 2. Policy Mode (`PolicyMode.jsx`)
**Status**: Needs update

**Changes needed**:
- Remove circular policy levers
- Add savings promotion policies
- Update baseline calculations
- Simplify policy interventions

**New Policy Levers**:
1. Education Improvement
2. Wealth/Income Growth
3. Savings Behavior Promotion
4. Urban Infrastructure Development

### 3. Variable Info Page (`VariableInfo.jsx`)
**Status**: Needs complete rewrite

**Changes needed**:
- Remove documentation for circular variables
- Add detailed explanations for savings behavior features
- Update model weights and importance
- Add section on why circular variables were removed

### 4. Population Data Generation
**Status**: Needs regeneration

**Changes needed**:
- Create new script to generate population_data.json
- Use new 15-feature model
- Ensure all 28,392 respondents have the new features
- Update predictions using new model

## Implementation Steps

### Step 1: Update Individual Mode ⏳
- [ ] Create new simplified input component
- [ ] Group inputs by category
- [ ] Add tooltips explaining each feature
- [ ] Test prediction accuracy

### Step 2: Update Policy Mode
- [ ] Remove circular policy levers
- [ ] Add savings promotion policies
- [ ] Update baseline calculation logic
- [ ] Test policy simulations

### Step 3: Update Variable Info
- [ ] Document all 15 features
- [ ] Explain circular variable removal
- [ ] Add savings behavior methodology
- [ ] Include model performance metrics

### Step 4: Regenerate Population Data
- [ ] Create population data generation script
- [ ] Merge savings features with existing population
- [ ] Generate predictions for all respondents
- [ ] Validate data quality

### Step 5: Testing
- [ ] Test Individual mode predictions
- [ ] Test Policy mode simulations
- [ ] Verify all features work correctly
- [ ] Check mobile responsiveness

### Step 6: Deployment
- [ ] Commit changes to git
- [ ] Push to GitHub
- [ ] Verify GitHub Actions deployment
- [ ] Test live site

## Key Messages for EFInA Team

1. **Removed Circular Logic**: The model now measures PROPENSITY for inclusion, not existing inclusion
2. **Added Savings Behavior**: New features capture financial behavior without requiring formal accounts
3. **Improved Interpretability**: Clear separation between demographics, economics, and behavior
4. **Policy-Relevant**: All features are actionable through policy interventions
5. **Maintained Performance**: 75% accuracy with non-circular variables (vs ~80% with circular ones)

## Next Actions
1. Simplify Individual Mode component
2. Update Policy Mode for new features
3. Regenerate population data
4. Test and deploy
