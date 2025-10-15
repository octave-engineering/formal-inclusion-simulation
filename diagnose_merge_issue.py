import pandas as pd

print("="*80)
print("DIAGNOSING MERGE ISSUE")
print("="*80)

# Load Excel (first 1000 rows for speed)
print("\n1. Loading Excel file...")
df_excel = pd.read_excel('dataset/AF2023_Efina.xlsx', nrows=1000)
df_excel.columns = df_excel.columns.str.strip()
print(f"   Excel loaded: {df_excel.shape}")
print(f"   Has respondent_serial: {'respondent_serial' in df_excel.columns}")
if 'respondent_serial' in df_excel.columns:
    print(f"   Respondent serial type: {df_excel['respondent_serial'].dtype}")
    print(f"   Sample serials: {df_excel['respondent_serial'].head().tolist()}")

# Load cleaned dataset
print("\n2. Loading cleaned dataset...")
df_clean = pd.read_csv('rebuilt_dataset/modeling_dataset_non_circular.csv', nrows=1000)
print(f"   Clean loaded: {df_clean.shape}")
print(f"   Has respondent_serial: {'respondent_serial' in df_clean.columns}")
if 'respondent_serial' in df_clean.columns:
    print(f"   Respondent serial type: {df_clean['respondent_serial'].dtype}")
    print(f"   Sample serials: {df_clean['respondent_serial'].head().tolist()}")

# Check overlap
print("\n3. Checking overlap...")
if 'respondent_serial' in df_excel.columns and 'respondent_serial' in df_clean.columns:
    excel_serials = set(df_excel['respondent_serial'])
    clean_serials = set(df_clean['respondent_serial'])
    overlap = excel_serials.intersection(clean_serials)
    print(f"   Excel unique serials: {len(excel_serials)}")
    print(f"   Clean unique serials: {len(clean_serials)}")
    print(f"   Overlap: {len(overlap)} ({len(overlap)/len(clean_serials)*100:.1f}%)")
    
    if len(overlap) == 0:
        print("\n   [PROBLEM] NO OVERLAP! The merge will fail.")
        print("   This explains why all new variables are zero - they're being filled with NaN then 0.")
    else:
        print(f"\n   [OK] Good overlap exists")
        
        # Try the merge
        print("\n4. Testing merge...")
        df_excel_test = df_excel[['respondent_serial', 'NIN']].copy()
        df_excel_test['Has_NIN'] = (df_excel_test['NIN'].str.lower().str.strip() == 'yes').astype(int)
        
        df_merged = df_clean.merge(df_excel_test[['respondent_serial', 'Has_NIN']], 
                                     on='respondent_serial', how='left')
        
        print(f"   Merged shape: {df_merged.shape}")
        print(f"   Has_NIN missing: {df_merged['Has_NIN'].isnull().sum()}")
        print(f"   Has_NIN mean: {df_merged['Has_NIN'].mean():.4f}")
        print(f"   Has_NIN distribution:\n{df_merged['Has_NIN'].value_counts()}")
else:
    print("   [PROBLEM] respondent_serial not found in one or both datasets")

print("\n" + "="*80)
