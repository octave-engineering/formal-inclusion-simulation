"""
Regenerate population_data.json with COMPLETE dataset (28,392 records)
Using the NEW model features (68 features: base + age groups + states + new variables)
"""

import pandas as pd
import json
import numpy as np

print("="*80)
print("REGENERATING POPULATION DATA FOR POLICY DASHBOARD")
print("="*80)

# Load the complete dataset with all features
print("\n[1] Loading complete dataset...")
# Load features (includes age groups and state dummies)
X_df = pd.read_csv('complete_model_results/X_features_complete.csv')
# Load target variable
y_df = pd.read_csv('complete_model_results/complete_dataset.csv')[['Formally_Included']]
# Get state names from complete dataset
state_series = pd.read_csv('complete_model_results/complete_dataset.csv')['state']

# Combine
df = pd.concat([X_df, y_df], axis=1)
df['state'] = state_series

# Convert boolean to int
bool_cols = ['age_25-34', 'age_35-44', 'age_45-54', 'age_55-64', 'age_65+']
for col in bool_cols:
    if col in df.columns:
        df[col] = df[col].astype(int)

print(f"[OK] Loaded {len(df):,} records with {len(df.columns)} columns")

# Features to include in population data
required_features = [
    # Demographics (5)
    'gender_male', 'urban',
    
    # Economic (4)
    'education_numeric', 'wealth_numeric', 'income_numeric',
    
    # Financial Behavior (8)
    'savings_frequency_numeric', 'money_shortage_frequency',
    'Saves_Money', 'Regular_Saver', 'Informal_Savings_Mode', 'Diverse_Savings_Reasons',
    'Old_Age_Planning', 'Savings_Frequency_Score', 'Savings_Behavior_Score',
    
    # NEW Income Sources (7)
    'Has_NIN', 'Formal_Employment', 'Business_Income',
    'Subsistence_Farming', 'Commercial_Farming', 'Passive_Income', 'Family_Friends_Support',
    'Income_Diversity_Score',
    
    # NEW Infrastructure (2)
    'Digital_Access_Index', 'Infrastructure_Access_Index',
    
    # Interaction Terms (3)
    'Subsist_x_Formal', 'Subsist_x_Business', 'Subsist_x_Urban',
    
    # Age Groups (5 dummies)
    'age_25-34', 'age_35-44', 'age_45-54', 'age_55-64', 'age_65+',
    
    # State (string, not dummies)
    'state',
    
    # Target variable
    'Formally_Included'
]

print("\n[2] Checking for required features...")
missing_features = [f for f in required_features if f not in df.columns]
if missing_features:
    print(f"   [WARNING] Missing features: {missing_features}")
    print("   These features will be set to 0")
    for feat in missing_features:
        df[feat] = 0
else:
    print(f"[OK] All {len(required_features)} features present in dataset")

# Select only required features
print("\n[3] Selecting features...")
population_df = df[required_features].copy()

# Convert to proper types
print("\n[4] Converting data types...")

# Binary features should be 0 or 1
binary_features = [
    'gender_male', 'urban', 'Saves_Money', 'Regular_Saver', 'Informal_Savings_Mode',
    'Diverse_Savings_Reasons', 'Old_Age_Planning', 'Has_NIN', 'Formal_Employment',
    'Business_Income', 'Subsistence_Farming', 'Commercial_Farming', 'Passive_Income',
    'Family_Friends_Support', 'Formally_Included',
    'age_25-34', 'age_35-44', 'age_45-54', 'age_55-64', 'age_65+',
    'Subsist_x_Formal', 'Subsist_x_Business', 'Subsist_x_Urban'
]

for feat in binary_features:
    if feat in population_df.columns:
        population_df[feat] = population_df[feat].astype(int)

# Numeric features
numeric_features = [
    'education_numeric', 'wealth_numeric', 'income_numeric',
    'savings_frequency_numeric', 'money_shortage_frequency',
    'Savings_Frequency_Score', 'Savings_Behavior_Score',
    'Income_Diversity_Score', 'Digital_Access_Index', 'Infrastructure_Access_Index'
]

