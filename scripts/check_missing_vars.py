import pandas as pd

# Load original dataset
df = pd.read_csv('dataset/A2F_2023_complete.csv')

print("="*80)
print("CHECKING MISSING VARIABLES IN MODEL")
print("="*80)

# 1. FORMAL ID (NIN)
print("\n=== 1. FORMAL ID (NIN) ===")
if 'NIN' in df.columns:
    print(f"NIN column EXISTS")
    print(df['NIN'].value_counts())
    print(f"% with NIN: {(df['NIN'].str.lower() == 'yes').sum() / len(df) * 100:.1f}%")
else:
    print("NIN column NOT FOUND")

# 2. EMPLOYMENT STATUS
print("\n=== 2. EMPLOYMENT STATUS ===")
employment_cols = [
    'Salary_from_Government_including_NYSC',
    'Salary_Wages_From_A_Business_Company',
    'Salary_Wages_From_An_Individual_With_Own_Business',
    'Salary_Wages_From_An_Individual_For_Chores'
]
for col in employment_cols:
    if col in df.columns:
        yes_count = (df[col].str.lower() == 'yes').sum()
        print(f"{col}: {yes_count:,} respondents ({yes_count/len(df)*100:.1f}%)")

# 3. INCOME SOURCES
print("\n=== 3. INCOME SOURCES ===")
income_sources = {
    'Business (Non-farming)': 'Own_Business_Trader_Non-farming',
    'Business (Farming produce)': 'Own_Business_Trader_Farming_Produce_Livestock',
    'Business (Agricultural inputs)': 'Own_Business_Trader_Agricultural_Inputs',
    'Business (Services)': 'Own_Business _Provide_service',
    'Subsistence farming': 'Subsistence_Small scale farming',
    'Commercial farming': 'Commercial_Large_scale_farming',
    'Rent (Passive)': 'Rent',
    'Pension (Passive)': 'Pension',
    'Interest on savings (Passive)': 'Interest_On_Savings',
    'Return on investments (Passive)': 'Return_On_Investments'
}

for label, col in income_sources.items():
    if col in df.columns:
        yes_count = (df[col].str.lower() == 'yes').sum()
        print(f"{label:35s}: {yes_count:5,} ({yes_count/len(df)*100:5.1f}%)")

# 4. DIGITAL ACCESS
print("\n=== 4. DIGITAL ACCESS ===")
digital_cols = {
    'Mobile Phone': 'Mobile Phone',
    'Reliable network': 'Reliable phone network?'
}
for label, col in digital_cols.items():
    if col in df.columns:
        print(f"\n{label}:")
        print(df[col].value_counts())
        yes_pct = (df[col].str.lower() == 'yes').sum() / len(df) * 100
        print(f"% with {label}: {yes_pct:.1f}%")

# Calculate composite variables
print("\n" + "="*80)
print("SUGGESTED DERIVED VARIABLES")
print("="*80)

# Formal employment
formal_emp_cols = [
    'Salary_from_Government_including_NYSC',
    'Salary_Wages_From_A_Business_Company'
]
has_formal_employment = df[formal_emp_cols].apply(
    lambda x: (x.str.lower() == 'yes').any(), axis=1
).sum()
print(f"\nFormal Employment (binary): {has_formal_employment:,} ({has_formal_employment/len(df)*100:.1f}%)")

# Business income
business_cols = [
    'Own_Business_Trader_Non-farming',
    'Own_Business_Trader_Farming_Produce_Livestock',
    'Own_Business _Provide_service'
]
has_business = df[[c for c in business_cols if c in df.columns]].apply(
    lambda x: (x.str.lower() == 'yes').any(), axis=1
).sum()
print(f"Business Income (binary): {has_business:,} ({has_business/len(df)*100:.1f}%)")

# Agricultural income
agric_cols = [
    'Subsistence_Small scale farming',
    'Commercial_Large_scale_farming',
    'Own_Business_Trader_Farming_Produce_Livestock',
    'Own_Business_Trader_Agricultural_Inputs'
]
has_agric = df[[c for c in agric_cols if c in df.columns]].apply(
    lambda x: (x.str.lower() == 'yes').any(), axis=1
).sum()
print(f"Agricultural Income (binary): {has_agric:,} ({has_agric/len(df)*100:.1f}%)")

# Passive income
passive_cols = ['Rent', 'Pension', 'Interest_On_Savings', 'Return_On_Investments']
has_passive = df[passive_cols].apply(
    lambda x: (x.str.lower() == 'yes').any(), axis=1
).sum()
print(f"Passive Income (binary): {has_passive:,} ({has_passive/len(df)*100:.1f}%)")

# Income diversity score
all_income_cols = formal_emp_cols + business_cols + agric_cols + passive_cols
income_diversity = df[[c for c in all_income_cols if c in df.columns]].apply(
    lambda x: (x.str.lower() == 'yes').sum(), axis=1
)
print(f"\nIncome Diversity Score (0-{len([c for c in all_income_cols if c in df.columns])}):")
print(income_diversity.value_counts().sort_index())
print(f"Mean diversity: {income_diversity.mean():.2f}")

# Digital access index
if 'Mobile Phone' in df.columns and 'Reliable phone network?' in df.columns:
    digital_index = (
        (df['Mobile Phone'].str.lower() == 'yes').astype(int) +
        (df['Reliable phone network?'].str.lower() == 'yes').astype(int)
    )
    print(f"\nDigital Access Index (0-2):")
    print(digital_index.value_counts().sort_index())
    print(f"Mean digital access: {digital_index.mean():.2f}")

print("\n" + "="*80)
print("RECOMMENDATION: Add these variables to the model!")
print("="*80)
