"""
Calculate actual survey averages for each feature from EFInA 2023 dataset
These will be used as realistic defaults in the dashboard
"""

import pandas as pd
import numpy as np
from pathlib import Path

EXCEL_PATH = Path(r"dataset\AF2023_Efina.xlsx")
SHEET_NAME = 0

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

print("Loading EFInA 2023 dataset...")
df = pd.read_excel(EXCEL_PATH, sheet_name=SHEET_NAME)
df.columns = [str(c).strip() for c in df.columns]

print(f"Dataset shape: {df.shape}")
print(f"Baseline formal inclusion rate: {df['Formally_Included'].mean():.2%}\n")

# Calculate averages for each feature group
print("="*80)
print("SURVEY AVERAGES FOR DASHBOARD DEFAULTS")
print("="*80)

# 1. Education
print("\n1. EDUCATION")
education_counts = df['Education'].value_counts(dropna=False)
print(education_counts)
education_map = {
    "before secondary school": 0,
    "no formal education": 0,
    "secondary school and above": 1,
    "tertiary": 2,
}
df['Education_Ordinal_calc'] = df['Education'].astype(str).str.strip().str.lower().map(education_map)
edu_avg = df['Education_Ordinal_calc'].mean()
edu_mode = df['Education_Ordinal_calc'].mode()[0] if len(df['Education_Ordinal_calc'].mode()) > 0 else 1
print(f"Average Education Level (0-3): {edu_avg:.2f}")
print(f"Mode Education Level: {edu_mode}")

# 2. Age
print("\n2. AGE")
age_counts = df['Age_Group'].value_counts(dropna=False)
print(age_counts)
df['Age_18_Plus_calc'] = df['Age_Group'].astype(str).str.contains("18", na=False).astype(float)
age_avg = df['Age_18_Plus_calc'].mean()
print(f"Percentage 18+: {age_avg:.2%}")

# 3. Gender
print("\n3. GENDER")
gender_counts = df['Gender'].value_counts(dropna=False)
print(gender_counts)
df['Gender_Male_calc'] = (df['Gender'].astype(str).str.strip().str.lower() == "male").astype(float)
gender_avg = df['Gender_Male_calc'].mean()
print(f"Percentage Male: {gender_avg:.2%}")

# 4. Sector
print("\n4. SECTOR")
sector_counts = df['Sector'].value_counts(dropna=False)
print(sector_counts)
df['Sector_Urban_calc'] = (df['Sector'].astype(str).str.strip().str.lower() == "urban").astype(float)
sector_avg = df['Sector_Urban_calc'].mean()
print(f"Percentage Urban: {sector_avg:.2%}")

# 5. Formal ID (NIN, BVN)
print("\n5. FORMAL ID")
df['NIN_calc'] = normalize_yes_no(df['NIN'])
df['BVN_calc'] = normalize_yes_no(df['BVN'])
nin_rate = df['NIN_calc'].mean()
bvn_rate = df['BVN_calc'].mean()
id_count_avg = (df['NIN_calc'].fillna(0) + df['BVN_calc'].fillna(0)).mean()
print(f"NIN Rate: {nin_rate:.2%}")
print(f"BVN Rate: {bvn_rate:.2%}")
print(f"Average ID Count (0-2): {id_count_avg:.2f}")

# 6. Bank Account
print("\n6. BANK ACCOUNT")
df['Bank_Account_calc'] = normalize_yes_no(df['Bank_Account'])
bank_rate = df['Bank_Account_calc'].mean()
print(f"Bank Account Rate: {bank_rate:.2%}")

