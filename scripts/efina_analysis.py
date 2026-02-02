"""
EFInA Formal Financial Inclusion Analysis (2018-2023)
Comprehensive analysis to identify and rank drivers of formal financial inclusion
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
from pathlib import Path
import json

warnings.filterwarnings('ignore')
plt.style.use('seaborn-v0_8-darkgrid')

# Create output directory
output_dir = Path('efina_analysis_results')
output_dir.mkdir(exist_ok=True)
(output_dir / 'figures').mkdir(exist_ok=True)

print("="*80)
print("EFINA FORMAL FINANCIAL INCLUSION ANALYSIS")
print("="*80)

# ============================================================================
# STEP 0: LOAD AND INSPECT DATA
# ============================================================================

print("\n[STEP 0] Loading Excel file...")
excel_path = 'dataset/recent_data.xlsx'
excel_file = pd.ExcelFile(excel_path)
sheet_names = excel_file.sheet_names

print(f"\nFound {len(sheet_names)} sheets:")
for i, sheet in enumerate(sheet_names, 1):
    print(f"  {i}. {sheet}")

# Load all sheets
all_sheets = {}
sheet_info = []

for sheet in sheet_names:
    print(f"\nLoading: {sheet}...", end=" ")
    df = pd.read_excel(excel_path, sheet_name=sheet)
    all_sheets[sheet] = df
    sheet_info.append({
        'sheet_name': sheet,
        'rows': df.shape[0],
        'columns': df.shape[1],
        'memory_mb': df.memory_usage(deep=True).sum() / 1024**2
    })
    print(f"✓ ({df.shape[0]} rows × {df.shape[1]} cols)")

# Save sheet information
sheet_info_df = pd.DataFrame(sheet_info)
sheet_info_df.to_csv(output_dir / 'sheet_information.csv', index=False)
print(f"\n✓ Saved sheet information")

# Identify main analysis sheet
print("\n" + "="*80)
print("IDENTIFYING MAIN ANALYSIS SHEET")
print("="*80)

main_candidates = []
for sheet in sheet_names:
    sheet_lower = sheet.lower()
    if any(term in sheet_lower for term in ['data', 'main', 'individual', 'respondent', 'adult']):
        main_candidates.append(sheet)
        print(f"  Candidate: {sheet} ({all_sheets[sheet].shape})")

if main_candidates:
    main_sheet = max(main_candidates, key=lambda x: all_sheets[x].shape[0])
else:
    main_sheet = max(sheet_names, key=lambda x: all_sheets[x].shape[0])

print(f"\n✓ Selected: {main_sheet}")
df_main = all_sheets[main_sheet].copy()

# Display first few rows and column information
print(f"\nShape: {df_main.shape}")
print(f"\nFirst 10 columns:")
for i, col in enumerate(df_main.columns[:10], 1):
    print(f"  {i}. {col} ({df_main[col].dtype})")

# ============================================================================
# STEP 0.1: SEARCH FOR KEY VARIABLES
# ============================================================================

print("\n" + "="*80)
print("SEARCHING FOR KEY VARIABLES")
print("="*80)

def search_columns(df, keywords, name="Variable"):
    """Search for columns matching keywords"""
    found = []
    for col in df.columns:
        col_lower = str(col).lower()
        if any(keyword in col_lower for keyword in keywords):
            found.append(col)
    
    print(f"\n{name} ({len(found)} found):")
    for col in found[:15]:  # Show first 15
        unique = df[col].nunique()
        print(f"  • {col}: {unique} unique values")
    
    return found

# Search for formal inclusion variable
formal_keywords = ['formal', 'bank', 'account', 'inclusion', 'banked', 'financial_service']
formal_vars = search_columns(df_main, formal_keywords, "Formal Inclusion Variables")

# Search for survey design variables
weight_vars = search_columns(df_main, ['weight'], "Survey Weight Variables")
strata_vars = search_columns(df_main, ['strat', 'stratum'], "Stratum Variables")
psu_vars = search_columns(df_main, ['psu', 'cluster', 'primary'], "PSU/Cluster Variables")

# Search for agent-related variables
agent_keywords = ['agent', 'branch', 'atm', 'pos', 'access', 'proximity', 'distance', 'outlet']
agent_vars = search_columns(df_main, agent_keywords, "Agent/Access Variables")

# Search for year variable
year_vars = search_columns(df_main, ['year'], "Year Variables")

# Search for demographic variables
demo_keywords = ['age', 'gender', 'sex', 'education', 'employ', 'income', 'occupation']
demo_vars = search_columns(df_main, demo_keywords, "Demographic Variables")

# Search for geographic variables
geo_keywords = ['region', 'state', 'zone', 'urban', 'rural', 'locality', 'geo']
geo_vars = search_columns(df_main, geo_keywords, "Geographic Variables")

# ============================================================================
# SAVE INSPECTION RESULTS
# ============================================================================

variable_search_results = {
    'formal_inclusion': formal_vars,
    'survey_weights': weight_vars,
    'survey_strata': strata_vars,
    'survey_psu': psu_vars,
    'agent_access': agent_vars,
    'year': year_vars,
    'demographics': demo_vars,
    'geography': geo_vars
}

with open(output_dir / 'variable_search_results.json', 'w') as f:
    json.dump(variable_search_results, f, indent=2)

print(f"\n✓ Saved variable search results to {output_dir / 'variable_search_results.json'}")

# ============================================================================
# PRINT ALL COLUMN NAMES FOR MANUAL INSPECTION
# ============================================================================

print("\n" + "="*80)
print(f"ALL COLUMN NAMES ({len(df_main.columns)} total)")
print("="*80)

for i, col in enumerate(df_main.columns, 1):
    dtype = df_main[col].dtype
    non_null = df_main[col].notna().sum()
    unique = df_main[col].nunique()
    print(f"{i:3d}. {col:50s} | {str(dtype):15s} | {non_null:8d} non-null | {unique:6d} unique")

# Save all columns with metadata
columns_metadata = pd.DataFrame({
    'column_name': df_main.columns,
    'dtype': df_main.dtypes.values,
    'non_null_count': df_main.notna().sum().values,
    'null_count': df_main.isnull().sum().values,
    'null_percentage': (df_main.isnull().sum() / len(df_main) * 100).values,
    'unique_values': [df_main[col].nunique() for col in df_main.columns],
    'sample_values': [str(df_main[col].dropna().head(3).tolist()) for col in df_main.columns]
})

columns_metadata.to_csv(output_dir / 'all_columns_metadata.csv', index=False)
print(f"\n✓ Saved all columns metadata to {output_dir / 'all_columns_metadata.csv'}")

# ============================================================================
# DISPLAY FIRST 10 ROWS
# ============================================================================

print("\n" + "="*80)
print("FIRST 10 ROWS OF MAIN DATASET")
print("="*80)
print(df_main.head(10))

# Save to CSV
df_main.head(50).to_csv(output_dir / 'data_sample_first_50_rows.csv', index=False)
print(f"\n✓ Saved first 50 rows to {output_dir / 'data_sample_first_50_rows.csv'}")

print("\n" + "="*80)
print("INITIAL DATA INSPECTION COMPLETE")
print("="*80)
print(f"\nNext steps:")
print(f"1. Review {output_dir / 'variable_search_results.json'} to identify key variables")
print(f"2. Review {output_dir / 'all_columns_metadata.csv'} for all column details")
print(f"3. Specify the formal inclusion rate variable for analysis")
print(f"4. Specify survey design variables (weights, strata, PSU) if applicable")
