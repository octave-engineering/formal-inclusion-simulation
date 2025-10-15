# Income Sources Model Update

## Date: October 15, 2025

## Changes Made

### 1. **Expanded Income Sources (Python Model)**

#### Old Structure:
- Formal_Employment
- Business_Income
- Agricultural_Income (combined)
- Passive_Income

#### New Structure:
- **Formal_Employment** (Coef: -0.009) - Minimal effect
- **Business_Income** (Coef: -0.040) - Slightly negative (non-farming business)
- **Subsistence_Farming** (Coef: **-0.328**) - Strongly negative (small-scale, irregular income)
- **Commercial_Farming** (Coef: -0.072) - Slightly negative (large-scale, better than subsistence)
- **Passive_Income** (Coef: +0.067) - Positive (stable income from assets)
- **Family_Friends_Support** (Coef: **-0.226**) - Strongly negative (dependency signal)

### 2. **Model Performance**
- **Test Accuracy**: 79.57%
- **Test AUC**: 0.8751
- **Total Features**: 68 (27 base + 5 age groups + 36 states)

### 3. **Key Insights**

#### Subsistence vs Commercial Farming
- **Subsistence Farming**: Strongly negative (-0.33)
  - Small-scale farming
  - Irregular cash-based income
  - Limited access to financial infrastructure
  - Includes: subsistence farming, farming produce/livestock, agricultural inputs
  
- **Commercial Farming**: Slightly negative (-0.07)
  - Large-scale commercial operations
  - Still faces barriers but much less severe than subsistence
  - 4.6x better coefficient than subsistence farming

#### Family/Friends Support
- **Strong negative effect (-0.23)**
- Indicates economic vulnerability and dependency
- Includes: students, unemployed, retired receiving family support
- Signals lack of independent income

### 4. **Interaction Terms (Updated)**
- **Subsist_x_Formal** (+0.011): Small positive when combined with formal employment
- **Subsist_x_Business** (+0.063): Positive when combined with business (diversification helps)
- **Subsist_x_Urban** (-0.053): Negative in urban areas (signals lower socioeconomic status)

### 5. **UI Updates**
- Replaced single "Agricultural Income" toggle with two separate toggles:
  - **Subsistence Farming**: Small-scale farming operations
  - **Commercial Farming**: Large-scale commercial farming
- Added **Family/Friends Support** toggle
- Updated info boxes with coefficient explanations
- Income Diversity Score auto-calculates from 6 sources (was 4)

### 6. **JavaScript/Model Files Updated**
- ✅ `rebuild_complete_model_from_excel.py` - Model training script
- ✅ `generate_js_prediction.py` - JS generation script
- ✅ `dashboard/src/utils/prediction_new.js` - Prediction coefficients and defaults
- ✅ `dashboard/src/components/IndividualMode.jsx` - UI components

### 7. **Data Sources**
All income sources map to columns in the Excel survey:
- Subsistence: `Subsistence_Small scale farming`, `Own_Business_Trader_Farming_Produce_Livestock`, `Own_Business_Trader_Agricultural_Inputs`
- Commercial: `Commercial_Large_scale_farming`
- Family Support: `Get_Money_From_Family_Friends (Students)`, `Get_Money_From_Family_Friends(unemployed, non -students)`, `E9_19_Get_Money_From_Family_Friends(retired)`
- Passive: `Rent`, `Pension`, `Government_grant`, `Drought_relief`, `Interest_On_Savings`, `Return_On_Investments`

## Interpretation

### Why is Commercial Farming still negative?
While commercial farming has a better coefficient than subsistence (-0.07 vs -0.33), it's still negative. This suggests:
1. Even large-scale farmers in Nigeria may face barriers to formal financial inclusion
2. Cash-based agricultural economy
3. Limited access to formal credit/banking infrastructure in rural areas
4. Possible seasonal income volatility

### Family/Friends Support
The strongly negative coefficient makes intuitive sense:
- Indicates lack of independent income generation
- Associated with unemployment, student status, or retirement
- Signals economic vulnerability
- Less likely to need/qualify for formal financial services
