import pandas as pd

# Load dataset columns only
df = pd.read_csv('dataset/A2F_2023_complete.csv', nrows=1)
cols = list(df.columns)

print("="*80)
print("SEARCHING FOR SPECIFIC COLUMNS")
print("="*80)

# Search patterns
searches = {
    'NIN / National ID': ['d3_1', 'd3-1', 'nin', 'national id', 'identity number'],
    'Mobile Phone': ['d3_11', 'd3-11', 'mobile phone', 'telephone mobile'],
    'Income Sources (e9)': ['e9_'],
    'Network': ['network', 'reliable'],
    'Internet': ['internet', 'data'],
}

for category, patterns in searches.items():
    print(f"\n{category}:")
    print("-" * 60)
    found = []
    for col in cols:
        for pattern in patterns:
            if pattern.lower() in col.lower():
                found.append(col)
                break
    
    if found:
        for i, col in enumerate(found[:10], 1):
            # Truncate long column names
            col_display = col if len(col) <= 70 else col[:67] + '...'
            print(f"  {i}. {col_display}")
        if len(found) > 10:
            print(f"  ... and {len(found) - 10} more")
    else:
        print("  [NOT FOUND]")

# Get all e9_ columns (income sources)
print("\n" + "="*80)
print("ALL INCOME SOURCE COLUMNS (e9_*)")
print("="*80)
e9_cols = [c for c in cols if c.startswith('e9_')]
for i, col in enumerate(e9_cols, 1):
    col_display = col if len(col) <= 70 else col[:67] + '...'
    print(f"{i:2d}. {col_display}")

# Get sample values for key columns
print("\n" + "="*80)
print("SAMPLE VALUES")
print("="*80)

df_sample = pd.read_csv('dataset/A2F_2023_complete.csv', nrows=5)

# Try to find NIN column
nin_candidates = [c for c in cols if 'd3_1' in c.lower() and 'nin' in c.lower()]
if nin_candidates:
    col = nin_candidates[0]
    print(f"\nNIN Column: {col[:50]}...")
    print(df_sample[col].value_counts())

# Try to find mobile phone
mobile_candidates = [c for c in cols if 'd3_11' in c.lower() or ('mobile' in c.lower() and 'phone' in c.lower())]
if mobile_candidates:
    col = mobile_candidates[0]
    print(f"\nMobile Phone Column: {col[:50]}...")
    print(df_sample[col].value_counts())

print("\n" + "="*80)
print("Column names saved for reference")
print("="*80)
