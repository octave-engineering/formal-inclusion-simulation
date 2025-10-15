"""
Savings Behavior Analysis - Identifying Non-Circular Inclusion Indicators
==========================================================================

This script analyzes savings behavior columns from the A2F 2023 complete dataset
to create features that indicate PROPENSITY for financial inclusion without 
requiring existing formal financial accounts.

Key Principle: We exclude any savings modes that already indicate formal inclusion
(banks, mobile wallets, microfinance institutions, etc.)
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

# Configuration
DATA_PATH = 'dataset/A2F_2023_complete.csv'
OUTPUT_DIR = Path('savings_behavior_results')
OUTPUT_DIR.mkdir(exist_ok=True)

print("="*80)
print("SAVINGS BEHAVIOR ANALYSIS - NON-CIRCULAR INCLUSION INDICATORS")
print("="*80)

# ============================================================================
# STEP 1: LOAD DATA AND IDENTIFY SAVINGS COLUMNS
# ============================================================================

print("\n[STEP 1] Loading complete dataset...")
df = pd.read_csv(DATA_PATH, encoding='latin-1', low_memory=False)
print(f"Dataset shape: {df.shape}")
print(f"Total columns: {len(df.columns)}")

# Identify savings-related columns (lowercase 'sa')
savings_columns = [col for col in df.columns if col.startswith('sa')]
print(f"\nFound {len(savings_columns)} savings-related columns (sa prefix)")
print("\nSavings columns:")
for col in sorted(savings_columns):
    print(f"  - {col}")

# ============================================================================
# STEP 2: ANALYZE KEY SAVINGS BEHAVIOR COLUMNS
# ============================================================================

print("\n" + "="*80)
print("[STEP 2] Analyzing Key Savings Behavior Columns")
print("="*80)

# sa1: Did you save in the past 12 months?
print("\n--- sa1: Saved in past 12 months ---")
if 'sa1' in df.columns:
    print(df['sa1'].value_counts(dropna=False).sort_index())
    print(f"Percentage who saved: {(df['sa1'] == 1).sum() / len(df) * 100:.1f}%")
else:
    print("sa1 column not found")

# sa2: Main reasons for saving
print("\n--- sa2: Main reasons for saving ---")
sa2_cols = [col for col in df.columns if col.startswith('sa2_')]
print(f"Found {len(sa2_cols)} sa2 columns:")
for col in sa2_cols:
    non_zero = (df[col] == 1).sum()
    if non_zero > 0:
        print(f"  {col}: {non_zero} respondents ({non_zero/len(df)*100:.1f}%)")

# sa3: Modes of saving
print("\n--- sa3: Modes of saving ---")
sa3_cols = [col for col in df.columns if col.startswith('sa3')]
print(f"Found {len(sa3_cols)} sa3 columns")

# Check for specific sa3a columns (binary indicators for each mode)
sa3a_cols = [col for col in df.columns if col.startswith('sa3a_')]
print(f"\nsa3a mode columns ({len(sa3a_cols)}):")
for col in sa3a_cols:
    count = (df[col] == 1).sum()
    if count > 0:
        print(f"  {col}: {count} respondents ({count/len(df)*100:.1f}%)")

# Check sa3b and sa3c
for col in ['sa3b', 'sa3c']:
    if col in df.columns:
        print(f"\n{col} - Value counts:")
        print(df[col].value_counts(dropna=False).head(10))

# sa4a: Frequency of saving
print("\n--- sa4a: Frequency of saving ---")
if 'sa4a' in df.columns:
    print(df['sa4a'].value_counts(dropna=False).sort_index())
else:
    print("sa4a column not found")

# Note: sa5a and sa5c don't appear to exist in this dataset
# Check for any sa5 columns
sa5_cols = [col for col in df.columns if col.startswith('sa') and '5' in col]
if sa5_cols:
    print("\n--- sa5 related columns ---")
    for col in sa5_cols:
        print(f"{col}: {df[col].value_counts(dropna=False).head(5).to_dict()}")
else:
    print("\nNo sa5 columns found (sa5a, sa5c not in dataset)")

# sa6: Reasons for not saving (multiple binary columns)
print("\n--- sa6: Reasons for not saving ---")
sa6_cols = [col for col in df.columns if col.startswith('sa6_')]
if sa6_cols:
    print(f"Found {len(sa6_cols)} sa6 reason columns:")
    for col in sa6_cols:
        count = (df[col] == 1).sum()
        if count > 0:
            print(f"  {col}: {count} respondents ({count/len(df)*100:.1f}%)")
else:
    print("sa6 columns not found")

# sa7a: How will you ensure money for old age? (multiple binary columns)
print("\n--- sa7a: Old age financial planning ---")
sa7a_cols = [col for col in df.columns if col.startswith('sa7a_')]
if sa7a_cols:
    print(f"Found {len(sa7a_cols)} sa7a planning columns:")
    for col in sa7a_cols:
        count = (df[col] == 1).sum()
        if count > 0:
            print(f"  {col}: {count} respondents ({count/len(df)*100:.1f}%)")
else:
    print("sa7a columns not found")

# ============================================================================
# STEP 3: IDENTIFY ALL SA3 VARIATIONS (SAVING MODES)
# ============================================================================

print("\n" + "="*80)
print("[STEP 3] Detailed Analysis of Saving Modes (SA3)")
print("="*80)

# List all SA3 columns with their descriptions
sa3_all = [col for col in df.columns if 'SA3' in col]
print(f"\nAll SA3-related columns ({len(sa3_all)}):")
for col in sorted(sa3_all):
    non_null = df[col].notna().sum()
    unique_vals = df[col].nunique()
    print(f"  {col}: {non_null} non-null, {unique_vals} unique values")

# ============================================================================
# STEP 4: CREATE NON-CIRCULAR SAVINGS FEATURES
# ============================================================================

print("\n" + "="*80)
print("[STEP 4] Creating Non-Circular Savings Behavior Features")
print("="*80)

# Define formal inclusion indicators to EXCLUDE from SA3
# Based on your specification: exclude 1-8 (all formal financial institutions)
FORMAL_INCLUSION_MODES = [1, 2, 3, 4, 5, 6, 7, 8]
INFORMAL_SAVINGS_MODES = [9, 10, 11, 12, 13, 14]  # Cooperatives, groups, home, etc.

print("\nFormal inclusion modes (to EXCLUDE):")
print("  1: Commercial bank")
print("  2: Microfinance bank")
print("  3: Non-interest savings bank")
print("  4: Payment Service Bank")
print("  5: Mortgage bank (FMBN)")
print("  6: Mobile phone e-wallet")
print("  7: Microfinance institution")
print("  8: Cooperative (formal)")

print("\nInformal savings modes (to INCLUDE):")
print("  9: Savings group (Meri-go-round)")
print("  10: Village/community association")
print("  11: Savings/thrift collector")
print("  12: Family/friends")
print("  13: Safe place at home")
print("  14: Other informal ways")

# Create feature: Has informal savings behavior
df_features = pd.DataFrame(index=df.index)

# Feature 1: Saves money (sa1 = 1)
df_features['Saves_Money'] = (df['sa1'] == 1).astype(int) if 'sa1' in df.columns else 0

# Feature 2: Uses informal savings modes only (sa3a_9 through sa3a_14)
# These are binary columns, so we check if ANY informal mode is used
informal_mode_cols = ['sa3a_9', 'sa3a_10', 'sa3a_11', 'sa3a_12', 'sa3a_13', 'sa3a_14']
informal_mode_cols = [col for col in informal_mode_cols if col in df.columns]
if informal_mode_cols:
    # Convert to numeric first, then sum
    informal_sum = df[informal_mode_cols].apply(pd.to_numeric, errors='coerce').fillna(0).sum(axis=1)
    df_features['Informal_Savings_Mode'] = (informal_sum > 0).astype(int)
else:
    df_features['Informal_Savings_Mode'] = 0

# Feature 3: Saves regularly (sa4a in 1-5, not occasionally which is 6)
if 'sa4a' in df.columns:
    sa4a_numeric = pd.to_numeric(df['sa4a'], errors='coerce')
    df_features['Regular_Saver'] = sa4a_numeric.isin([1, 2, 3, 4, 5]).astype(int)
else:
    df_features['Regular_Saver'] = 0

# Feature 4: Saves for multiple reasons (count sa2 columns where value = 1)
sa2_reason_cols = [col for col in df.columns if col.startswith('sa2_') and col not in ['sa2_98', 'sa2_other1', 'sa2_other2']]
if sa2_reason_cols:
    sa2_sum = df[sa2_reason_cols].apply(pd.to_numeric, errors='coerce').fillna(0).sum(axis=1)
    df_features['Diverse_Savings_Reasons'] = (sa2_sum >= 2).astype(int)
else:
    df_features['Diverse_Savings_Reasons'] = 0

# Feature 5: Has old age planning (any sa7a column = 1, except sa7a_11 "don't know")
sa7a_plan_cols = [col for col in df.columns if col.startswith('sa7a_') and col not in ['sa7a_11', 'sa7a_98', 'sa7a_other']]
if sa7a_plan_cols:
    sa7a_sum = df[sa7a_plan_cols].apply(pd.to_numeric, errors='coerce').fillna(0).sum(axis=1)
    df_features['Old_Age_Planning'] = (sa7a_sum > 0).astype(int)
else:
    df_features['Old_Age_Planning'] = 0

# Feature 6: Frequency score (higher frequency = higher score)
# sa4a: 1=Daily(5pts), 2=Weekly(4pts), 3=Monthly(3pts), 4=Quarterly(2pts), 5=Annually(1pt), 6=Occasionally(0pts)
if 'sa4a' in df.columns:
    sa4a_numeric = pd.to_numeric(df['sa4a'], errors='coerce')
    frequency_map = {1: 5, 2: 4, 3: 3, 4: 2, 5: 1, 6: 0}
    df_features['Savings_Frequency_Score'] = sa4a_numeric.map(frequency_map).fillna(0).astype(int)
else:
    df_features['Savings_Frequency_Score'] = 0

# Composite Savings Behavior Score (0-5, since we removed Savings_Buffer)
df_features['Savings_Behavior_Score'] = (
    df_features['Saves_Money'] +
    df_features['Informal_Savings_Mode'] +
    df_features['Regular_Saver'] +
    df_features['Diverse_Savings_Reasons'] +
    df_features['Old_Age_Planning']
)

print("\n--- New Savings Behavior Features Summary ---")
for col in df_features.columns:
    mean_val = df_features[col].mean()
    print(f"{col}: Mean = {mean_val:.3f} ({mean_val*100:.1f}%)")

# ============================================================================
# STEP 5: CORRELATION WITH FORMAL INCLUSION
# ============================================================================

print("\n" + "="*80)
print("[STEP 5] Correlation with Formal Inclusion")
print("="*80)

# Find formal inclusion indicator
formal_inclusion_cols = [col for col in df.columns if 'formally' in col.lower() or 'included' in col.lower()]
print(f"\nPotential formal inclusion columns: {formal_inclusion_cols}")

# If we have a formal inclusion indicator, check correlation
if formal_inclusion_cols:
    target_col = formal_inclusion_cols[0]
    print(f"\nUsing '{target_col}' as formal inclusion indicator")
    
    # Merge features with target
    analysis_df = df_features.copy()
    analysis_df['Formally_Included'] = df[target_col]
    
    # Calculate correlations
    correlations = analysis_df.corr()['Formally_Included'].sort_values(ascending=False)
    print("\nCorrelations with Formal Inclusion:")
    print(correlations)
    
    # Visualize
    plt.figure(figsize=(10, 6))
    correlations[:-1].plot(kind='barh', color='steelblue')
    plt.xlabel('Correlation with Formal Inclusion')
    plt.title('Savings Behavior Features - Correlation with Formal Inclusion')
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'savings_behavior_correlations.png', dpi=300, bbox_inches='tight')
    print(f"\nSaved correlation plot to {OUTPUT_DIR / 'savings_behavior_correlations.png'}")

# ============================================================================
# STEP 6: EXPORT FEATURES
# ============================================================================

print("\n" + "="*80)
print("[STEP 6] Exporting Features")
print("="*80)

# Save features
output_file = OUTPUT_DIR / 'savings_behavior_features.csv'
df_features.to_csv(output_file, index=False)
print(f"\nSaved {len(df_features)} rows with {len(df_features.columns)} features to:")
print(f"  {output_file}")

# Save summary statistics
summary_file = OUTPUT_DIR / 'savings_features_summary.txt'
with open(summary_file, 'w') as f:
    f.write("SAVINGS BEHAVIOR FEATURES SUMMARY\n")
    f.write("="*80 + "\n\n")
    f.write(df_features.describe().to_string())
    f.write("\n\n")
    f.write("Feature Definitions:\n")
    f.write("-"*80 + "\n")
    f.write("Saves_Money: Binary indicator if person saved in past 12 months (SA1=1)\n")
    f.write("Informal_Savings_Mode: Uses informal savings methods only (SA3a in 9-14)\n")
    f.write("Regular_Saver: Saves regularly (daily/weekly/monthly/quarterly/annually)\n")
    f.write("Diverse_Savings_Reasons: Saves for multiple reasons (SA5a=1 or 2)\n")
    f.write("Savings_Buffer: Has at least 1 month of income saved (SA5c>=2)\n")
    f.write("Old_Age_Planning: Has plan for old age financial security (SA7a not 11)\n")
    f.write("Savings_Behavior_Score: Composite score (0-6) summing all above\n")

print(f"Saved summary statistics to: {summary_file}")

print("\n" + "="*80)
print("ANALYSIS COMPLETE")
print("="*80)
print("\nNext Steps:")
print("1. Review the generated features in savings_behavior_features.csv")
print("2. Integrate these features into the main modeling dataset")
print("3. Remove circular variables from Financial_Access_Index")
print("4. Retrain the logistic regression model")
print("5. Update the dashboard with new variables")