# 7. Mobile Digital Readiness
print("\n7. MOBILE DIGITAL")
df['Mobile_Phone_calc'] = normalize_yes_no(df['Mobile Phone'])
mobile_rate = df['Mobile_Phone_calc'].mean()
print(f"Mobile Phone Ownership: {mobile_rate:.2%}")
if 'Reliable phone network?' in df.columns:
    df['Network_calc'] = df['Reliable phone network?'].astype(str).str.lower().str.contains('yes', na=False).astype(float)
    network_rate = df['Network_calc'].mean()
    print(f"Reliable Network: {network_rate:.2%}")
    mobile_readiness = ((df['Mobile_Phone_calc'].fillna(0) == 1) & (df['Network_calc'].fillna(0) == 1)).mean()
    print(f"Mobile Digital Readiness (both): {mobile_readiness:.2%}")

# 8. Financial Access
print("\n8. FINANCIAL ACCESS")
access_cols = [
    "Is there a financial service agent close to where you live (home)? -",
    "Is there an atm close to where you live (home)?",
    "Is there a microfinance close to where you live (home)",
    "Is there a non interest service provider close to where you live?",
    "Is there a primary mortgage bank close to where you live",
]
access_rates = {}
for col in access_cols:
    if col in df.columns:
        df[f'{col}_calc'] = normalize_yes_no(df[col])
        rate = df[f'{col}_calc'].mean()
        access_rates[col] = rate
        print(f"{col[:50]}: {rate:.2%}")

if access_rates:
    access_index_avg = np.mean(list(access_rates.values()))
    access_diversity_avg = sum([df[f'{col}_calc'].fillna(0) for col in access_cols if col in df.columns]).mean()
    print(f"\nFinancial Access Index (mean): {access_index_avg:.2%}")
    print(f"Access Diversity Score (avg count): {access_diversity_avg:.2f}")

# 9. Income Sources
print("\n9. INCOME SOURCES")

formal_employment_cols = [
    "Salary_from_Government_including_NYSC",
    "Salary_Wages_From_A_Business_Company",
]
informal_cols = [
    "Salary_Wages_From_An_Individual_With_Own_Business",
    "Salary_Wages_From_An_Individual_For_Chores",
]
agricultural_cols = [
    "Subsistence_Small scale farming",
    "Commercial_Large_scale_farming",
]
business_cols = [
    "Own_Business_Trader_Non-farming",
    "Own_Business _Provide_service",
]
passive_cols = [
    "Rent",
    "Pension",
    "Interest_On_Savings",
    "Return_On_Investments",
]

# Formal employment
formal_dfs = []
for col in formal_employment_cols:
    if col in df.columns:
        df[f'{col}_calc'] = normalize_yes_no(df[col])
        formal_dfs.append(df[f'{col}_calc'].fillna(0))
if formal_dfs:
    formal_employment_rate = (pd.concat(formal_dfs, axis=1).sum(axis=1) > 0).mean()
    print(f"Formal Employment Rate: {formal_employment_rate:.2%}")

# Agricultural
agri_dfs = []
for col in agricultural_cols:
    if col in df.columns:
        df[f'{col}_calc'] = normalize_yes_no(df[col])
        agri_dfs.append(df[f'{col}_calc'].fillna(0))
if agri_dfs:
    agricultural_rate = (pd.concat(agri_dfs, axis=1).sum(axis=1) > 0).mean()
    print(f"Agricultural Income Rate: {agricultural_rate:.2%}")

# Business
business_dfs = []
for col in business_cols:
    if col in df.columns:
        df[f'{col}_calc'] = normalize_yes_no(df[col])
        business_dfs.append(df[f'{col}_calc'].fillna(0))
if business_dfs:
    business_rate = (pd.concat(business_dfs, axis=1).sum(axis=1) > 0).mean()
    print(f"Business Income Rate: {business_rate:.2%}")

# Passive
passive_dfs = []
for col in passive_cols:
    if col in df.columns:
        df[f'{col}_calc'] = normalize_yes_no(df[col])
        passive_dfs.append(df[f'{col}_calc'].fillna(0))
if passive_dfs:
    passive_rate = (pd.concat(passive_dfs, axis=1).sum(axis=1) > 0).mean()
    print(f"Passive Income Rate: {passive_rate:.2%}")

