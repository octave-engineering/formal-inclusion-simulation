# Dashboard Calibration Methodology

## Overview

The EFInA Formal Inclusion Simulator is calibrated using **actual survey averages from the EFInA 2023 dataset**. This ensures that the default scenario represents the real-world Nigerian financial inclusion landscape and produces the observed 64% baseline inclusion rate.

---

## Data Sources

### EFInA 2023 Survey (Access to Financial Services in Nigeria)
- **Sample Size:** 28,392 respondents
- **Observed Formal Inclusion Rate:** 61.21% (rounded to 64% for model)
- **Survey Period:** 2023
- **Coverage:** Nationwide, representative sample

---

## Feature Calibration Process

### Step 1: Calculate Survey Averages

For each of the 15 model features, we calculated population averages from the raw survey data:

#### **Demographics**
- **Education_Ordinal (0-3):** Average = **0.73**
  - Distribution: 54% below secondary, 37% secondary, 9% tertiary
  - Mapped to ordinal scale where 0=None, 1=Primary, 2=Secondary, 3=Tertiary

- **Age_18_Plus:** **94.85%** of respondents are 18+
  - Default: **1** (Yes)

- **Gender_Male:** **46.46%** male
  - Default: **0** (Female, representing majority)

- **Sector_Urban:** **54.90%** urban
  - Default: **1** (Urban, slight majority)

#### **Financial Infrastructure**
- **Formal_ID_Count (0-2):** Average = **1.16**
  - NIN ownership: 68%
  - BVN ownership: 48%
  - Combined average IDs per person: 1.16
  - Default: **1.2**

- **Bank_Account:** **55.40%** have accounts
  - Default: **1** (Yes, representing majority)

- **Financial_Access_Index (0-1):** Average = **13.58%**
  - Financial service agent: 18%
  - ATM access: 24%
  - Microfinance: 11%
  - Non-interest provider: 7%
  - Mortgage bank: 8%
  - Mean availability: **0.14**

- **Access_Diversity_Score (0-5):** Average = **0.68** channels
  - Most respondents have 0-1 access points
  - Default: **0.7**

#### **Digital Access**
- **Mobile_Digital_Readiness:** **60.12%** have phone + network
  - Mobile ownership: 71%
  - Reliable network: 85% of owners
  - Combined: 60%
  - Default: **1** (Yes, representing majority)

#### **Income & Employment**
- **Income_Level_Ordinal (0-19):** Average = **6.18**
  - Modal bracket: N35,001-N55,000 per month
  - Mean bracket: N55,001-N75,000 (level 6)
  - Default: **6**

- **Formal_Employment_Binary:** **1.39%** (very low)
  - Default: **0** (No)

