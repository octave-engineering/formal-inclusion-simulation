import pandas as pd

# Load just the column names
df = pd.read_csv('dataset/A2F_2023_complete.csv', nrows=0)
cols = list(df.columns)

print("="*80)
print(f"Total columns in dataset: {len(cols)}")
print("="*80)

# Search for specific patterns
searches = {
    'NIN': ['nin', 'national id', 'identity', 'd3_1'],
    'Mobile Phone': ['mobile', 'phone', 'd3_11', 'telephone'],
    'Employment/Salary': ['salary', 'wage', 'employ', 'government', 'e9'],
    'Business': ['business', 'trader', 'own business'],
    'Farming': ['farm', 'agricultural', 'livestock'],
    'Passive Income': ['rent', 'pension', 'interest', 'investment', 'return on'],
    'Network': ['network', 'reliable'],
}

for category, patterns in searches.items():
    print(f"\n{'='*80}")
    print(f"{category}:")
    print('='*80)
    found = []
    for col in cols:
        for pattern in patterns:
            if pattern.lower() in col.lower():
                found.append(col)
                break
    
    if found:
        # Show first 15 matching columns
        for i, col in enumerate(found[:15], 1):
            # Clean up display
            col_display = col[:75] + '...' if len(col) > 75 else col
            print(f"{i:2d}. {col_display}")
        if len(found) > 15:
            print(f"    ... and {len(found) - 15} more")
    else:
        print("  [NOT FOUND]")

# Check if we have the inventory file which has cleaner names
print("\n" + "="*80)
print("CHECKING COLUMN_INVENTORY.CSV")
print("="*80)

try:
    inv = pd.read_csv('column_inventory.csv')
    print("Found column_inventory.csv!")
    print("\nKey columns from inventory:")
    key_cols = inv[inv['column'].str.contains('NIN|Mobile|Salary|Business|farm|Rent|Pension|Interest', case=False, na=False)]
    for _, row in key_cols.iterrows():
        print(f"  - {row['column']}")
    
    # These are the actual column names we should use!
    print("\n✅ USE THESE COLUMN NAMES:")
    print("  NIN: 'NIN'")
    print("  Mobile: 'Mobile Phone'")
    print("  Network: 'Reliable phone network?'")
    print("  Salary (Gov): 'Salary_from_Government_including_NYSC'")
    print("  Salary (Company): 'Salary_Wages_From_A_Business_Company'")
    print("  ... etc (from column_inventory.csv)")
    
except Exception as e:
    print(f"Could not load column_inventory.csv: {e}")

# Check if original dataset has these simpler names
print("\n" + "="*80)
print("CHECKING IF SIMPLE NAMES EXIST IN A2F_2023")
print("="*80)

simple_names = ['NIN', 'Mobile Phone', 'Reliable phone network?', 
                'Salary_from_Government_including_NYSC',
                'Salary_Wages_From_A_Business_Company']

for name in simple_names:
    if name in cols:
        print(f"✅ {name}: EXISTS")
    else:
        print(f"❌ {name}: NOT FOUND")
        # Try to find similar
        similar = [c for c in cols if name.lower().replace(' ', '').replace('_', '') in c.lower().replace(' ', '').replace('_', '')][:2]
        if similar:
            print(f"   Similar: {similar[0][:60]}")