# Income diversity
all_income_cols = (formal_employment_cols + informal_cols + agricultural_cols + 
                   business_cols + passive_cols)
income_dfs = []
for col in all_income_cols:
    if col in df.columns:
        if f'{col}_calc' not in df.columns:
            df[f'{col}_calc'] = normalize_yes_no(df[col])
        income_dfs.append(df[f'{col}_calc'].fillna(0))
if income_dfs:
    income_diversity_avg = pd.concat(income_dfs, axis=1).sum(axis=1).mean()
    print(f"Average Income Diversity Score: {income_diversity_avg:.2f}")

# 10. Income Level
print("\n10. INCOME LEVEL")
if 'Income_Level' in df.columns:
    income_counts = df['Income_Level'].value_counts().head(10)
    print(income_counts)
    
    income_order = [
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
    income_map = {k.lower(): i for i, k in enumerate(income_order)}
    df['Income_Level_Ordinal_calc'] = df['Income_Level'].astype(str).str.strip().str.lower().str.replace("\u2019", "'").map(income_map)
    income_avg = df['Income_Level_Ordinal_calc'].mean()
    income_median = df['Income_Level_Ordinal_calc'].median()
    print(f"Average Income Level (0-19): {income_avg:.2f}")
    print(f"Median Income Level: {income_median:.0f}")

# Summary
print("\n" + "="*80)
print("RECOMMENDED DEFAULT VALUES FOR DASHBOARD")
print("="*80)

defaults = {
    "Education_Ordinal": round(edu_avg, 1),
    "Income_Level_Ordinal": round(income_avg, 0) if 'income_avg' in locals() else 5,
    "Formal_Employment_Binary": 1 if formal_employment_rate > 0.5 else 0,
    "Agricultural_Income_Binary": 1 if agricultural_rate > 0.5 else 0,
    "Business_Income_Binary": 1 if business_rate > 0.5 else 0,
    "Passive_Income_Binary": 1 if passive_rate > 0.5 else 0,
    "Income_Diversity_Score": round(income_diversity_avg, 1),
    "Financial_Access_Index": round(access_index_avg, 2),
    "Access_Diversity_Score": round(access_diversity_avg, 1),
    "Mobile_Digital_Readiness": 1 if mobile_readiness > 0.5 else 0,
    "Formal_ID_Count": round(id_count_avg, 1),
    "Bank_Account": 1 if bank_rate > 0.5 else 0,
    "Gender_Male": 1 if gender_avg > 0.5 else 0,
    "Age_18_Plus": 1 if age_avg > 0.5 else 0,
    "Sector_Urban": 1 if sector_avg > 0.5 else 0,
}

print("\nJavaScript object for dashboard:")
print("const SURVEY_DEFAULTS = {")
for key, value in defaults.items():
    print(f"  {key}: {value},")
print("}")

print("\n" + "="*80)
print("DETAILED STATISTICS")
print("="*80)
print(f"\nEducation (0-3 scale): avg={edu_avg:.2f}")
print(f"Age 18+: {age_avg:.2%}")
print(f"Male Gender: {gender_avg:.2%}")
print(f"Urban Sector: {sector_avg:.2%}")
print(f"Formal ID Count (0-2): {id_count_avg:.2f}")
print(f"Bank Account: {bank_rate:.2%}")
print(f"Mobile Digital Readiness: {mobile_readiness:.2%}")
print(f"Financial Access Index: {access_index_avg:.2%}")
print(f"Access Diversity Score: {access_diversity_avg:.2f}")
print(f"Formal Employment: {formal_employment_rate:.2%}")
print(f"Business Income: {business_rate:.2%}")
print(f"Agricultural Income: {agricultural_rate:.2%}")
print(f"Passive Income: {passive_rate:.2%}")
print(f"Income Diversity Score: {income_diversity_avg:.2f}")
if 'income_avg' in locals():
    print(f"Income Level (0-19): {income_avg:.2f}")

print("\n✓ Analysis complete")
