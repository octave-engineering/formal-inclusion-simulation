import pandas as pd

# Load CSV
df = pd.read_csv('dataset/A2F_2023_complete.csv', low_memory=False)
df.columns = df.columns.str.strip()

print("=" * 60)
print("F7a1 COLUMN ANALYSIS")
print("=" * 60)

if 'f7a1' in df.columns:
    print(f"\n✅ Column 'f7a1' found!")
    print(f"\nData type: {df['f7a1'].dtype}")
    print(f"Total rows: {len(df)}")
    print(f"Non-null values: {df['f7a1'].notna().sum()}")
    print(f"Null values: {df['f7a1'].isna().sum()}")
    
    print(f"\nUnique values ({df['f7a1'].nunique()}):")
    print(df['f7a1'].unique())
    
    print(f"\nValue counts:")
    print(df['f7a1'].value_counts().sort_index())
    
    print(f"\nPercentage distribution:")
    print(df['f7a1'].value_counts(normalize=True).sort_index() * 100)
    
    # Try to map to numeric
    print(f"\nMapping to numeric (if needed):")
    print("1 = Monthly")
    print("2 = More than one month in last 12 months")
    print("3 = One month in past year")
    print("4 = Hasn't happened in last 12 months")
