"""
Regenerate Population Data with Non-Circular Features
======================================================

This script creates a new population_data.json file with:
1. Only the 15 non-circular features
2. Savings behavior features merged from the complete dataset
3. New predictions using the updated model
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path
from sklearn.preprocessing import StandardScaler

# Configuration
MODELING_DATASET = 'rebuilt_dataset/modeling_dataset_non_circular.csv'
MODEL_CONFIG = 'new_model_results/model_config.json'
MODEL_COEFFICIENTS = 'new_model_results/model_coefficients.json'
OUTPUT_FILE = 'dashboard/public/population_data.json'
SAMPLE_SIZE = 10000  # Reduce from full dataset for performance

print("="*80)
print("REGENERATING POPULATION DATA")
print("="*80)

# ============================================================================
# STEP 1: LOAD DATA
# ============================================================================

print("\n[STEP 1] Loading data...")

# Load modeling dataset (already has all features we need)
df_merged = pd.read_csv(MODELING_DATASET)
print(f"Modeling dataset: {df_merged.shape}")

# Load model configuration
with open(MODEL_CONFIG, 'r') as f:
    model_config = json.load(f)

with open(MODEL_COEFFICIENTS, 'r') as f:
    coefficients = json.load(f)

print(f"Model features: {len(model_config['features'])}")

# ============================================================================
# STEP 2: VERIFY REQUIRED FEATURES
# ============================================================================

print("\n[STEP 2] Verifying required features...")

# Check for required columns
required_features = model_config['features']
missing_features = [f for f in required_features if f not in df_merged.columns]
if missing_features:
    print(f"WARNING: Missing features: {missing_features}")
    # Fill with defaults
    for feature in missing_features:
        df_merged[feature] = 0
else:
    print(f"All {len(required_features)} features found!")

# ============================================================================
# STEP 3: HANDLE MISSING VALUES
# ============================================================================

print("\n[STEP 3] Handling missing values...")

# Fill missing values with median
for col in required_features:
    if df_merged[col].isnull().sum() > 0:
        median_val = df_merged[col].median()
        df_merged[col] = df_merged[col].fillna(median_val)
        print(f"  Filled {col}: {df_merged[col].isnull().sum()} missing values with {median_val:.2f}")

# ============================================================================
# STEP 4: GENERATE PREDICTIONS
# ============================================================================

print("\n[STEP 4] Generating predictions...")

# Standardize features
scaler = StandardScaler()
scaler.mean_ = np.array(model_config['scaler_mean'])
scaler.scale_ = np.array(model_config['scaler_scale'])

X = df_merged[required_features].values
X_scaled = scaler.transform(X)

# Calculate predictions using logistic regression
def sigmoid(z):
    return 1 / (1 + np.exp(-z))

# Get coefficients in correct order
coef_values = [coefficients[feature] for feature in required_features]
intercept = coefficients['intercept']

# Calculate logits
logits = X_scaled @ coef_values + intercept

# Calculate probabilities
predictions = sigmoid(logits)

df_merged['prediction'] = predictions
df_merged['predicted_included'] = (predictions >= 0.5).astype(int)

print(f"Predictions generated: {len(predictions)}")
print(f"Mean prediction: {predictions.mean():.3f}")
print(f"Predicted inclusion rate: {df_merged['predicted_included'].mean():.3f}")

# ============================================================================
# STEP 5: SAMPLE AND PREPARE FOR EXPORT
# ============================================================================

print("\n[STEP 5] Sampling and preparing data...")

# Sample for performance (stratified by inclusion status)
if len(df_merged) > SAMPLE_SIZE:
    df_included = df_merged[df_merged['FormallyIncluded'] == 1].sample(
        n=min(SAMPLE_SIZE // 2, len(df_merged[df_merged['FormallyIncluded'] == 1])),
        random_state=42
    )
    df_not_included = df_merged[df_merged['FormallyIncluded'] == 0].sample(
        n=min(SAMPLE_SIZE // 2, len(df_merged[df_merged['FormallyIncluded'] == 0])),
        random_state=42
    )
    df_sample = pd.concat([df_included, df_not_included]).sample(frac=1, random_state=42)
    print(f"Sampled {len(df_sample)} records (stratified)")
else:
    df_sample = df_merged
    print(f"Using all {len(df_sample)} records")

# ============================================================================
# STEP 6: EXPORT TO JSON
# ============================================================================

print("\n[STEP 6] Exporting to JSON...")

# Prepare records for JSON
records = []
for idx, row in df_sample.iterrows():
    record = {
        # Demographics
        'education_numeric': float(row['education_numeric']),
        'gender_male': int(row['gender_male']),
        'urban': int(row['urban']),
        'Age_numeric': float(row['Age_numeric']),
        
        # Economic
        'wealth_numeric': float(row['wealth_numeric']),
        'income_numeric': float(row['income_numeric']),
        'runs_out_of_money': int(row['runs_out_of_money']),
        
        # Behavioral
        'savings_frequency_numeric': float(row['savings_frequency_numeric']),
        
        # Savings Behavior
        'Saves_Money': float(row['Saves_Money']),
        'Regular_Saver': float(row['Regular_Saver']),
        'Informal_Savings_Mode': float(row['Informal_Savings_Mode']),
        'Diverse_Savings_Reasons': float(row['Diverse_Savings_Reasons']),
        'Old_Age_Planning': float(row['Old_Age_Planning']),
        'Savings_Frequency_Score': float(row['Savings_Frequency_Score']),
        'Savings_Behavior_Score': float(row['Savings_Behavior_Score']),
        
        # Target and prediction
        'Formally_Included': float(row['FormallyIncluded']),
        'prediction': float(row['prediction']),
    }
    records.append(record)

# Create output directory if needed
output_path = Path(OUTPUT_FILE)
output_path.parent.mkdir(parents=True, exist_ok=True)

# Save to JSON
with open(output_path, 'w') as f:
    json.dump(records, f, indent=2)

print(f"\n[OK] Saved {len(records)} records to {output_path}")

# ============================================================================
# STEP 7: SUMMARY STATISTICS
# ============================================================================

print("\n" + "="*80)
print("SUMMARY STATISTICS")
print("="*80)

summary = f"""
Population Data Generation Complete
====================================

