import pandas as pd

# Check age distribution in the features
df = pd.read_csv('complete_model_results/X_features_complete.csv')

age_cols = [c for c in df.columns if 'age_' in c]
print('Age columns:', age_cols)
print('\nAge group distributions:')
for col in age_cols:
    count = df[col].sum()
    pct = df[col].mean() * 100
    print(f'  {col}: {count:.0f} ({pct:.1f}%)')

print(f'\nTotal rows: {len(df)}')
print(f'Sum of all age dummies: {df[age_cols].sum(axis=1).mean():.2f} (should be ~1.0)')

# Check if everyone is in the reference group
reference_count = len(df) - df[age_cols].sum(axis=1).sum()
print(f'\nReference group (18-24): {reference_count:.0f} ({reference_count/len(df)*100:.1f}%)')
