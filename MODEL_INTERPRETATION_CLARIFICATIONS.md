# Model Interpretation Clarifications

## User Questions & Answers

### 1. Why does "runs out of money" positively predict formal inclusion?

**Coefficient:** +0.243 (positive)

**Answer:** This seems counterintuitive but actually makes economic sense:

**Reasons:**
- People who run out of money frequently **NEED** formal financial services more urgently:
  - Need savings accounts to build financial buffers
  - Need credit/overdraft facilities to smooth consumption
  - Need budgeting tools and financial planning
- This variable may indicate **income volatility** rather than low income
  - Irregular income earners (traders, gig workers) run out of money despite decent total income
  - Formal services help manage cash flow volatility
- **Need vs. Access**: This predicts *propensity* to benefit from services, not current access
  - People experiencing financial stress have higher motivation to seek formal solutions

**Interpretation:** Running out of money signals **need for formal financial tools**, making these individuals priority targets for financial inclusion programs.

---

### 2. Why does "old age planning" negatively predict formal inclusion?

**Coefficient:** -0.044 (negative, weak)

**Answer:** This negative relationship likely reflects several factors:

**Possible Explanations:**
- **Informal planning mechanisms:** People with old age plans may rely on:
  - Extended family support systems (children expected to provide care)
  - Asset accumulation (land, property) rather than formal pensions
  - Community-based support networks
  - Livestock or other traditional stores of value

- **Multicollinearity with other variables:**
  - People with formal old-age plans (pensions) may already be captured by other variables
  - The coefficient is very weak (-0.044), suggesting minor independent effect

- **Survey measurement:** The question captures ANY old-age planning, including informal methods
  - Those with informal plans may not see need for formal financial services

**Interpretation:** Having old-age plans through informal means may reduce perceived need for formal financial inclusion. This highlights the importance of promoting formal pension/retirement products.

---

### 3. Why do higher savings scores negatively predict formal inclusion?

**Coefficients:**
- Savings_Behavior_Score: -0.012
- Savings_Frequency_Score: -0.006
- Saves_Money: -0.005
- Regular_Saver: -0.004

**Answer:** These negative coefficients are **very weak** (near zero) and likely reflect:

**Key Issue - Multicollinearity:**
- These composite scores are calculated FROM other savings variables already in the model
- When controlling for `savings_frequency_numeric` (+0.205) and other individual indicators, the composite scores add little new information
- Negative coefficients likely indicate that the variance they capture is already explained by stronger predictors

**Important Note:**
- The individual component `savings_frequency_numeric` has a **strong positive coefficient** (+0.205)
- This is the true signal: **frequent saving DOES predict higher formal inclusion**
- The composite scores should perhaps be removed or interpreted cautiously

**Recommendation:** Consider removing `Savings_Behavior_Score` and `Savings_Frequency_Score` from the model to reduce multicollinearity, keeping only the individual behavioral indicators.

---

### 4. Clarification Needed: Informal vs. Formal Savings

**CRITICAL CLARIFICATION:**

The savings variables in this model measure **ANY savings behavior**, including:

**Informal Savings Methods:**
- Savings at home (cash under mattress, piggy bank)
- Rotating Savings and Credit Associations (ROSCAs): esusu, ajo, adashi
- Savings with family/friends
- Livestock or grain storage
- Purchase of assets (gold, property)

**Formal Savings Methods:**
- Bank savings accounts
- Cooperative society accounts
- Mobile money savings
- Microfinance institution accounts

**Why This Matters:**
- The model uses savings behavior as a **predictor** of formal inclusion propensity
- Someone who saves regularly (even informally) demonstrates:
  - Financial discipline
  - Surplus income beyond subsistence
  - Future orientation
  - Understanding of the concept of saving
- These behaviors predict they would **benefit from** and **be ready for** formal savings products

**Model Logic:**
"If someone already has the habit of saving (even informally), they are good candidates for formal financial inclusion because they have the discipline and motivation—we just need to channel it into formal products."

---

### 5. How is monthly income measured in Naira?

**Answer:** The `income_numeric` variable comes directly from the EFInA survey dataset.

**Survey Method:**
- Respondents were asked about their average monthly income
- Survey provided income brackets (e.g., "₦35,001 – ₦55,000")
- The midpoint of each bracket was used as the numeric value
- For example: "₦35,001 – ₦55,000" → 45,000.5 Naira

**Dashboard Implementation:**
- Slider range: 0 - 200,000 NGN (covers 99%+ of responses)
- Default: 34,360 NGN (mean from dataset)
- Users can adjust to simulate different income levels

---

### 6. How is age limited to 18-80 years?

**Answer:** This range comes from the survey sampling and data

 characteristics.

**Survey Design:**
- EFInA survey targets adults aged 18 and above
- 18 is the legal age of majority in Nigeria (can open accounts independently)

**Data Characteristics:**
- Minimum age in dataset: 18 years
- Maximum age observed: ~80 years
- Mean age: 37 years

