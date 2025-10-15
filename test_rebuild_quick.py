"""Quick test of the rebuild approach with just 1000 rows"""

import pandas as pd
import numpy as np

print("="*80)
print("QUICK TEST: Rebuild from Excel (1000 rows)")
print("="*80)

# Load small sample
print("\nLoading Excel sample...")
df = pd.read_excel('dataset/AF2023_Efina.xlsx', nrows=1000)
df.columns = df.columns.str.strip()
print(f"Loaded: {df.shape}")

# Test 7 new variables
print("\nTesting 7 new variables:")

# 1. NIN
if 'NIN' in df.columns:
    df['Has_NIN'] = (df['NIN'].str.lower().str.strip() == 'yes').astype(int)
    print(f"1. Has_NIN: {df['Has_NIN'].mean()*100:.1f}% have NIN")

# 2. Employment
emp_cols = [c for c in df.columns if 'Salary_from_Government' in c or 'Salary_Wages_From_A_Business_Company' in c]
if emp_cols:
    df['Formal_Employment'] = df[emp_cols].apply(
        lambda x: 1 if (x.str.lower().str.strip() == 'yes').any() else 0, axis=1
    )
    print(f"2. Formal_Employment: {df['Formal_Employment'].mean()*100:.1f}% formally employed")

# 3. Business
bus_cols = [c for c in df.columns if 'Own_Business_Trader_Non-farming' in c or 'Own_Business _Provide_service' in c]
if bus_cols:
    df['Business_Income'] = df[bus_cols].apply(
        lambda x: 1 if (x.str.lower().str.strip() == 'yes').any() else 0, axis=1
    )
    print(f"3. Business_Income: {df['Business_Income'].mean()*100:.1f}% have business income")

# 4. Agricultural
agric_cols = [c for c in df.columns if 'Small scale farming' in c or 'Large_scale_farming' in c]
if agric_cols:
    df['Agricultural_Income'] = df[agric_cols].apply(
        lambda x: 1 if (x.str.lower().str.strip() == 'yes').any() else 0, axis=1
    )
    print(f"4. Agricultural_Income: {df['Agricultural_Income'].mean()*100:.1f}% have agricultural income")

# 5. Passive
passive_cols = [c for c in df.columns if c in ['Rent', 'Pension', 'Interest_On_Savings', 'Return_On_Investments']]
if passive_cols:
    df['Passive_Income'] = df[passive_cols].apply(
        lambda x: 1 if (x.str.lower().str.strip() == 'yes').any() else 0, axis=1
    )
    print(f"5. Passive_Income: {df['Passive_Income'].mean()*100:.1f}% have passive income")

# 6. Income Diversity
all_income_cols = emp_cols + bus_cols + agric_cols + passive_cols
if all_income_cols:
    df['Income_Diversity_Score'] = df[all_income_cols].apply(
        lambda x: (x.str.lower().str.strip() == 'yes').sum(), axis=1
    )
    print(f"6. Income_Diversity_Score: Mean = {df['Income_Diversity_Score'].mean():.2f}")

# 7. Digital Access
df['Digital_Access_Index'] = 0
if 'Mobile Phone' in df.columns:
    df['Digital_Access_Index'] += (df['Mobile Phone'].str.lower().str.strip() == 'yes').astype(int)
if 'Reliable phone network?' in df.columns:
    df['Digital_Access_Index'] += (df['Reliable phone network?'].str.lower().str.strip() == 'yes').astype(int)
print(f"7. Digital_Access_Index: Mean = {df['Digital_Access_Index'].mean():.2f}")

print("\n" + "="*80)
print("✅ ALL 7 NEW VARIABLES SUCCESSFULLY CREATED!")
print("="*80)

# Show summary
new_vars = ['Has_NIN', 'Formal_Employment', 'Business_Income', 'Agricultural_Income',
            'Passive_Income', 'Income_Diversity_Score', 'Digital_Access_Index']

print("\nSummary:")
for var in new_vars:
    if var in df.columns:
        print(f"  {var}: Mean = {df[var].mean():.4f}, Nonzero = {(df[var] > 0).sum()}")

if all(var in df.columns for var in new_vars):
    if all(df[var].sum() > 0 for var in new_vars):
        print("\n✅ ALL VARIABLES HAVE NON-ZERO VALUES - Ready for full rebuild!")
    else:
        zero_vars = [var for var in new_vars if df[var].sum() == 0]
        print(f"\n⚠️  Some variables are all zeros: {zero_vars}")
else:
    missing = [var for var in new_vars if var not in df.columns]
    print(f"\n⚠️  Some variables weren't created: {missing}")
