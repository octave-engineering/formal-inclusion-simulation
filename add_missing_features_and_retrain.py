"""
Add Missing Features and Retrain Model
=======================================

This script adds 7 critical missing variables to the dataset and retrains
the model with the complete feature set (22 base + 36 states = 58 features).

Missing Variables Being Added:
1. Has_NIN - National ID card ownership
2. Formal_Employment - Salary/wages from government or company
3. Business_Income - Owns/operates business
4. Agricultural_Income - Farming income
5. Passive_Income - Rent, pension, interest, investments
6. Income_Diversity_Score - Number of income sources (0-13)
7. Digital_Access_Index - Mobile phone + network access (0-2)
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, roc_curve
from sklearn.preprocessing import StandardScaler
from pathlib import Path
import json

# Configuration
OUTPUT_DIR = Path('final_model_results')
OUTPUT_DIR.mkdir(exist_ok=True)

print("="*80)
print("ADDING MISSING FEATURES AND RETRAINING MODEL")
print("="*80)

# ============================================================================
# STEP 1: LOAD ORIGINAL DATASET
# ============================================================================

print("\n[STEP 1] Loading original dataset...")

# Load the EXCEL file which has clean column names
print("Loading from Excel file (this may take a minute)...")
df = pd.read_excel('dataset/AF2023_Efina.xlsx')
# Strip whitespace from column names
df.columns = df.columns.str.strip()
print(f"Original dataset loaded from Excel: {df.shape}")

# Load the cleaned dataset to get the FormallyIncluded target
df_clean = pd.read_csv('rebuilt_dataset/modeling_dataset_non_circular.csv')
print(f"Clean dataset loaded: {df_clean.shape}")

# ============================================================================
# STEP 2: ENGINEER MISSING FEATURES
# ============================================================================

print("\n[STEP 2] Engineering missing features...")

# 1. HAS NIN CARD
print("\n1. Has_NIN (National ID Card)...")
if 'NIN' in df.columns:
    df['Has_NIN'] = (df['NIN'].str.lower().str.strip() == 'yes').astype(int)
    nin_pct = df['Has_NIN'].mean() * 100
    print(f"   ✅ Created Has_NIN: {nin_pct:.1f}% have NIN card")
else:
    print("   ⚠️  NIN column not found, setting to 0")
    df['Has_NIN'] = 0

# 2. FORMAL EMPLOYMENT
print("\n2. Formal_Employment...")
formal_emp_cols = [
    'Salary_from_Government_including_NYSC',
    'Salary_Wages_From_A_Business_Company',
    'Salary_Wages_From_An_Individual_With_Own_Business',
    'Salary_Wages_From_An_Individual_For_Chores'
]
existing_cols = [c for c in formal_emp_cols if c in df.columns]
if existing_cols:
    df['Formal_Employment'] = df[existing_cols].apply(
        lambda x: 1 if (x.str.lower().str.strip() == 'yes').any() else 0, axis=1
    )
    emp_pct = df['Formal_Employment'].mean() * 100
    print(f"   ✅ Created Formal_Employment: {emp_pct:.1f}% formally employed")
else:
    print("   ⚠️  Employment columns not found, setting to 0")
    df['Formal_Employment'] = 0

# 3. BUSINESS INCOME
print("\n3. Business_Income...")
business_cols = [
    'Own_Business_Trader_Non-farming',
    'Own_Business_Trader_Farming_Produce_Livestock',
    'Own_Business _Provide_service'
]
existing_cols = [c for c in business_cols if c in df.columns]
if existing_cols:
    df['Business_Income'] = df[existing_cols].apply(
        lambda x: 1 if (x.str.lower().str.strip() == 'yes').any() else 0, axis=1
    )
    bus_pct = df['Business_Income'].mean() * 100
    print(f"   ✅ Created Business_Income: {bus_pct:.1f}% have business income")
else:
    print("   ⚠️  Business columns not found, setting to 0")
    df['Business_Income'] = 0

# 4. AGRICULTURAL INCOME
print("\n4. Agricultural_Income...")
agric_cols = [
    'Subsistence_Small scale farming',
    'Commercial_Large_scale_farming',
    'Own_Business_Trader_Farming_Produce_Livestock',
    'Own_Business_Trader_Agricultural_Inputs'
]
existing_cols = [c for c in agric_cols if c in df.columns]
if existing_cols:
    df['Agricultural_Income'] = df[existing_cols].apply(
        lambda x: 1 if (x.str.lower().str.strip() == 'yes').any() else 0, axis=1
    )
    agric_pct = df['Agricultural_Income'].mean() * 100
    print(f"   ✅ Created Agricultural_Income: {agric_pct:.1f}% have agricultural income")
else:
    print("   ⚠️  Agricultural columns not found, setting to 0")
    df['Agricultural_Income'] = 0

# 5. PASSIVE INCOME
print("\n5. Passive_Income...")
passive_cols = ['Rent', 'Pension', 'Interest_On_Savings', 'Return_On_Investments']
existing_cols = [c for c in passive_cols if c in df.columns]
if existing_cols:
    df['Passive_Income'] = df[existing_cols].apply(
        lambda x: 1 if (x.str.lower().str.strip() == 'yes').any() else 0, axis=1
    )
    passive_pct = df['Passive_Income'].mean() * 100
    print(f"   ✅ Created Passive_Income: {passive_pct:.1f}% have passive income")
else:
    print("   ⚠️  Passive income columns not found, setting to 0")
    df['Passive_Income'] = 0

# 6. INCOME DIVERSITY SCORE
print("\n6. Income_Diversity_Score...")
# Count all income sources
all_income_cols = (
    formal_emp_cols + business_cols + agric_cols + passive_cols +
    ['Get_Money_From_Family_Friends (Students)', 
     'Get_Money_From_Family_Friends(unemployed, \nnon -students)',
     'E9_19_Get_Money_From_Family_Friends(retired)']
)
existing_cols = [c for c in all_income_cols if c in df.columns]
if existing_cols:
    df['Income_Diversity_Score'] = df[existing_cols].apply(
        lambda x: (x.str.lower().str.strip() == 'yes').sum(), axis=1
    )
    print(f"   ✅ Created Income_Diversity_Score")
    print(f"      Mean diversity: {df['Income_Diversity_Score'].mean():.2f}")
    print(f"      Distribution: {dict(df['Income_Diversity_Score'].value_counts().sort_index().head())}")
else:
    print("   ⚠️  Income source columns not found, setting to 0")
    df['Income_Diversity_Score'] = 0

# 7. DIGITAL ACCESS INDEX
print("\n7. Digital_Access_Index...")
df['Digital_Access_Index'] = 0

# Mobile phone
if 'Mobile Phone' in df.columns:
    df['Digital_Access_Index'] += (df['Mobile Phone'].str.lower().str.strip() == 'yes').astype(int)
    mobile_pct = (df['Mobile Phone'].str.lower().str.strip() == 'yes').mean() * 100
    print(f"   ✅ Mobile Phone: {mobile_pct:.1f}% have mobile phone")

# Reliable network
if 'Reliable phone network?' in df.columns:
    df['Digital_Access_Index'] += (df['Reliable phone network?'].str.lower().str.strip() == 'yes').astype(int)
    network_pct = (df['Reliable phone network?'].str.lower().str.strip() == 'yes').mean() * 100
    print(f"   ✅ Reliable Network: {network_pct:.1f}% have reliable network")

print(f"   ✅ Created Digital_Access_Index (0-2)")
print(f"      Mean: {df['Digital_Access_Index'].mean():.2f}")
print(f"      Distribution: {dict(df['Digital_Access_Index'].value_counts().sort_index())}")

# ============================================================================
# STEP 3: MERGE WITH EXISTING FEATURES
# ============================================================================

print("\n[STEP 3] Merging with existing features...")

# Get base features from clean dataset
base_features = [
    'gender_male', 'Age_numeric', 'education_numeric', 'income_numeric',
    'wealth_numeric', 'urban', 'savings_frequency_numeric', 'runs_out_of_money',
    'Saves_Money', 'Informal_Savings_Mode', 'Regular_Saver',
    'Diverse_Savings_Reasons', 'Old_Age_Planning',
    'Savings_Frequency_Score', 'Savings_Behavior_Score', 'state'
]

# Merge by respondent_serial
if 'respondent_serial' in df.columns and 'respondent_serial' in df_clean.columns:
    # Merge new features with existing
    new_features = ['Has_NIN', 'Formal_Employment', 'Business_Income', 
                    'Agricultural_Income', 'Passive_Income', 
                    'Income_Diversity_Score', 'Digital_Access_Index',
                    'respondent_serial']
    
    df_new = df[new_features].copy()
    df_merged = df_clean.merge(df_new, on='respondent_serial', how='left')
    
    print(f"Merged dataset shape: {df_merged.shape}")
    
    # Fill any missing values with 0 (shouldn't happen but just in case)
    for col in new_features[:-1]:  # Exclude respondent_serial
        if df_merged[col].isnull().any():
            print(f"   Filling {df_merged[col].isnull().sum()} missing values in {col}")
            df_merged[col] = df_merged[col].fillna(0)
else:
    print("   ⚠️  Cannot merge by respondent_serial, creating features from scratch")
    # This shouldn't happen, but handle it gracefully
    df_merged = df_clean.copy()
    for col in ['Has_NIN', 'Formal_Employment', 'Business_Income', 
                'Agricultural_Income', 'Passive_Income', 
                'Income_Diversity_Score', 'Digital_Access_Index']:
        df_merged[col] = 0

# ============================================================================
# STEP 4: PREPARE FEATURES AND TARGET
# ============================================================================

print("\n[STEP 4] Preparing features and target...")

# Extract target
y = df_merged['FormallyIncluded']

# Base features (now 22 instead of 15)
base_feature_list = [
    'gender_male', 'Age_numeric', 'education_numeric', 'income_numeric',
    'wealth_numeric', 'urban', 'savings_frequency_numeric', 'runs_out_of_money',
    'Saves_Money', 'Informal_Savings_Mode', 'Regular_Saver',
    'Diverse_Savings_Reasons', 'Old_Age_Planning',
    'Savings_Frequency_Score', 'Savings_Behavior_Score',
    # NEW FEATURES
    'Has_NIN', 'Formal_Employment', 'Business_Income',
    'Agricultural_Income', 'Passive_Income',
    'Income_Diversity_Score', 'Digital_Access_Index'
]

X_base = df_merged[base_feature_list].copy()

# Create state dummies
print(f"\nCreating state dummy variables...")
state_dummies = pd.get_dummies(df_merged['state'], prefix='state', drop_first=True)
print(f"  Created {len(state_dummies.columns)} state dummy variables")
print(f"  Reference state (dropped): {sorted(df_merged['state'].unique())[0]}")

# Combine base features with state dummies
X = pd.concat([X_base, state_dummies], axis=1)

print(f"\nFinal feature set:")
print(f"  Base features: {len(base_feature_list)}")
print(f"  State dummies: {len(state_dummies.columns)}")
print(f"  Total features: {len(X.columns)}")

print(f"\nTarget distribution:")
print(f"  Formally Included: {y.sum():,} ({y.mean()*100:.1f}%)")
print(f"  Not Included: {len(y) - y.sum():,} ({(1-y.mean())*100:.1f}%)")

# Check for missing values
print(f"\nChecking for missing values...")
missing = X.isnull().sum()
if missing.sum() > 0:
    print(f"Found missing values:")
    print(missing[missing > 0])
    print(f"\nFilling missing values with median...")
    for col in X.columns:
        if X[col].isnull().sum() > 0:
            median_val = X[col].median()
            X[col] = X[col].fillna(median_val)
            print(f"  Filled {col} with median: {median_val:.2f}")
else:
    print("No missing values found!")

# Save the complete dataset
df_merged.to_csv(OUTPUT_DIR / 'complete_dataset_with_all_features.csv', index=False)
X.to_csv(OUTPUT_DIR / 'X_features_complete.csv', index=False)
y.to_frame('FormallyIncluded').to_csv(OUTPUT_DIR / 'y_target.csv', index=False)
print(f"\n[OK] Saved complete dataset with all features")

# ============================================================================
# STEP 5: TRAIN-TEST SPLIT
# ============================================================================

print("\n[STEP 5] Splitting data...")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Training set: {X_train.shape}")
print(f"Test set: {X_test.shape}")

# ============================================================================
# STEP 6: FEATURE SCALING
# ============================================================================

print("\n[STEP 6] Scaling features...")

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("Features scaled using StandardScaler")

# ============================================================================
# STEP 7: TRAIN LOGISTIC REGRESSION MODEL
# ============================================================================

print("\n[STEP 7] Training Logistic Regression model...")

model = LogisticRegression(
    random_state=42,
    max_iter=1000,
    class_weight='balanced',
    solver='lbfgs'
)

model.fit(X_train_scaled, y_train)
print("Model training complete!")

# ============================================================================
# STEP 8: MODEL EVALUATION
# ============================================================================

print("\n[STEP 8] Evaluating model...")

# Predictions
y_train_pred = model.predict(X_train_scaled)
y_test_pred = model.predict(X_test_scaled)
y_train_proba = model.predict_proba(X_train_scaled)[:, 1]
y_test_proba = model.predict_proba(X_test_scaled)[:, 1]

# Metrics
train_accuracy = model.score(X_train_scaled, y_train)
train_auc = roc_auc_score(y_train, y_train_proba)
test_accuracy = model.score(X_test_scaled, y_test)
test_auc = roc_auc_score(y_test, y_test_proba)

print(f"\nTraining Performance:")
print(f"  Accuracy: {train_accuracy:.4f}")
print(f"  AUC-ROC: {train_auc:.4f}")

print(f"\nTest Performance:")
print(f"  Accuracy: {test_accuracy:.4f}")
print(f"  AUC-ROC: {test_auc:.4f}")

# Cross-validation
print("\nPerforming 5-fold cross-validation...")
cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='roc_auc')
print(f"5-Fold Cross-Validation AUC: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

# Classification report
print("\nClassification Report (Test Set):")
print(classification_report(y_test, y_test_pred, target_names=['Not Included', 'Formally Included']))

# ============================================================================
# STEP 9: FEATURE IMPORTANCE
# ============================================================================

print("\n[STEP 9] Analyzing feature importance...")

coefficients = pd.DataFrame({
    'feature': X.columns,
    'coefficient': model.coef_[0],
    'abs_coefficient': np.abs(model.coef_[0])
}).sort_values('abs_coefficient', ascending=False)

# Separate base and state features
base_coefs = coefficients[~coefficients['feature'].str.startswith('state_')]
state_coefs = coefficients[coefficients['feature'].str.startswith('state_')].sort_values('coefficient', ascending=False)

# Highlight NEW features
new_feature_names = ['Has_NIN', 'Formal_Employment', 'Business_Income',
                     'Agricultural_Income', 'Passive_Income',
                     'Income_Diversity_Score', 'Digital_Access_Index']

print(f"\n{'='*80}")
print("BASE FEATURE COEFFICIENTS (with NEW features highlighted):")
print(f"{'='*80}")
for idx, row in base_coefs.iterrows():
    marker = " ✨ NEW" if row['feature'] in new_feature_names else ""
    print(f"{row['feature']:35s} {row['coefficient']:8.4f}{marker}")

print(f"\n{'='*80}")
print("TOP 10 STATE COEFFICIENTS (Highest Inclusion):")
print(f"{'='*80}")
print(state_coefs.head(10).to_string(index=False))

# Save coefficients
coefficients.to_csv(OUTPUT_DIR / 'feature_coefficients.csv', index=False)
base_coefs.to_csv(OUTPUT_DIR / 'base_feature_coefficients.csv', index=False)
state_coefs.to_csv(OUTPUT_DIR / 'state_coefficients.csv', index=False)

# ============================================================================
# STEP 10: COMPARISON WITH PREVIOUS MODEL
# ============================================================================

print("\n[STEP 10] Comparing with previous model...")

try:
    with open('new_model_results_with_states/model_metrics.json', 'r') as f:
        prev_metrics = json.load(f)
    
    print(f"\n{'='*60}")
    print("PERFORMANCE COMPARISON")
    print(f"{'='*60}")
    print(f"{'Metric':<30} {'Previous':<12} {'Current':<12} {'Change':<12}")
    print(f"{'-'*60}")
    print(f"{'Features':<30} {prev_metrics['n_features']:<12} {X.shape[1]:<12} +{X.shape[1] - prev_metrics['n_features']}")
    print(f"{'Test Accuracy':<30} {prev_metrics['test_accuracy']:<12.4f} {test_accuracy:<12.4f} {(test_accuracy - prev_metrics['test_accuracy'])*100:+.2f} pp")
    print(f"{'Test AUC':<30} {prev_metrics['test_auc']:<12.4f} {test_auc:<12.4f} {(test_auc - prev_metrics['test_auc']):+.4f}")
    print(f"{'CV AUC':<30} {prev_metrics['cv_auc_mean']:<12.4f} {cv_scores.mean():<12.4f} {(cv_scores.mean() - prev_metrics['cv_auc_mean']):+.4f}")
    
    improvement = (test_accuracy - prev_metrics['test_accuracy']) * 100
    if improvement > 0:
        print(f"\n✅ MODEL IMPROVED BY {improvement:.2f} PERCENTAGE POINTS!")
    else:
        print(f"\n⚠️  Model accuracy decreased by {abs(improvement):.2f} pp")
        
except Exception as e:
    print(f"Could not load previous model metrics: {e}")

# ============================================================================
# STEP 11: SAVE MODEL ARTIFACTS
# ============================================================================

print("\n[STEP 11] Saving model artifacts...")

# Model coefficients for dashboard
dashboard_coefficients = {}
for idx, row in coefficients.iterrows():
    dashboard_coefficients[row['feature']] = float(row['coefficient'])
dashboard_coefficients['intercept'] = float(model.intercept_[0])

with open(OUTPUT_DIR / 'model_coefficients.json', 'w') as f:
    json.dump(dashboard_coefficients, f, indent=2)

# Model metrics
metrics = {
    'train_accuracy': float(train_accuracy),
    'test_accuracy': float(test_accuracy),
    'train_auc': float(train_auc),
    'test_auc': float(test_auc),
    'cv_auc_mean': float(cv_scores.mean()),
    'cv_auc_std': float(cv_scores.std()),
    'n_features': int(X.shape[1]),
    'n_base_features': len(base_feature_list),
    'n_state_features': len(state_dummies.columns),
    'n_train_samples': int(len(X_train)),
    'n_test_samples': int(len(X_test)),
    'baseline_inclusion_rate': float(y.mean())
}

with open(OUTPUT_DIR / 'model_metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)

# Model configuration
model_config = {
    'features': X.columns.tolist(),
    'base_features': base_feature_list,
    'new_features': new_feature_names,
    'state_features': state_dummies.columns.tolist(),
    'reference_state': sorted(df_merged['state'].unique())[0],
    'scaler_mean': scaler.mean_.tolist(),
    'scaler_scale': scaler.scale_.tolist(),
    'model_type': 'LogisticRegression',
    'model_params': {
        'random_state': 42,
        'max_iter': 1000,
        'class_weight': 'balanced',
        'solver': 'lbfgs'
    }
}

with open(OUTPUT_DIR / 'model_config.json', 'w') as f:
    json.dump(model_config, f, indent=2)

print("[OK] Saved all model artifacts")

print("\n" + "="*80)
print("✅ MODEL RETRAINING COMPLETE WITH ALL 7 MISSING VARIABLES!")
print("="*80)
print(f"\nFinal Model Specification:")
print(f"  - Total features: {X.shape[1]}")
print(f"  - Base features: {len(base_feature_list)} (was 15, now 22)")
print(f"  - State features: {len(state_dummies.columns)}")
print(f"  - Test Accuracy: {test_accuracy:.4f}")
print(f"  - Test AUC: {test_auc:.4f}")
print(f"\nOutput directory: {OUTPUT_DIR}")