**Dashboard Implementation:**
- Slider range: 18 - 80 years
- Default: 37 years (mean)
- Reflects realistic age range of financial service users

---

### 7. Can we add state-level geographic detail?

**Answer:** YES! The dataset contains a `state` column with 37 Nigerian states.

**Available Data:**
- 37 states in the dataset
- Examples: LAGOS, KANO, RIVERS, KADUNA, OGUN, etc.
- Currently using binary `urban` variable (Urban/Rural)

**Proposed Enhancement:**
Add a state dropdown in Individual Mode:
- Allows selection of specific state
- More granular than just Urban/Rural
- Can capture state-specific inclusion dynamics
- Some states have unique financial ecosystems

**Implementation Considerations:**
- May need to one-hot encode states for model (creates 36 dummy variables)
- Alternative: Keep urban/rural for model, add state as contextual info only
- **Recommendation:** Add state as a display/filter feature but keep the model using just `urban` to avoid overfitting

---

### 8. Contributing Factors Display - Clarification Needed

**Current Display:**
- Shows top 6 factors contributing to the prediction
- Numbers shown are the **contribution values** (coefficient × standardized value)

**User Confusion:**
- Not clear if these are percentages, absolute values, or what

**Proposed Improvement:**
1. **Show percentage contribution** to total score
   - Each factor's contribution / sum of all contributions × 100
2. **Add explanatory text:** "% contribution to inclusion score"
3. **Longer display**: Show more space for factor names
4. **Visual bars**: Make bar charts longer/clearer

**Example:**
Current: "Education: 0.85"
Improved: "Education: 32% of score ⬛⬛⬛⬛⬛⬛⬛⬛"

---

### 9. Conditional Logic: Disable savings variables if "Saves Money" = No

**Excellent UX Suggestion!**

**Logic:**
- If `Saves_Money` = No (0), then:
  - `Regular_Saver` should be disabled (can't be regular if not saving)
  - `Savings_Frequency_Score` should be 0
  - `Diverse_Savings_Reasons` should be disabled
  - `Informal_Savings_Mode` should be disabled

- If `Saves_Money` = Yes (1), then:
  - All other savings variables become adjustable

**Implementation:**
- Gray out/disable controls when `Saves_Money` = No
- Auto-set disabled variables to 0
- Add tooltip: "Enable 'Saves Money' to adjust other savings behaviors"

---

### 10. Reorganize Savings Sections

**Current Organization:**
- Savings Behavior section
- Savings Frequency section (separate)

**Proposed Reorganization:**

**Section: Savings Behavior** (combine all savings variables)
1. `Saves_Money` (Binary) - Master toggle
2. `Regular_Saver` (Binary) - Disabled if Saves_Money = No
3. `savings_frequency_numeric` (0-5) - How often they save
4. `Informal_Savings_Mode` (Binary) - Uses esusu/ajo/etc.
5. `Diverse_Savings_Reasons` (Binary) - Saves for 2+ reasons
6. `Old_Age_Planning` (Binary) - Has old-age plan
7. `Savings_Frequency_Score` (0-5) - Composite frequency score
8. `Savings_Behavior_Score` (0-5) - Overall savings behavior

**Clear Hierarchy:**
- Master: Saves_Money (Yes/No)
- If Yes → Adjust frequency, mode, reasons, planning
- Scores auto-calculated or user-adjustable

---

## Recommended Actions

### Immediate (High Priority):
1. ✅ Add clarification about informal vs. formal savings in Variable Info
2. ✅ Improve contributing factors display (percentages, longer bars)
3. ✅ Implement conditional logic: disable savings vars when Saves_Money = No
4. ✅ Reorganize savings variables into single section
5. ✅ Add state selection dropdown (37 states)
6. ✅ Add explanatory notes for counterintuitive coefficients

### Documentation (Medium Priority):
7. Update Variable Info page with all clarifications from this document
8. Add "Model Interpretation Guide" section explaining:
   - Why some relationships seem counterintuitive
   - Multicollinearity issues with composite scores
   - Difference between informal and formal savings

### Model Review (Low Priority):
9. Consider removing `Savings_Behavior_Score` and `Savings_Frequency_Score` to reduce multicollinearity
10. Evaluate if state should be added as a model feature (may improve accuracy)

---

## Summary

Your questions identified important interpretability issues. The key clarifications:

1. **Runs out of money** → Signals **need** for formal services (emergency savings, credit)
2. **Old age planning** → May be informal (family/assets), not formal pensions
3. **Savings scores** → Multicollinearity with other vars; individual behaviors are what matter
4. **Savings = informal + formal** → Model uses saving behavior as propensity indicator
5. **Income/Age ranges** → Come directly from survey data characteristics
6. **State data available** → Can add for more granular geography
7. **Contributing factors** → Need clearer % format
8. **Conditional logic** → Great UX improvement
9. **Section reorganization** → Simpler, more intuitive structure

These changes will significantly improve model interpretability and user experience!
