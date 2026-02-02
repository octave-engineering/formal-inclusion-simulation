"""
Examine EFInA dataset columns to identify groupings and reduce dimensionality
"""
import pandas as pd
import numpy as np
from pathlib import Path

EXCEL_PATH = Path(r"dataset\AF2023_Efina.xlsx")
SHEET_NAME = 0

print("Loading dataset...")
df = pd.read_excel(EXCEL_PATH, sheet_name=SHEET_NAME)
df.columns = [str(c).strip() for c in df.columns]

print(f"\nDataset shape: {df.shape}")
print(f"Total columns: {len(df.columns)}")

# Display all columns with basic info
print("\n" + "="*80)
print("ALL COLUMNS")
print("="*80)

col_info = []
for col in df.columns:
    dtype = str(df[col].dtype)
    n_unique = df[col].nunique()
    n_missing = df[col].isna().sum()
    pct_missing = (n_missing / len(df)) * 100
    sample_values = df[col].dropna().head(3).tolist()
    
    col_info.append({
        'column': col,
        'dtype': dtype,
        'unique_values': n_unique,
        'missing_count': n_missing,
        'missing_pct': round(pct_missing, 2),
        'sample_values': str(sample_values)[:100]
    })
    
    print(f"{col:60s} | {dtype:10s} | Unique: {n_unique:5d} | Missing: {pct_missing:5.1f}%")

# Save to CSV for detailed inspection
col_df = pd.DataFrame(col_info)
col_df.to_csv('column_inventory.csv', index=False)
print(f"\n✓ Saved detailed column info to: column_inventory.csv")

# Group columns by keywords
print("\n" + "="*80)
print("POTENTIAL COLUMN GROUPINGS (by keyword)")
print("="*80)

keyword_groups = {
    'Salary/Wage': ['salary', 'wage', 'wages'],
    'Business/Trade': ['business', 'trader', 'trading', 'trade'],
    'Farming/Agriculture': ['farm', 'agricult', 'livestock', 'subsistence', 'commercial'],
    'Income Sources': ['income', 'earn', 'money', 'get_money', 'remittance'],
    'Financial Services Access': ['agent', 'atm', 'bank', 'microfinance', 'mortgage', 'financial_service'],
    'Mobile/Digital': ['mobile', 'phone', 'network', 'digital', 'internet'],
    'ID/Documentation': ['nin', 'bvn', 'id', 'identification', 'document'],
    'Savings/Investment': ['saving', 'investment', 'interest', 'return'],
    'Pension/Grant': ['pension', 'grant', 'relief', 'allowance'],
    'Family Support': ['family', 'friends', 'relatives', 'support'],
    'Demographics': ['age', 'gender', 'sex', 'education', 'marital'],
    'Geography': ['region', 'state', 'lga', 'sector', 'urban', 'rural', 'zone'],
    'Wealth/Assets': ['wealth', 'asset', 'own', 'ownership', 'rent'],
    'Account Types': ['account', 'transact'],
}

grouped_cols = {}
for group_name, keywords in keyword_groups.items():
    matches = []
    for col in df.columns:
        col_lower = col.lower()
        if any(kw in col_lower for kw in keywords):
            matches.append(col)
    if matches:
        grouped_cols[group_name] = matches
        print(f"\n{group_name} ({len(matches)} columns):")
        for col in matches[:10]:  # Show first 10
            print(f"  - {col}")
        if len(matches) > 10:
            print(f"  ... and {len(matches)-10} more")

# Calculate correlation for numeric columns to find redundancy
print("\n" + "="*80)
print("HIGH CORRELATION PAIRS (potential redundancy)")
print("="*80)

numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
if len(numeric_cols) > 1:
    corr_matrix = df[numeric_cols].corr().abs()
    
    # Find pairs with high correlation (>0.8)
    high_corr_pairs = []
    for i in range(len(corr_matrix.columns)):
        for j in range(i+1, len(corr_matrix.columns)):
            if corr_matrix.iloc[i, j] > 0.8:
                high_corr_pairs.append({
                    'col1': corr_matrix.columns[i],
                    'col2': corr_matrix.columns[j],
                    'correlation': round(corr_matrix.iloc[i, j], 3)
                })
    
    if high_corr_pairs:
        print(f"\nFound {len(high_corr_pairs)} highly correlated pairs:")
        for pair in high_corr_pairs[:20]:  # Show first 20
            print(f"  {pair['col1']:40s} <-> {pair['col2']:40s} : {pair['correlation']}")
    else:
        print("No highly correlated pairs found (threshold > 0.8)")

# Save grouped columns
import json
with open('column_groupings.json', 'w') as f:
    json.dump(grouped_cols, f, indent=2)
print(f"\n✓ Saved column groupings to: column_groupings.json")

print("\n" + "="*80)
print("RECOMMENDATIONS")
print("="*80)
print("""
1. DIMENSIONALITY REDUCTION METHODS:
   - PCA (Principal Component Analysis): Extract key components from correlated features
   - Factor Analysis: Identify latent factors underlying related variables
   - Feature Grouping: Aggregate similar columns into composite scores
   
2. FEATURE SELECTION METHODS:
   - Variance Threshold: Remove low-variance features
   - Correlation Filter: Remove redundant features with high correlation
   - Recursive Feature Elimination (RFE): Iteratively remove least important features
   - LASSO Regularization: Automatic feature selection via L1 penalty
   
3. DOMAIN-DRIVEN AGGREGATION (Recommended):
   - Create composite indices for each major concept
   - Examples:
     * Income_Diversity_Score = count of income sources
     * Financial_Access_Index = mean of access-related binary columns
     * Formal_Employment_Score = weighted sum of formal employment sources
     * Education_Level = ordinal encoding
     
4. TREE-BASED FEATURE IMPORTANCE:
   - Use Random Forest/XGBoost to rank all features
   - Keep only top N most important features
   - Retrain models on reduced feature set
""")

print("\n✓ Analysis complete")