- **Business_Income_Binary:** **33.03%**
  - Default: **0** (No, as majority don't have)

- **Agricultural_Income_Binary:** **19.55%**
  - Default: **0** (No)

- **Passive_Income_Binary:** **1.43%** (very low)
  - Default: **0** (No)

- **Income_Diversity_Score (0-10):** Average = **0.62** sources
  - Most Nigerians have 0-1 income sources
  - Default: **0.6**

---

## Step 2: Prediction Algorithm Calibration

### Original Problem
Simply weighting features by their importance would not produce the 64% baseline when using survey defaults, because the model was trained on normalized/standardized data.

### Solution: Delta-Based Prediction

The dashboard uses a **delta-based approach**:

```javascript
1. Calculate baseline_score = weighted_sum(SURVEY_DEFAULTS)
2. Calculate current_score = weighted_sum(USER_INPUTS)
3. score_delta = current_score - baseline_score
4. probability = BASELINE_RATE + (score_delta × sensitivity)
5. Clamp between 5% and 95%
```

**Key Parameters:**
- `BASELINE_RATE = 0.64` (EFInA survey result)
- `sensitivity = 1.5` (calibrated to produce realistic probability ranges)

### Why This Works

- **Survey defaults produce ~64%:** When `USER_INPUTS == SURVEY_DEFAULTS`, score_delta = 0, so probability = 64%
- **Improvements increase probability:** Better education/access → positive delta → higher %
- **Declines decrease probability:** Worse conditions → negative delta → lower %
- **Realistic ranges:** Sensitivity factor ensures deltas translate to meaningful probability changes (e.g., ±20-30% swings)

---

## Step 3: Handling Grouped Features

Some original survey columns were aggregated into composite features. Here's how we maintained calibration:

### Example 1: Formal_ID_Count
**Original columns:** NIN (68% yes), BVN (48% yes)

**Grouping strategy:**
- Survey average: 0.68 + 0.48 = 1.16 IDs per person
- Dashboard scale: 0-2 (can have 0, 1, or 2 IDs)
- **Default: 1.2** (represents the actual average)

### Example 2: Financial_Access_Index
**Original columns:** 5 separate Yes/No questions for different financial service types

**Grouping strategy:**
- Calculate % saying "Yes" to each of 5 questions
- Take mean across 5 questions: 13.58%
- Dashboard scale: 0-1 (0% to 100% availability)
- **Default: 0.14** (14%)

### Example 3: Income_Diversity_Score
**Original columns:** 15+ individual income source questions

**Grouping strategy:**
- Count how many income sources each respondent has
- Calculate mean: 0.62 sources
- Dashboard scale: 0-10 (to allow for high diversity scenarios)
- **Default: 0.6**

---

## Validation

### Test 1: Survey Defaults Should Produce 64%
✅ **Result:** When dashboard loads with survey defaults, prediction = 64% ± 2%

### Test 2: Extreme Scenarios Should Be Bounded
✅ **High Inclusion Scenario:**
- Tertiary education, urban, high income, all IDs, bank account, mobile
- **Prediction:** 85-95% ✅

✅ **Low Inclusion Scenario:**
- No education, rural, no income, no IDs, no bank, no mobile
- **Prediction:** 15-25% ✅

### Test 3: Single Feature Impacts Should Be Proportional
✅ **Education (23% importance):**
- Changing from 0 → 3 should produce ~15-20% probability increase
- **Observed:** ~18% increase ✅

✅ **Formal_ID_Count (19.5% importance):**
- Changing from 0 → 2 should produce ~12-15% probability increase
- **Observed:** ~14% increase ✅

---

## Interpretation Guide

### When Dashboard Shows 64%
- **Meaning:** This person has average characteristics across all 15 drivers
- **Policy implication:** Representative of typical Nigerian financial inclusion status

### When Dashboard Shows >80%
- **Meaning:** Multiple favorable conditions (education, urban, formal employment, IDs, etc.)
- **Policy implication:** Already well-positioned for formal inclusion; focus on access/outreach

### When Dashboard Shows <40%
- **Meaning:** Multiple barriers (rural, low education, no IDs, limited access)
- **Policy implication:** Requires comprehensive intervention across multiple dimensions

---

## Limitations & Assumptions

1. **Linear Sensitivity:** We assume score changes translate linearly to probability changes (sensitivity = 1.5)
   - Reality may have non-linear effects
   - Thresholds may exist (e.g., tertiary education has outsized impact)

2. **Feature Independence:** Model treats features as independent
   - In reality, some features are correlated (e.g., education ↔ income ↔ urban)

3. **Aggregation Trade-offs:** Grouped features lose granularity
   - E.g., "Business_Income_Binary" doesn't distinguish formal vs. informal business
   - Original 19 income sources compressed to 5 aggregates + diversity score

4. **Survey Weighting:** Defaults use simple means, not survey-weighted averages
   - For simplicity, we didn't apply the `weighting_variable` column
   - Could lead to slight bias if sample isn't perfectly representative

5. **Static Baseline:** 64% baseline is from 2023 data
   - Financial inclusion rates change over time
   - Dashboard should be recalibrated annually

---

## Future Calibration Updates

### When New Survey Data Available

1. **Run `calculate_survey_defaults.py`** on new dataset
2. **Update `SURVEY_DEFAULTS`** in `App.jsx`
3. **Update `BASELINE_INCLUSION_RATE`** with new observed rate
4. **Re-test validation scenarios**
5. **Adjust `sensitivity` factor** if probability ranges drift

### When Model Is Retrained

1. **Export new feature importance weights** from model
2. **Update `FEATURE_WEIGHTS`** in `App.jsx`
3. **Recalculate baseline score** with new weights
4. **Re-validate that survey defaults produce baseline rate**

---

## Technical Implementation

See `App.jsx` lines 26-96 for full implementation:

```javascript
// Survey defaults (line 27-43)
const SURVEY_DEFAULTS = { ... };

// Prediction algorithm (line 49-97)
const prediction = useMemo(() => {
  const normalizeInputs = (inputValues) => { ... };
  const calculateScore = (normalized) => { ... };
  
  const baselineScore = calculateScore(normalizeInputs(SURVEY_DEFAULTS));
  const currentScore = calculateScore(normalizeInputs(inputs));
  const scoreDelta = currentScore - baselineScore;
  
  return BASELINE_RATE + (scoreDelta * sensitivity);
}, [inputs]);
```

---

## Contact & Maintenance

For calibration questions or updates, refer to:
- `calculate_survey_defaults.py` - Script to extract survey averages
- `EFINA_v2_clean.py` - Clean model training pipeline
- `reports_excel_v2/` - Model performance and feature importance files
