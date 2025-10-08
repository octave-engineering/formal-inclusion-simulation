"""
Export preprocessed EFInA population data for dashboard simulation
Creates a lightweight JSON file with all 15 features for 28k+ respondents
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path

EXCEL_PATH = Path(r"dataset\AF2023_Efina.xlsx")
SHEET_NAME = 0
OUTPUT_PATH = Path("dashboard/public/population_data.json")

# Feature engineering functions (same as EFINA_v2_clean.py)
FORMAL_EMPLOYMENT_COLS = [
    "Salary_from_Government_including_NYSC",
    "Salary_Wages_From_A_Business_Company",
]

AGRICULTURAL_COLS = [
    "Subsistence_Small scale farming",
    "Commercial_Large_scale_farming",
]

BUSINESS_COLS = [
    "Own_Business_Trader_Non-farming",
    "Own_Business _Provide_service",
]

PASSIVE_INCOME_COLS = [
    "Rent",
    "Pension",
    "Interest_On_Savings",
    "Return_On_Investments",
]

FINANCIAL_ACCESS_COLS = [
    "Is there a financial service agent close to where you live (home)? -",
    "Is there an atm close to where you live (home)?",
    "Is there a microfinance close to where you live (home)",
    "Is there a non interest service provider close to where you live?",
    "Is there a primary mortgage bank close to where you live",
]

MOBILE_ACCESS_COLS = [
    "Mobile Phone",
    "Reliable phone network?",
]

FORMAL_ID_COLS = [
    "NIN",
    "BVN",
]

ALL_INCOME_COLS = [
    "Salary_from_Government_including_NYSC",
    "Salary_Wages_From_A_Business_Company",
    "Salary_Wages_From_An_Individual_With_Own_Business",
    "Salary_Wages_From_An_Individual_For_Chores",
    "Subsistence_Small scale farming",
    "Commercial_Large_scale_farming",
    "Own_Business_Trader_Non-farming",
    "Own_Business_Trader_Farming_Produce_Livestock",
    "Own_Business_Trader_Agricultural_Inputs",
    "Own_Business _Provide_service",
    "Rent",
    "Pension",
    "Interest_On_Savings",
    "Return_On_Investments",
    "Government_Grant",
    "Drought_Relief",
    "Get_Money_From_Family_Friends (Students)",
    "Get_Money_From_Family_Friends(unemployed,\nnon -students)",
    "E9_19_Get_Money_From_Family_Friends(retired)",
]

EDUCATION_ORDER = {
    "before secondary school": 0,
    "no formal education": 0,
    "secondary school and above": 1,
    "tertiary": 2,
}

INCOME_ORDER = [
    "No income",
    "Below N15,000 per month",
    "N15,001 – N35,000 per month",
    "N35,001 – N55,000 per month",
    "N55,001 – N75,000 per month",
    "N75,001 – N95,000 per month",
    "N95,001 – N115,000 per month",
    "N115,001 – N135,000 per month",
    "N135,001 – N155,000 per month",
    "N155,001 – N175,000 per month",
    "N175,001 – N195,000 per month",
    "N195,001 – N215,000 per month",
    "N215,001 – N235,000 per month",
    "N235,001 – N255,000 per month",
    "N255,001 – N275,000 per month",
    "N275,001 – N295,000 per month",
    "N295,001 – N315,000 per month",
    "Above N315,000 per month",
    "Refused",
    "Don't know",
]

def normalize_yes_no(series):
    if pd.api.types.is_numeric_dtype(series):
        return pd.to_numeric(series, errors="coerce")
    s = series.astype(str).str.strip().str.lower()
    mapping = {
        "yes": 1, "y": 1, "1": 1, "true": 1,
        "no": 0, "n": 0, "0": 0, "false": 0,
        "nan": np.nan, "": np.nan,
    }
    return s.map(mapping)

def ordinal_encode_income(series):
    s = series.astype(str).str.strip()
    s = s.str.replace("\u2019", "'", regex=False)
    allowed = {k.lower(): i for i, k in enumerate(INCOME_ORDER)}
    return s.str.lower().map(allowed).astype("float")

print("Loading dataset...")
df = pd.read_excel(EXCEL_PATH, sheet_name=SHEET_NAME)
df.columns = [str(c).strip() for c in df.columns]

print(f"Dataset shape: {df.shape}")

# Convert all Yes/No columns to 0/1
binary_cols_all = (ALL_INCOME_COLS + FINANCIAL_ACCESS_COLS + 
                  MOBILE_ACCESS_COLS + FORMAL_ID_COLS + ["Bank_Account"])

for col in binary_cols_all:
    if col in df.columns:
        df[col] = normalize_yes_no(df[col])

print("\nEngineering features...")

# Ordinal encodings
df["Education_Ordinal"] = df["Education"].astype(str).str.strip().str.lower().map(EDUCATION_ORDER).astype(float)
df["Income_Level_Ordinal"] = ordinal_encode_income(df["Income_Level"]) if "Income_Level" in df.columns else np.nan
df["Gender_Male"] = (df["Gender"].astype(str).str.strip().str.lower() == "male").astype(float)
df["Age_18_Plus"] = (df["Age_Group"].astype(str).str.strip().str.contains("18", na=False)).astype(float)
df["Sector_Urban"] = (df["Sector"].astype(str).str.strip().str.lower() == "urban").astype(float)

# Composite features - Employment
formal_emp_df = df[[c for c in FORMAL_EMPLOYMENT_COLS if c in df.columns]]
df["Formal_Employment_Binary"] = (formal_emp_df.fillna(0).sum(axis=1) > 0).astype(float)

agri_df = df[[c for c in AGRICULTURAL_COLS if c in df.columns]]
df["Agricultural_Income_Binary"] = (agri_df.fillna(0).sum(axis=1) > 0).astype(float)

business_df = df[[c for c in BUSINESS_COLS if c in df.columns]]
df["Business_Income_Binary"] = (business_df.fillna(0).sum(axis=1) > 0).astype(float)

passive_df = df[[c for c in PASSIVE_INCOME_COLS if c in df.columns]]
df["Passive_Income_Binary"] = (passive_df.fillna(0).sum(axis=1) > 0).astype(float)

all_income_df = df[[c for c in ALL_INCOME_COLS if c in df.columns]]
df["Income_Diversity_Score"] = all_income_df.fillna(0).sum(axis=1)

# Financial access
access_df = df[[c for c in FINANCIAL_ACCESS_COLS if c in df.columns]]
df["Financial_Access_Index"] = access_df.fillna(0).mean(axis=1)
df["Access_Diversity_Score"] = access_df.fillna(0).sum(axis=1)

# Mobile readiness
mobile_df = df[[c for c in MOBILE_ACCESS_COLS if c in df.columns]]
df["Mobile_Digital_Readiness"] = (mobile_df.fillna(0).sum(axis=1) == len(MOBILE_ACCESS_COLS)).astype(float)

# Formal ID count
id_df = df[[c for c in FORMAL_ID_COLS if c in df.columns]]
df["Formal_ID_Count"] = id_df.fillna(0).sum(axis=1)

# Bank account
if "Bank_Account" in df.columns:
    df["Bank_Account"] = df["Bank_Account"].fillna(0)

# Target variable
if "Formally_Included" in df.columns:
    df["Formally_Included"] = pd.to_numeric(df["Formally_Included"], errors="coerce")

print("\nSelecting final features...")

# Feature columns for export
feature_cols = [
    "Education_Ordinal",
    "Income_Level_Ordinal",
    "Formal_Employment_Binary",
    "Agricultural_Income_Binary",
    "Business_Income_Binary",
    "Passive_Income_Binary",
    "Income_Diversity_Score",
    "Financial_Access_Index",
    "Access_Diversity_Score",
    "Mobile_Digital_Readiness",
    "Formal_ID_Count",
    "Bank_Account",
    "Gender_Male",
    "Age_18_Plus",
    "Sector_Urban",
    "Formally_Included",  # Include actual outcome for validation
]

# Keep only rows with valid target
mask = ~df["Formally_Included"].isna()
export_df = df.loc[mask, feature_cols].copy()

# Fill remaining NaNs
for col in export_df.columns:
    if col != "Formally_Included" and export_df[col].isna().any():
        median_val = export_df[col].median()
        export_df[col] = export_df[col].fillna(median_val if pd.notna(median_val) else 0)

print(f"\nExport dataset shape: {export_df.shape}")
print(f"Actual inclusion rate: {export_df['Formally_Included'].mean():.2%}")

# Convert to list of dictionaries for JSON
print("\nConverting to JSON...")
population_records = export_df.to_dict(orient='records')

# Create metadata
metadata = {
    "total_population": len(population_records),
    "baseline_inclusion_rate": float(export_df['Formally_Included'].mean()),
    "features": [col for col in feature_cols if col != "Formally_Included"],
    "survey_year": 2023,
    "survey_name": "EFInA Access to Financial Services in Nigeria",
}

# Combine metadata and data
output_data = {
    "metadata": metadata,
    "population": population_records
}

# Ensure output directory exists
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

# Save to JSON
print(f"\nSaving to {OUTPUT_PATH}...")
with open(OUTPUT_PATH, 'w') as f:
    json.dump(output_data, f)

file_size_mb = OUTPUT_PATH.stat().st_size / (1024 * 1024)
print(f"\n✓ Export complete!")
print(f"  File: {OUTPUT_PATH}")
print(f"  Size: {file_size_mb:.2f} MB")
print(f"  Records: {len(population_records):,}")
print(f"  Features: {len(feature_cols) - 1}")
print(f"  Baseline rate: {metadata['baseline_inclusion_rate']:.2%}")
