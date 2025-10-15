"""
Rebuild Dataset with Non-Circular Variables
============================================

This script:
1. Loads the original prepared dataset
2. Removes circular variables (those indicating existing inclusion)
3. Merges savings behavior features from the complete dataset
4. Creates a clean dataset for model retraining
"""

import pandas as pd
import numpy as np
from pathlib import Path

# Configuration
PREPARED_DATASET = 'efina_analysis_results/prepared_dataset.csv'
COMPLETE_DATASET = 'dataset/A2F_2023_complete.csv'
SAVINGS_FEATURES = 'savings_behavior_results/savings_behavior_features.csv'
OUTPUT_DIR = Path('rebuilt_dataset')
OUTPUT_DIR.mkdir(exist_ok=True)

print("="*80)
print("REBUILDING DATASET WITH NON-CIRCULAR VARIABLES")
print("="*80)

# ============================================================================
# STEP 1: LOAD DATASETS
# ============================================================================

print("\n[STEP 1] Loading datasets...")

# Load prepared dataset
df_prepared = pd.read_csv(PREPARED_DATASET)
print(f"Prepared dataset: {df_prepared.shape}")

# Load savings behavior features
df_savings = pd.read_csv(SAVINGS_FEATURES)
print(f"Savings features: {df_savings.shape}")

# Load complete dataset to get respondent IDs for merging
df_complete = pd.read_csv(COMPLETE_DATASET, encoding='latin-1', low_memory=False)
print(f"Complete dataset: {df_complete.shape}")

# ============================================================================
# STEP 2: IDENTIFY CIRCULAR VARIABLES TO REMOVE
# ============================================================================

print("\n[STEP 2] Identifying circular variables to remove...")

CIRCULAR_VARIABLES = [
    'TransactionalAccount',
    'transactional_account_binary',
    'MobileMoneyUsage',
    'mobile_money_binary',
    'FinancialAgents',
    'financial_agents_binary',
    'access_agents',
    'access_agents_raw',
    'FinancialService',
    'FrequentyUsedTransactionMethod',
    'MoneyReceivingMethod'
]

# Check which circular variables exist in the dataset
circular_found = [var for var in CIRCULAR_VARIABLES if var in df_prepared.columns]
print(f"\nCircular variables found: {len(circular_found)}")
for var in circular_found:
    print(f"  [X] {var}")

# ============================================================================
# STEP 3: REMOVE CIRCULAR VARIABLES
# ============================================================================

print("\n[STEP 3] Removing circular variables...")

# Keep only non-circular columns
df_clean = df_prepared.drop(columns=circular_found, errors='ignore')
print(f"Dataset after removing circular variables: {df_clean.shape}")

# ============================================================================
# STEP 4: MERGE SAVINGS BEHAVIOR FEATURES
# ============================================================================

print("\n[STEP 4] Merging savings behavior features...")

# The savings features are aligned by index with the complete dataset
# We need to match them to the prepared dataset using respondent_serial

# First, add index to complete dataset for matching
df_complete['original_index'] = df_complete.index

# Add original index to savings features
df_savings['original_index'] = df_savings.index

# Check if we have a common identifier
if 'respondent_serial' in df_prepared.columns:
    print("Using respondent_serial for matching...")
    
    # Try to find respondent_serial in complete dataset
    respondent_cols = [col for col in df_complete.columns if 'serial' in col.lower() or 'id' in col.lower()]
    print(f"Potential ID columns in complete dataset: {respondent_cols[:5]}")
    
    # For now, we'll use index-based matching since both datasets are from same source
    # Add original_index to prepared dataset
    df_prepared['original_index'] = df_prepared.index
    
    # Merge savings features
    df_merged = df_clean.merge(
        df_savings,
        left_index=True,
        right_index=True,
        how='left',
        suffixes=('', '_savings')
    )
    
    print(f"Dataset after merging savings features: {df_merged.shape}")
else:
    # Use index-based merge
    print("Using index-based matching...")
    df_merged = df_clean.merge(
        df_savings,
        left_index=True,
        right_index=True,
        how='left',
        suffixes=('', '_savings')
    )
    print(f"Dataset after merging savings features: {df_merged.shape}")

# ============================================================================
# STEP 5: VERIFY MERGED DATASET
# ============================================================================

print("\n[STEP 5] Verifying merged dataset...")

