"""
Identify Circular Variables in Formal Inclusion Model
======================================================

This script analyzes the prepared dataset to identify variables that already
indicate formal financial inclusion, creating circular logic in the model.

Circular variables are those where having the characteristic REQUIRES being
formally included (e.g., having a transactional account, using mobile money, etc.)
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

# Configuration
DATA_PATH = 'efina_analysis_results/prepared_dataset.csv'
OUTPUT_DIR = Path('circular_variables_analysis')
OUTPUT_DIR.mkdir(exist_ok=True)

print("="*80)
print("CIRCULAR VARIABLES IDENTIFICATION")
print("="*80)

# Load the modeling dataset
print("\n[STEP 1] Loading modeling dataset...")
df = pd.read_csv(DATA_PATH)
print(f"Dataset shape: {df.shape}")
print(f"Target variable: FormallyIncluded")

# Display all columns
print(f"\nAll columns ({len(df.columns)}):")
for i, col in enumerate(df.columns, 1):
    print(f"  {i:2d}. {col}")

# ============================================================================
# STEP 2: IDENTIFY POTENTIALLY CIRCULAR VARIABLES
# ============================================================================

print("\n" + "="*80)
print("[STEP 2] Identifying Potentially Circular Variables")
print("="*80)

# Define circular variables based on their meaning
CIRCULAR_VARIABLES = {
    'TransactionalAccount': {
        'reason': 'Having a transactional account IS formal inclusion',
        'type': 'Direct indicator',
        'severity': 'HIGH'
    },
    'transactional_account_binary': {
        'reason': 'Binary version of TransactionalAccount',
        'type': 'Direct indicator',
        'severity': 'HIGH'
    },
    'MobileMoneyUsage': {
        'reason': 'Mobile money accounts are formal financial services',
        'type': 'Direct indicator',
        'severity': 'HIGH'
    },
    'mobile_money_binary': {
        'reason': 'Binary version of MobileMoneyUsage',
        'type': 'Direct indicator',
        'severity': 'HIGH'
    },
    'FinancialAgents': {
        'reason': 'Using financial agents implies existing formal account',
        'type': 'Usage indicator',
        'severity': 'MEDIUM-HIGH'
    },
    'financial_agents_binary': {
        'reason': 'Binary version of FinancialAgents',
        'type': 'Usage indicator',
        'severity': 'MEDIUM-HIGH'
    },
    'access_agents': {
        'reason': 'Access to financial agents may indicate existing usage',
        'type': 'Access indicator',
        'severity': 'MEDIUM'
    },
    'access_agents_raw': {
        'reason': 'Raw access to agents score',
        'type': 'Access indicator',
        'severity': 'MEDIUM'
    },
    'FinancialService': {
        'reason': 'Type of financial service used - indicates existing inclusion',
        'type': 'Service type',
        'severity': 'HIGH'
    },
    'FrequentyUsedTransactionMethod': {
        'reason': 'Transaction method implies existing financial service',
        'type': 'Usage indicator',
        'severity': 'MEDIUM-HIGH'
    },
    'MoneyReceivingMethod': {
        'reason': 'Receiving money via formal channels indicates inclusion',
        'type': 'Usage indicator',
        'severity': 'MEDIUM'
    }
}

# Check which circular variables exist in the dataset
print("\nCircular variables found in dataset:")
circular_found = []
for var, info in CIRCULAR_VARIABLES.items():
    if var in df.columns:
        circular_found.append(var)
        print(f"\n  [X] {var}")
        print(f"     Reason: {info['reason']}")
        print(f"     Type: {info['type']}")
        print(f"     Severity: {info['severity']}")
        
        # Show correlation with FormallyIncluded
        if 'FormallyIncluded' in df.columns:
            # Handle different data types
            if df[var].dtype == 'object':
                # For categorical, show distribution
                print(f"     Distribution:")
                print(f"       {df[var].value_counts(dropna=False).head(3).to_dict()}")
            else:
                # For numeric, show correlation
                corr = df[[var, 'FormallyIncluded']].corr().iloc[0, 1]
                print(f"     Correlation with FormallyIncluded: {corr:.3f}")

print(f"\n\nTotal circular variables found: {len(circular_found)}")

# ============================================================================
# STEP 3: NON-CIRCULAR VARIABLES (GOOD PREDICTORS)
# ============================================================================

print("\n" + "="*80)
print("[STEP 3] Non-Circular Variables (Valid Predictors)")
print("="*80)

NON_CIRCULAR_VARIABLES = {
    'Demographics': [
        'Gender', 'gender_male', 'Age_numeric', 'Age_group',
        'MaritalStatus', 'EducationLevel', 'education_numeric'
    ],
    'Economic Status': [
        'IncomeLevel', 'income_numeric', 'WealthQuintile', 'wealth_numeric',
        'PrimarySourceOfMoney'
    ],
    'Geography': [
        'Sector', 'urban', 'region', 'state', 'lga_name',
        'region_North East', 'region_North West', 'region_South East',
        'region_South South', 'region_South West'
    ],
    'Behavioral (Non-Circular)': [
        'SavingFrequency', 'savings_frequency_numeric',
        'RunningOutOfMoneyFrequency (for 12 months)', 'runs_out_of_money',
        'Coping_Mechanism_When_Out_Of_Money', 'invest_money'
    ],
    'Other': [
        'Year', 'year_2020', 'year_2023', 'PropertyType',
        'PreferredLanguage', 'Population'
    ]
}

print("\nNon-circular variables by category:")
for category, vars_list in NON_CIRCULAR_VARIABLES.items():
    existing = [v for v in vars_list if v in df.columns]
    print(f"\n  [OK] {category} ({len(existing)} variables):")
    for var in existing:
        print(f"     - {var}")

# ============================================================================
# STEP 4: ANALYZE CORRELATIONS
# ============================================================================

print("\n" + "="*80)
print("[STEP 4] Correlation Analysis")
print("="*80)

if 'FormallyIncluded' in df.columns:
    # Get numeric columns only
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    
    # Remove target and ID columns
    numeric_cols = [c for c in numeric_cols if c not in ['FormallyIncluded', 'respondent_serial', 'FinanciallyIncluded']]
    
    # Calculate correlations
    correlations = []
    for col in numeric_cols:
        corr = df[[col, 'FormallyIncluded']].corr().iloc[0, 1]
        is_circular = col in circular_found
        correlations.append({
            'variable': col,
            'correlation': corr,
            'abs_correlation': abs(corr),
            'is_circular': is_circular,
            'status': 'CIRCULAR' if is_circular else 'VALID'
        })
    
    corr_df = pd.DataFrame(correlations).sort_values('abs_correlation', ascending=False)
    
    print("\nTop 20 correlations with FormallyIncluded:")
    print(corr_df.head(20).to_string(index=False))
    
    # Save correlations
    corr_df.to_csv(OUTPUT_DIR / 'variable_correlations.csv', index=False)
    print(f"\n[OK] Saved correlations to {OUTPUT_DIR / 'variable_correlations.csv'}")
    
    # Visualize
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))
    
    # Plot 1: All variables
    top_20 = corr_df.head(20)
    colors = ['red' if x else 'green' for x in top_20['is_circular']]
    ax1.barh(range(len(top_20)), top_20['correlation'], color=colors, alpha=0.7)
    ax1.set_yticks(range(len(top_20)))
    ax1.set_yticklabels(top_20['variable'])
    ax1.set_xlabel('Correlation with FormallyIncluded')
    ax1.set_title('Top 20 Variables by Correlation\n(Red = Circular, Green = Valid)')
    ax1.axvline(x=0, color='black', linestyle='--', linewidth=0.5)
    ax1.grid(axis='x', alpha=0.3)
    
    # Plot 2: Circular vs Non-Circular
    circular_corr = corr_df[corr_df['is_circular']]['abs_correlation']
    valid_corr = corr_df[~corr_df['is_circular']]['abs_correlation']
    
    ax2.boxplot([circular_corr, valid_corr], labels=['Circular\nVariables', 'Valid\nVariables'])
    ax2.set_ylabel('Absolute Correlation with FormallyIncluded')
    ax2.set_title('Correlation Strength: Circular vs Valid Variables')
    ax2.grid(axis='y', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'circular_vs_valid_correlations.png', dpi=300, bbox_inches='tight')
    print(f"[OK] Saved visualization to {OUTPUT_DIR / 'circular_vs_valid_correlations.png'}")

# ============================================================================
# STEP 5: RECOMMENDATIONS
# ============================================================================

print("\n" + "="*80)
print("[STEP 5] Recommendations")
print("="*80)

recommendations = f"""
CIRCULAR VARIABLES ANALYSIS - RECOMMENDATIONS
==============================================

