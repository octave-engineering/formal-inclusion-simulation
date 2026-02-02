import pandas as pd

# Load Excel to check age columns
print("Loading Excel file...")
df = pd.read_excel('dataset/AF2023_Efina.xlsx')

print(f"\nDataset shape: {df.shape}")
print(f"\nAll columns containing 'age' (case-insensitive):")
age_related = [c for c in df.columns if 'age' in c.lower()]
for col in age_related:
    print(f"\n  Column: '{col}'")
    print(f"  Type: {df[col].dtype}")
    print(f"  Unique values: {df[col].nunique()}")
    if df[col].nunique() < 20:
        print(f"  Values: {df[col].unique()}")
    else:
        print(f"  Sample values: {df[col].head(10).tolist()}")
    print(f"  Non-null count: {df[col].notna().sum()} / {len(df)}")
