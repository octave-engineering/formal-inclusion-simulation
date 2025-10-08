# EFInA Dataset: Column Groupings & Dimensionality Reduction Analysis

## Problem Identified

The current model has **75 features** after preprocessing, creating significant noise that obscures key drivers. Main issues:

### 1. Redundant One-Hot Encoding
Binary Yes/No columns (already 0/1) are being one-hot encoded again, creating pairs like:
- `Subsistence_Small scale farming_No` + `Subsistence_Small scale farming_Yes`
- `Mobile Phone_no` + `Mobile Phone_yes`

This doubles features unnecessarily and splits their importance.

### 2. Categorical Explosion
Small categorical variables create multiple dummies:
- Education → 3 dummies
- Gender → 2 dummies
- Age_Group → 2 dummies
- Sector → 3 dummies

Each steals importance from the conceptual driver.

### 3. Granular Income Sources
19+ individual income source columns fragment the "employment/income" driver concept.

---

## Proposed Column Groupings

### **GROUP 1: Employment & Income Sources (19 columns → 4 features)**

**Formal Employment:**
- Salary_from_Government_including_NYSC
- Salary_Wages_From_A_Business_Company

**Informal Employment:**
- Salary_Wages_From_An_Individual_With_Own_Business
- Salary_Wages_From_An_Individual_For_Chores

**Agricultural Income:**
- Subsistence_Small_scale_farming
- Commercial_Large_scale_farming
- Own_Business_Trader_Farming_Produce_Livestock
- Own_Business_Trader_Agricultural_Inputs

**Business/Trade Income:**
- Own_Business_Trader_Non_farming
- Own_Business_Provide_service

**Passive Income:**
- Rent
- Pension
- Interest_On_Savings
- Return_On_Investments

**Transfers & Support:**
- Get_Money_From_Family_Friends_Students
- Get_Money_From_Family_Friends_Unemployed_NonStudents
- Get_Money_From_Family_Friends_Retired
- Government_Grant
- Drought_Relief

**Aggregated Features:**
1. `Formal_Employment_Binary` (1 if any formal salary)
2. `Agricultural_Income_Binary` (1 if any farming income)
3. `Business_Income_Binary` (1 if any business income)
4. `Income_Diversity_Score` (count of unique income sources)

---

### **GROUP 2: Financial Access Infrastructure (10+ columns → 2 features)**

**Physical Access Points:**
- Financial_Service_Agent_Near_Home
- ATM_Near_Home
- Microfinance_Bank_Near_Home
- Non_Interest_Service_Provider_Near_Home
- Primary_Mortgage_Bank_Near_Home

**Aggregated Features:**
1. `Financial_Access_Index` (mean of all access binaries)
2. `Access_Diversity_Score` (count of available channels)

---

### **GROUP 3: Digital/Mobile Access (2-4 columns → 1 feature)**

**Mobile Infrastructure:**
- Mobile_Phone
- Reliable_Phone_Network

**Aggregated Feature:**
1. `Mobile_Digital_Readiness` (1 if has phone AND reliable network)

---

### **GROUP 4: Formal Identity (2 columns → 1 feature)**

**ID Documents:**
- NIN
- BVN

**Aggregated Feature:**
1. `Formal_ID_Score` (count: 0, 1, or 2)

---

### **GROUP 5: Demographics (Keep ordinal/simple)**

**Education:**
- Keep `Education_Ordinal` (0-3 scale)
- Remove one-hot dummies

**Age:**
- Convert Age_Group to ordinal (0=15-17, 1=18+)
- Or use numeric age if available

**Gender:**
- Keep as single binary (Male=1, Female=0)

**Urban/Rural:**
- Keep `Sector_Urban` as single binary

---

### **GROUP 6: Financial Behavior**

**Core Variables:**
- Bank_Account (keep as-is)
- Income_Level (keep ordinal)

---

## Recommended Dimensionality Reduction Strategy

### **Approach: Domain-Driven Feature Engineering + Selective Retention**

#### **Step 1: Aggregate Similar Columns**
Create composite scores for each concept group (employment, access, mobile, ID).

#### **Step 2: Remove Redundant One-Hot Encodings**
Stop one-hot encoding binary columns - keep them as single 0/1 features.

#### **Step 3: Use Ordinal Encoding for Ordered Categories**
Education, Income_Level, Age → ordinal integers, not dummies.

#### **Step 4: Final Feature Set (Target: ~20-25 features)**

**Core Drivers (10 features):**
1. Education_Ordinal
2. Income_Level
3. Formal_Employment_Binary
4. Business_Income_Binary
5. Income_Diversity_Score
6. Financial_Access_Index
7. Mobile_Digital_Readiness
8. Formal_ID_Score
9. Bank_Account
10. Sector_Urban

**Demographic Controls (3 features):**
11. Gender_Male
12. Age_Ordinal
13. Region (if needed, as categorical)

**Supplementary (5-10 features):**
- Individual high-impact columns like Pension, NIN, BVN
- Agricultural_Income_Binary
- Passive_Income_Binary

---

## Data Science Methods

### **1. Feature Grouping (Recommended - Interpretable)**
- **Method:** Manual aggregation based on domain knowledge
- **Pros:** Interpretable, aligns with policy levers, reduces noise
- **Implementation:** Create composite features in preprocessing

### **2. Principal Component Analysis (PCA)**
- **Method:** Extract orthogonal components from correlated features
- **Pros:** Automatic, captures variance efficiently
- **Cons:** Loss of interpretability (components are linear combinations)
- **Use Case:** If pure prediction is goal, not explanation

### **3. Factor Analysis**
- **Method:** Identify latent factors underlying observed variables
- **Pros:** More interpretable than PCA, identifies constructs
- **Cons:** Requires assumptions about factor structure

### **4. Recursive Feature Elimination (RFE)**
- **Method:** Iteratively remove least important features
- **Pros:** Model-driven, automatic
- **Cons:** Computationally expensive, may discard domain-important features

### **5. LASSO Regularization**
- **Method:** L1 penalty forces many coefficients to zero
- **Pros:** Automatic feature selection during training
- **Implementation:** Already available in LogisticRegression(penalty='l1')

### **6. Variance Inflation Factor (VIF)**
- **Method:** Remove features with high multicollinearity
- **Pros:** Reduces redundancy, improves coefficient stability
- **Implementation:** Calculate VIF, drop features with VIF > 10

---

## Implementation Priority

### **Phase 1: Fix Redundant Encoding (Immediate)**
- Stop one-hot encoding binary columns
- Use ordinal encoding for Education, Age
- **Expected Impact:** Reduce from 75 → ~40 features

### **Phase 2: Create Composite Indices (High Impact)**
- Implement 6 core composite features (employment, access, mobile, ID, income diversity)
- **Expected Impact:** Reduce to ~25 features, surface key drivers

### **Phase 3: Optional Advanced Methods**
- Try LASSO for automatic selection
- Compute VIF to identify remaining redundancy
- **Expected Impact:** Fine-tune to 15-20 most important features

---

## Expected Outcome

**Before:**
- 75 features
- Top-10 dominated by individual income sources
- Education invisible (split across dummies)
- Access fragmented

**After:**
- ~20-25 features
- Top-10 shows:
  1. Education_Ordinal
  2. Financial_Access_Index
  3. Income_Level
  4. Formal_ID_Score
  5. Bank_Account
  6. Income_Diversity_Score
  7. Sector_Urban
  8. Mobile_Digital_Readiness
  9. Formal_Employment_Binary
  10. Business_Income_Binary

**Result:** Clear, policy-relevant drivers aligned with domain expectations.