# Check for missing values in savings features
savings_cols = df_savings.columns.tolist()
if 'original_index' in savings_cols:
    savings_cols.remove('original_index')

print("\nSavings features added:")
for col in savings_cols:
    if col in df_merged.columns:
        non_null = df_merged[col].notna().sum()
        pct = (non_null / len(df_merged)) * 100
        mean_val = df_merged[col].mean()
        print(f"  [+] {col}: {non_null}/{len(df_merged)} ({pct:.1f}%) non-null, mean={mean_val:.3f}")

# ============================================================================
# STEP 6: FINAL VARIABLE SELECTION
# ============================================================================

print("\n[STEP 6] Final variable selection...")

# Define variables to keep for modeling
KEEP_VARIABLES = {
    'Target': ['FormallyIncluded'],
    'Demographics': [
        'Gender', 'gender_male', 'Age_numeric', 'Age_group',
        'MaritalStatus', 'EducationLevel', 'education_numeric'
    ],
    'Economic': [
        'IncomeLevel', 'income_numeric', 'WealthQuintile', 'wealth_numeric',
        'PrimarySourceOfMoney'
    ],
    'Geography': [
        'Sector', 'urban', 'region', 'state',
        'region_North East', 'region_North West', 'region_South East',
        'region_South South', 'region_South West'
    ],
    'Behavioral_Existing': [
        'SavingFrequency', 'savings_frequency_numeric',
        'RunningOutOfMoneyFrequency (for 12 months)', 'runs_out_of_money',
        'Coping_Mechanism_When_Out_Of_Money', 'invest_money'
    ],
    'Behavioral_Savings': [
        'Saves_Money', 'Informal_Savings_Mode', 'Regular_Saver',
        'Diverse_Savings_Reasons', 'Old_Age_Planning',
        'Savings_Frequency_Score', 'Savings_Behavior_Score'
    ],
    'Other': [
        'Year', 'year_2020', 'year_2023', 'respondent_serial'
    ]
}

# Collect all variables to keep
all_keep_vars = []
for category, vars_list in KEEP_VARIABLES.items():
    existing = [v for v in vars_list if v in df_merged.columns]
    all_keep_vars.extend(existing)
    print(f"\n{category}: {len(existing)} variables")
    for var in existing:
        print(f"  - {var}")

# Create final dataset
df_final = df_merged[all_keep_vars].copy()
print(f"\n\nFinal dataset shape: {df_final.shape}")

# ============================================================================
# STEP 7: HANDLE MISSING VALUES
# ============================================================================

print("\n[STEP 7] Handling missing values...")

# Check missing values
missing_summary = pd.DataFrame({
    'column': df_final.columns,
    'missing_count': df_final.isnull().sum().values,
    'missing_pct': (df_final.isnull().sum() / len(df_final) * 100).values
})
missing_summary = missing_summary[missing_summary['missing_count'] > 0].sort_values('missing_pct', ascending=False)

if len(missing_summary) > 0:
    print(f"\nColumns with missing values: {len(missing_summary)}")
    print(missing_summary.to_string(index=False))
    
    # Fill missing savings features with 0 (assuming no savings behavior)
    savings_feature_cols = [col for col in savings_cols if col in df_final.columns]
    for col in savings_feature_cols:
        df_final[col] = df_final[col].fillna(0)
        print(f"  Filled {col} missing values with 0")
else:
    print("No missing values found!")

# ============================================================================
# STEP 8: SAVE DATASETS
# ============================================================================

print("\n[STEP 8] Saving datasets...")

# Save full dataset
output_file = OUTPUT_DIR / 'modeling_dataset_non_circular.csv'
df_final.to_csv(output_file, index=False)
print(f"\n[OK] Saved full dataset: {output_file}")
print(f"     Shape: {df_final.shape}")

# Save summary statistics
summary_stats = df_final.describe(include='all').T
summary_stats.to_csv(OUTPUT_DIR / 'dataset_summary_statistics.csv')
print(f"[OK] Saved summary statistics")

# Save variable list
variable_info = pd.DataFrame({
    'variable': df_final.columns,
    'dtype': df_final.dtypes.values,
    'non_null': df_final.notna().sum().values,
    'unique_values': [df_final[col].nunique() for col in df_final.columns],
    'mean': [df_final[col].mean() if df_final[col].dtype in ['int64', 'float64'] else np.nan for col in df_final.columns]
})

