import pandas as pd

# Check the new variables
df = pd.read_csv('final_model_results/X_features_complete.csv')

new_vars = ['Has_NIN', 'Formal_Employment', 'Business_Income', 
            'Agricultural_Income', 'Passive_Income', 
            'Income_Diversity_Score', 'Digital_Access_Index']

print("="*80)
print("NEW VARIABLE STATISTICS")
print("="*80)

for var in new_vars:
    if var in df.columns:
        print(f"\n{var}:")
        print(f"  Mean: {df[var].mean():.4f}")
        print(f"  Std: {df[var].std():.4f}")
        print(f"  Min: {df[var].min():.4f}")
        print(f"  Max: {df[var].max():.4f}")
        print(f"  Unique values: {df[var].nunique()}")
        print(f"  Value counts:")
        print(df[var].value_counts().head())
    else:
        print(f"\n{var}: NOT FOUND")

# Check if all are zero
print("\n" + "="*80)
print("ISSUE DIAGNOSIS")
print("="*80)

all_zero = True
for var in new_vars:
    if var in df.columns:
        if df[var].sum() == 0:
            print(f"❌ {var}: ALL ZEROS")
        else:
            print(f"✅ {var}: HAS NON-ZERO VALUES")
            all_zero = False

if all_zero:
    print("\n⚠️  PROBLEM: All new variables are all zeros!")
    print("This means the column names in the original dataset don't match.")
    print("\nNeed to find the correct column names in dataset/A2F_2023_complete.csv")
