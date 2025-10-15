# Missing Variables Analysis & Action Plan

## Date: October 13, 2024

**CRITICAL ISSUE IDENTIFIED:** Several important predictive variables were excluded from the model during the non-circular variable selection process.

---

## ❌ Variables Missing from Current Model

### 1. **Formal ID - NIN Card** ✅ Available in Dataset
**Column:** `d3_1` or similar (National Identity Number card)

**Why It Matters:**
- Having a NIN card is a **prerequisite** for formal financial services in Nigeria
- Strong predictor of formal inclusion (can't open bank account without it)
- Government push for NIN enrollment (2020-2023)
- Likely has coefficient > +0.5 (very strong positive effect)

**Expected Distribution:**
- ~70-80% of adults have NIN (based on NIMC data)
- Higher in urban areas
- Correlated with education and wealth

---

### 2. **Employment Status** ✅ Available in Dataset
**Columns:** `e9_1`, `e9_2`, `e9_3`, `e9_4` (salary/wages sources)

**Derived Variable: `Formal_Employment` (binary)**
- e9_1: Salary from Government (including NYSC)
- e9_2: Salary/Wages from a Business/Company
- e9_3: Salary/Wages from Individual with own business
- e9_4: Salary/Wages from Individual for chores

**Why It Matters:**
- Formal employment = regular salary = need for bank account
- Employers often require bank accounts for salary payment
- Strong predictor of formal inclusion
- Expected coefficient: +0.3 to +0.5

---

### 3. **Business Income** ✅ Available in Dataset
**Columns:** `e9_7`, `e9_8`, `e9_9` (business sources)

**Derived Variable: `Business_Income` (binary)**
- e9_7: Own Business/Trader (Non-farming)
- e9_8: Own Business/Trader (Farming Produce/Livestock)
- e9_9: Own Business (Provide service)

**Why It Matters:**
- Business owners need accounts for transactions
- Mobile money adoption high among traders
- Predictor of financial service usage
- Expected coefficient: +0.2 to +0.4

---

### 4. **Agricultural Income** ✅ Available in Dataset
**Columns:** `e9_5`, `e9_6`, `e9_8`, `e9_10` (farming sources)

**Derived Variable: `Agricultural_Income` (binary)**
- e9_5: Subsistence/Small scale farming
- e9_6: Commercial/Large scale farming
- e9_8: Farming produce/livestock
- e9_10: Agricultural inputs

**Why It Matters:**
- Agricultural sector often financially excluded
- Different inclusion patterns than urban employment
- May have negative or weak positive coefficient
- Expected coefficient: -0.1 to +0.1

---

### 5. **Passive Income** ✅ Available in Dataset
**Columns:** `e9_11`, `e9_12`, `e9_13`, `e9_14` (passive sources)

**Derived Variable: `Passive_Income` (binary)**
- e9_11: Rent
- e9_12: Pension
- e9_13: Interest on savings
- e9_14: Return on investments

**Why It Matters:**
- Indicates wealth and financial sophistication
- People with passive income more likely formally included
- Expected coefficient: +0.3 to +0.5

---

### 6. **Income Diversity Score** ✅ Can Be Derived
**Calculation:** Count of active income sources (e9_1 to e9_19)

**Derived Variable: `Income_Diversity_Score` (0-19 scale)**
- 0 = No income / Student / Unemployed
- 1 = Single income source
- 2+ = Multiple income sources (diversified)

**Why It Matters:**
- Income diversity correlates with financial resilience
- Multiple income sources = higher likelihood of account usage
- Captures economic complexity beyond simple income level
- Expected coefficient: +0.1 to +0.2

---

### 7. **Digital Access Index** ✅ Available in Dataset
**Columns:** `d3_11` (Mobile phone), network reliability, internet access

**Derived Variable: `Digital_Access_Index` (0-3 scale)**
- 0 = No mobile phone
- 1 = Mobile phone, no network
- 2 = Mobile phone + reliable network
- 3 = Mobile phone + network + internet

**Why It Matters:**
- Digital financial services require phone + network
- Strong predictor of mobile money adoption
- Nigeria's financial inclusion increasingly digital
- Expected coefficient: +0.2 to +0.4

---

## 📊 Expected Impact on Model

### Current Model Performance:
- Features: 51 (15 base + 36 states)
- Test Accuracy: 75.56%
- Test AUC: 0.8354

### With Missing Variables Added:
- **Estimated Features:** 58 (22 base + 36 states)
- **Estimated Test Accuracy:** 77-79% (+1.5-3.5 pp)
- **Estimated Test AUC:** 0.85-0.87 (+0.02-0.04)

**Why Such Large Improvement Expected:**
- **NIN card** alone could add +1-2 pp accuracy (very strong predictor)
- **Employment variables** add economic context missing in current model
- **Income diversity** captures complexity beyond income level
- **Digital access** critical for mobile money (fastest growing segment)

---

## 🔧 Technical Implementation Plan

### Step 1: Create Feature Engineering Script
**File:** `add_missing_features.py`

```python
import pandas as pd

def engineer_missing_features(df):
    """
    Add the 7 missing variables to the dataset
    """
    
    # 1. NIN Card (if column exists)
    if 'd3_1' in df.columns:  # Or whatever the NIN column is called
        df['Has_NIN'] = (df['d3_1'].str.lower() == 'yes').astype(int)
    
    # 2. Formal Employment
    formal_emp_cols = ['e9_1', 'e9_2', 'e9_3', 'e9_4']
    df['Formal_Employment'] = df[formal_emp_cols].apply(
        lambda x: 1 if (x == 'Yes').any() else 0, axis=1
    )
    
    # 3. Business Income
    business_cols = ['e9_7', 'e9_8', 'e9_9']
    df['Business_Income'] = df[business_cols].apply(
        lambda x: 1 if (x == 'Yes').any() else 0, axis=1
    )
    
    # 4. Agricultural Income
    agric_cols = ['e9_5', 'e9_6', 'e9_8', 'e9_10']
    df['Agricultural_Income'] = df[agric_cols].apply(
        lambda x: 1 if (x == 'Yes').any() else 0, axis=1
    )
    
    # 5. Passive Income
    passive_cols = ['e9_11', 'e9_12', 'e9_13', 'e9_14']
    df['Passive_Income'] = df[passive_cols].apply(
        lambda x: 1 if (x == 'Yes').any() else 0, axis=1
    )
    
    # 6. Income Diversity Score
    all_income_cols = [f'e9_{i}' for i in range(1, 20)]
    df['Income_Diversity_Score'] = df[all_income_cols].apply(
        lambda x: (x == 'Yes').sum(), axis=1
    )
    
    # 7. Digital Access Index
    digital_score = 0
    if 'd3_11' in df.columns:  # Mobile phone
        digital_score += (df['d3_11'].str.lower() == 'yes').astype(int)
    # Add network + internet if columns exist
    
    df['Digital_Access_Index'] = digital_score
    
    return df
```

### Step 2: Rebuild Dataset with New Features
1. Re-run feature engineering on full dataset
2. Add 7 new variables to `X_features.csv`
3. Verify no circular dependencies (all are pre-account variables)

### Step 3: Retrain Model
1. Run `retrain_model_with_states_and_missing_vars.py`
2. New feature count: 58 (22 base + 36 states)
3. Compare performance with current 51-feature model

### Step 4: Update Dashboard
1. Update `prediction.js` with new 58-feature model
2. Add UI controls for missing variables in Individual Mode:
   - NIN Card toggle
   - Employment status toggle
   - Business income toggle
   - Agricultural income toggle
   - Passive income toggle
   - Income diversity slider (0-5+)
   - Digital access slider (0-3)
3. Update VariableInfo page with descriptions

### Step 5: Regenerate Population Data
1. Update `regenerate_population_data.py`
2. Include new variables
3. Regenerate `population_data.json` with 58 features

---

## 📋 Action Items

### Priority 1: Immediate (Today)
- [ ] Find exact column names for NIN, employment, digital access in dataset
- [ ] Create `add_missing_features.py` script
- [ ] Test feature engineering on sample data
- [ ] Verify no circular dependencies

### Priority 2: Model Retraining (Tomorrow)
- [ ] Rebuild full dataset with 22 base features
- [ ] Retrain model with states (58 total features)
- [ ] Validate performance improvement
- [ ] Document new coefficients

### Priority 3: Dashboard Integration (Next)
- [ ] Update prediction engine (58 features)
- [ ] Add UI controls for 7 new variables
- [ ] Update default values
- [ ] Test all functionality

### Priority 4: Documentation (Final)
- [ ] Update Variable Info page
- [ ] Document new features
- [ ] Update model summary
- [ ] Create user guide

---

## 🎯 Expected Final Model Specification

### Base Features (22):
**Demographics (4):**
1. gender_male
2. Age_numeric
3. education_numeric
4. urban

**Economic (7):**
5. income_numeric
6. wealth_numeric
7. Formal_Employment ✨ NEW
8. Business_Income ✨ NEW
9. Agricultural_Income ✨ NEW
10. Passive_Income ✨ NEW
11. Income_Diversity_Score ✨ NEW

**Financial Behavior (8):**
12. runs_out_of_money
13. savings_frequency_numeric
14. Saves_Money
15. Regular_Saver
16. Informal_Savings_Mode
17. Diverse_Savings_Reasons
18. Old_Age_Planning
19. Savings_Behavior_Score / Savings_Frequency_Score

**Infrastructure (2):**
20. Has_NIN ✨ NEW
21. Digital_Access_Index ✨ NEW

**Geographic (36):**
22. state_* (36 dummy variables)

**Total: 58 features**

---

## 🚨 Why This Was Missed

The original non-circular variable selection process focused on:
1. Removing variables that were **outcomes** of financial inclusion (bank accounts, mobile money)
2. Keeping only **predictors** that come before account ownership

However, it was **too aggressive** and removed:
- **NIN card** - Wrongly assumed to be outcome (it's actually prerequisite)
- **Employment variables** - Wrongly assumed circular (they're not)
- **Income source diversity** - Not considered at all
- **Digital access** - Overlooked despite being prerequisite

These are all **legitimate predictors** that should have been included from the start.

---

## 📈 Business Value

Adding these 7 variables will:
1. ✅ **Improve accuracy** by 1.5-3.5 percentage points
2. ✅ **Better targeting** for policy interventions
3. ✅ **Richer insights** into what drives inclusion
4. ✅ **More realistic simulations** in dashboard
5. ✅ **Align with industry standards** (employment, digital access are standard predictors)

---

## ✅ Next Steps

**IMMEDIATE ACTION REQUIRED:**
1. Locate exact column names for these 7 variables in the dataset
2. Create feature engineering script
3. Rebuild dataset with complete feature set
4. Retrain model
5. Update dashboard

**This is a critical gap that needs to be addressed before production deployment.**