Dataset Size: {len(records):,} records

Feature Distributions:
----------------------
Demographics:
  - Education (avg): {df_sample['education_numeric'].mean():.2f}
  - Male: {df_sample['gender_male'].mean()*100:.1f}%
  - Urban: {df_sample['urban'].mean()*100:.1f}%
  - Age (avg): {df_sample['Age_numeric'].mean():.1f} years

Economic:
  - Wealth (avg): {df_sample['wealth_numeric'].mean():.2f}
  - Income (avg): NGN {df_sample['income_numeric'].mean():,.0f}
  - Runs out of money: {df_sample['runs_out_of_money'].mean()*100:.1f}%

Savings Behavior:
  - Saves Money: {df_sample['Saves_Money'].mean()*100:.1f}%
  - Regular Saver: {df_sample['Regular_Saver'].mean()*100:.1f}%
  - Old Age Planning: {df_sample['Old_Age_Planning'].mean()*100:.1f}%
  - Diverse Savings: {df_sample['Diverse_Savings_Reasons'].mean()*100:.1f}%

Inclusion Rates:
----------------
  - Actual (from data): {df_sample['FormallyIncluded'].mean()*100:.1f}%
  - Predicted (from model): {df_sample['predicted_included'].mean()*100:.1f}%
  - Average probability: {df_sample['prediction'].mean()*100:.1f}%

Output File: {str(output_path)}
File Size: {output_path.stat().st_size / 1024:.1f} KB

Next Steps:
-----------
1. Test dashboard with new population data
2. Verify predictions are working correctly
3. Test policy simulations
4. Deploy to production
"""

print(summary)

# Save summary
with open('population_data_generation_summary.txt', 'w') as f:
    f.write(summary)

print("\n[OK] Summary saved to population_data_generation_summary.txt")
