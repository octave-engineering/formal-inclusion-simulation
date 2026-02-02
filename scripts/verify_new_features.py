import pandas as pd

print("="*80)
print("VERIFYING NEW FEATURES CAN BE CREATED")
print("="*80)

# Load Excel
print("\n1. Loading Excel file...")
df = pd.read_excel('dataset/AF2023_Efina.xlsx', nrows=100)
df.columns = df.columns.str.strip()
print(f"   Loaded: {df.shape}")

# Check NIN
print("\n2. Checking NIN column...")
if 'NIN' in df.columns:
    print(f"   [OK] NIN column exists")
    df['Has_NIN'] = (df['NIN'].str.lower().str.strip() == 'yes').astype(int)
    print(f"   Has NIN: {df['Has_NIN'].sum()}/{len(df)} ({df['Has_NIN'].mean()*100:.1f}%)")
    print(f"   Sample values: {df['NIN'].value_counts()}")
else:
    print(f"   [FAIL] NIN column NOT FOUND")
    print(f"   Available columns: {list(df.columns)[:10]}")

# Check Mobile Phone
print("\n3. Checking Mobile Phone...")
if 'Mobile Phone' in df.columns:
    print(f"   [OK] Mobile Phone column exists")
    mobile_yes = (df['Mobile Phone'].str.lower().str.strip() == 'yes').sum()
    print(f"   Has mobile: {mobile_yes}/{len(df)} ({mobile_yes/len(df)*100:.1f}%)")
    print(f"   Sample values: {df['Mobile Phone'].value_counts()}")
else:
    print(f"   [FAIL] Mobile Phone column NOT FOUND")

# Check Salary columns
print("\n4. Checking Employment/Salary columns...")
salary_cols = [
    'Salary_from_Government_including_NYSC',
    'Salary_Wages_From_A_Business_Company'
]
for col in salary_cols:
    if col in df.columns:
        print(f"   [OK] {col}: exists")
        yes_count = (df[col].str.lower().str.strip() == 'yes').sum()
        print(f"        Yes: {yes_count}/{len(df)} ({yes_count/len(df)*100:.1f}%)")
    else:
        print(f"   [FAIL] {col}: NOT FOUND")

# Check Business columns
print("\n5. Checking Business Income columns...")
business_cols = [
    'Own_Business_Trader_Non-farming',
    'Own_Business _Provide_service'
]
for col in business_cols:
    if col in df.columns:
        print(f"   [OK] {col}: exists")
        yes_count = (df[col].str.lower().str.strip() == 'yes').sum()
        print(f"        Yes: {yes_count}/{len(df)} ({yes_count/len(df)*100:.1f}%)")
    else:
        print(f"   [FAIL] {col}: NOT FOUND")

# Check Passive Income
print("\n6. Checking Passive Income columns...")
passive_cols = ['Rent', 'Pension', 'Interest_On_Savings', 'Return_On_Investments']
for col in passive_cols:
    if col in df.columns:
        print(f"   [OK] {col}: exists")
        yes_count = (df[col].str.lower().str.strip() == 'yes').sum()
        print(f"        Yes: {yes_count}/{len(df)} ({yes_count/len(df)*100:.1f}%)")
    else:
        print(f"   [FAIL] {col}: NOT FOUND")

print("\n" + "="*80)
print("If all columns exist, the retraining should work!")
print("="*80)