# Add category labels
def categorize_variable(var):
    for category, vars_list in KEEP_VARIABLES.items():
        if var in vars_list:
            return category
    return 'Other'

variable_info['category'] = variable_info['variable'].apply(categorize_variable)
variable_info.to_csv(OUTPUT_DIR / 'variable_list.csv', index=False)
print(f"[OK] Saved variable list")

# ============================================================================
# STEP 9: CREATE MODELING-READY DATASET
# ============================================================================

print("\n[STEP 9] Creating modeling-ready dataset...")

# Remove rows with missing target variable
df_modeling = df_final[df_final['FormallyIncluded'].notna()].copy()
print(f"Removed {len(df_final) - len(df_modeling)} rows with missing target")

# Select only numeric and binary features for modeling
modeling_features = []
for col in df_modeling.columns:
    if col == 'FormallyIncluded':
        continue
    if col in ['respondent_serial', 'Year']:
        continue
    # Keep numeric columns and binary encoded categoricals
    if df_modeling[col].dtype in ['int64', 'float64']:
        modeling_features.append(col)
    elif col in ['Gender', 'Sector', 'MaritalStatus', 'EducationLevel', 
                 'IncomeLevel', 'WealthQuintile', 'PrimarySourceOfMoney',
                 'SavingFrequency', 'Coping_Mechanism_When_Out_Of_Money']:
        # These will need encoding
        continue

print(f"\nModeling features selected: {len(modeling_features)}")
print("\nFeatures by category:")
for category in ['Demographics', 'Economic', 'Geography', 'Behavioral_Existing', 'Behavioral_Savings']:
    cat_vars = [v for v in modeling_features if categorize_variable(v) == category]
    if cat_vars:
        print(f"\n  {category} ({len(cat_vars)}):")
        for var in cat_vars:
            print(f"    - {var}")

# Create X and y
X = df_modeling[modeling_features]
y = df_modeling['FormallyIncluded']

print(f"\n\nModeling dataset ready:")
print(f"  X shape: {X.shape}")
print(f"  y shape: {y.shape}")
print(f"  Positive class: {y.sum()} ({y.mean()*100:.1f}%)")

# Save modeling dataset
X.to_csv(OUTPUT_DIR / 'X_features.csv', index=False)
y.to_csv(OUTPUT_DIR / 'y_target.csv', index=False, header=True)
print(f"\n[OK] Saved modeling dataset (X and y)")

# ============================================================================
# STEP 10: SUMMARY REPORT
# ============================================================================

print("\n" + "="*80)
print("DATASET REBUILD COMPLETE")
print("="*80)

summary_report = f"""
DATASET REBUILD SUMMARY
=======================

Original Dataset:
  - Rows: {len(df_prepared):,}
  - Columns: {len(df_prepared.columns)}

Circular Variables Removed: {len(circular_found)}
  {chr(10).join([f'  - {var}' for var in circular_found])}

Savings Features Added: {len(savings_cols)}
  {chr(10).join([f'  - {col}' for col in savings_cols if col in df_final.columns])}

Final Dataset:
  - Rows: {len(df_final):,}
  - Columns: {len(df_final.columns)}
  - Features for modeling: {len(modeling_features)}

Target Variable Distribution:
  - Formally Included: {y.sum():,} ({y.mean()*100:.1f}%)
  - Not Included: {len(y) - y.sum():,} ({(1-y.mean())*100:.1f}%)

Output Files:
  - {OUTPUT_DIR / 'modeling_dataset_non_circular.csv'}
  - {OUTPUT_DIR / 'X_features.csv'}
  - {OUTPUT_DIR / 'y_target.csv'}
  - {OUTPUT_DIR / 'variable_list.csv'}
  - {OUTPUT_DIR / 'dataset_summary_statistics.csv'}

Next Steps:
  1. Review the variable list and summary statistics
  2. Run model training script with new dataset
  3. Compare model performance with/without circular variables
  4. Update dashboard with new model coefficients
"""

print(summary_report)

# Save summary report
with open(OUTPUT_DIR / 'REBUILD_SUMMARY.txt', 'w') as f:
    f.write(summary_report)

print(f"\n[OK] Saved summary report to {OUTPUT_DIR / 'REBUILD_SUMMARY.txt'}")