VARIABLES TO REMOVE (Circular Logic):
-------------------------------------
{chr(10).join([f'  [X] {var} - {CIRCULAR_VARIABLES[var]["reason"]}' for var in circular_found])}

VARIABLES TO KEEP (Valid Predictors):
-------------------------------------
All variables in these categories:
  [OK] Demographics (age, gender, education, marital status)
  [OK] Economic Status (income, wealth, primary money source)
  [OK] Geography (sector, region, state)
  [OK] Behavioral (savings frequency, running out of money, coping mechanisms)

NEW VARIABLES TO ADD (From Savings Behavior Analysis):
-------------------------------------------------------
  [+] Saves_Money - Indicates savings propensity without requiring formal account
  [+] Informal_Savings_Mode - Uses informal savings (NOT banks/mobile money)
  [+] Regular_Saver - Saves regularly (frequency indicator)
  [+] Diverse_Savings_Reasons - Saves for multiple purposes
  [+] Old_Age_Planning - Has financial plan for old age
  [+] Savings_Frequency_Score - Weighted savings frequency
  [+] Savings_Behavior_Score - Composite savings propensity indicator

NEXT STEPS:
-----------
1. Remove all circular variables from the modeling dataset
2. Merge savings behavior features from savings_behavior_results/
3. Retrain the logistic regression model with:
   - Valid existing variables (demographics, economic, geographic, behavioral)
   - New savings behavior variables (non-circular indicators)
4. Update dashboard to reflect new model
5. Regenerate population_data.json with new predictions

IMPACT:
-------
- Model will now measure PROPENSITY for inclusion, not existing inclusion
- Predictions will be more meaningful for policy interventions
- Savings behavior features provide behavioral signals without circularity
"""

print(recommendations)

# Save recommendations
with open(OUTPUT_DIR / 'RECOMMENDATIONS.md', 'w') as f:
    f.write(recommendations)

print(f"\n[OK] Saved recommendations to {OUTPUT_DIR / 'RECOMMENDATIONS.md'}")

print("\n" + "="*80)
print("ANALYSIS COMPLETE")
print("="*80)