for feat in numeric_features:
    if feat in population_df.columns:
        population_df[feat] = pd.to_numeric(population_df[feat], errors='coerce').fillna(0)

# State should be string
if 'state' in population_df.columns:
    population_df['state'] = population_df['state'].astype(str)

# Handle NaN values
print("\n[5] Handling missing values...")
population_df = population_df.fillna(0)

# Calculate baseline statistics
print("\n[6] Calculating baseline statistics...")
print("="*80)

formally_included_count = (population_df['Formally_Included'] == 1).sum()
baseline_rate = (formally_included_count / len(population_df)) * 100

print("\n[BASELINE STATISTICS]:")
print(f"   Total Population: {len(population_df):,}")
print(f"   Formally Included: {formally_included_count:,}")
print(f"   Baseline Rate: {baseline_rate:.2f}%")

# Demographics breakdown
print(f"\n[DEMOGRAPHICS]:")
male_pct = (population_df['gender_male'] == 1).sum() / len(population_df) * 100
urban_pct = (population_df['urban'] == 1).sum() / len(population_df) * 100
print(f"   Male: {male_pct:.1f}%")
print(f"   Urban: {urban_pct:.1f}%")

# Age groups
print(f"\n[AGE DISTRIBUTION]:")
age_groups = ['age_25-34', 'age_35-44', 'age_45-54', 'age_55-64', 'age_65+']
for ag in age_groups:
    if ag in population_df.columns:
        pct = (population_df[ag] == 1).sum() / len(population_df) * 100
        print(f"   {ag}: {pct:.1f}%")

# Income sources
print(f"\n[INCOME SOURCES]:")
income_sources = ['Formal_Employment', 'Business_Income', 'Subsistence_Farming', 
                  'Commercial_Farming', 'Passive_Income', 'Family_Friends_Support']
for src in income_sources:
    if src in population_df.columns:
        pct = (population_df[src] == 1).sum() / len(population_df) * 100
        print(f"   {src}: {pct:.1f}%")

# Key features
print(f"\n[KEY POLICY-RELEVANT FEATURES]:")
print(f"   Has NIN: {(population_df['Has_NIN'] == 1).sum() / len(population_df) * 100:.1f}%")
print(f"   Avg Education: {population_df['education_numeric'].mean():.2f}")
print(f"   Avg Wealth: {population_df['wealth_numeric'].mean():.2f}")
print(f"   Avg Income: NGN {population_df['income_numeric'].mean():,.0f}")
print(f"   Avg Digital Access: {population_df['Digital_Access_Index'].mean():.2f} (0-2)")
print(f"   Avg Infrastructure: {population_df['Infrastructure_Access_Index'].mean():.2f} (0-12)")

# State breakdown (top 10)
print(f"\n[TOP 10 STATES BY POPULATION]:")
state_counts = population_df['state'].value_counts().head(10)
for state, count in state_counts.items():
    pct = count / len(population_df) * 100
    print(f"   {state}: {count:,} ({pct:.1f}%)")

# Convert to JSON-friendly format
print("\n[7] Converting to JSON format...")
population_json = population_df.to_dict('records')

# Save to file
output_path = 'dashboard/public/population_data.json'
print(f"\n[8] Saving to {output_path}...")

with open(output_path, 'w') as f:
    json.dump(population_json, f, indent=2)

file_size = len(json.dumps(population_json)) / (1024 * 1024)  # MB
print(f"[OK] Saved {len(population_json):,} records ({file_size:.2f} MB)")

print("\n" + "="*80)
print("[OK] POPULATION DATA REGENERATION COMPLETE!")
print("="*80)
print(f"\nBaseline Inclusion Rate: {baseline_rate:.2f}%")
print(f"Total Features per Record: {len(required_features)}")
print(f"Ready for Policy Dashboard!")
