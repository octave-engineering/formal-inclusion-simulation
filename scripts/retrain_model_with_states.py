"""
Retrain Logistic Regression Model WITH State Variables
=======================================================

This script retrains the model including state-level dummy variables
to capture regional variations in financial inclusion.
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
DATA_DIR = Path('rebuilt_dataset')
OUTPUT_DIR = Path('new_model_results_with_states')
OUTPUT_DIR.mkdir(exist_ok=True)

print("="*80)
print("RETRAINING LOGISTIC REGRESSION MODEL (WITH STATE VARIABLES)")
print("="*80)

# ============================================================================
# STEP 1: LOAD AND PREPARE DATA
# ============================================================================

print("\n[STEP 1] Loading and preparing data...")

# Load full dataset
df = pd.read_csv(DATA_DIR / 'modeling_dataset_non_circular.csv')
print(f"Loaded dataset: {df.shape}")

# Extract target
y = df['FormallyIncluded']

# Base features (excluding state for now)
base_features = [
    'gender_male', 'Age_numeric', 'education_numeric', 'income_numeric',
    'wealth_numeric', 'urban', 'savings_frequency_numeric', 'runs_out_of_money',
    'Saves_Money', 'Informal_Savings_Mode', 'Regular_Saver',
    'Diverse_Savings_Reasons', 'Old_Age_Planning',
    'Savings_Frequency_Score', 'Savings_Behavior_Score'
]

print(f"\nBase features: {len(base_features)}")
for i, feat in enumerate(base_features, 1):
    print(f"  {i:2d}. {feat}")

# Create one-hot encoded state variables
print(f"\nCreating state dummy variables...")
print(f"  Unique states: {df['state'].nunique()}")
print(f"  States: {sorted(df['state'].unique())}")

# One-hot encode state (drop first to avoid multicollinearity)
state_dummies = pd.get_dummies(df['state'], prefix='state', drop_first=True)
print(f"  Created {len(state_dummies.columns)} state dummy variables")
print(f"  Reference state (dropped): {sorted(df['state'].unique())[0]}")

# Combine base features with state dummies
X_base = df[base_features].copy()
X = pd.concat([X_base, state_dummies], axis=1)

print(f"\nFinal feature set:")
print(f"  Base features: {len(base_features)}")
print(f"  State dummies: {len(state_dummies.columns)}")
print(f"  Total features: {len(X.columns)}")

print(f"\nTarget distribution:")
print(f"  Formally Included: {y.sum():,} ({y.mean()*100:.1f}%)")
print(f"  Not Included: {len(y) - y.sum():,} ({(1-y.mean())*100:.1f}%)")

# Check for missing values
print(f"\nChecking missing values...")
missing = X.isnull().sum()
if missing.sum() > 0:
    print(f"Found missing values:")
    print(missing[missing > 0])
    print(f"\nHandling missing values...")
    
    # Fill missing values with median for numeric columns
    for col in X.columns:
        if X[col].isnull().sum() > 0:
            median_val = X[col].median()
            X[col] = X[col].fillna(median_val)
            print(f"  Filled {col} with median: {median_val:.2f}")
    
    print("Missing values handled!")
else:
    print("No missing values found!")

# Save updated features
X.to_csv(DATA_DIR / 'X_features_with_states.csv', index=False)
print(f"\n[OK] Saved features to {DATA_DIR / 'X_features_with_states.csv'}")

# ============================================================================
# STEP 2: TRAIN-TEST SPLIT
# ============================================================================

print("\n[STEP 2] Splitting data...")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Training set: {X_train.shape}")
print(f"Test set: {X_test.shape}")

# ============================================================================
# STEP 3: FEATURE SCALING
# ============================================================================

print("\n[STEP 3] Scaling features...")

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("Features scaled using StandardScaler")

# ============================================================================
# STEP 4: TRAIN LOGISTIC REGRESSION MODEL
# ============================================================================

print("\n[STEP 4] Training Logistic Regression model...")

# Train model
model = LogisticRegression(
    random_state=42,
    max_iter=1000,
    class_weight='balanced',  # Handle class imbalance
    solver='lbfgs'
)

model.fit(X_train_scaled, y_train)
print("Model training complete!")

# ============================================================================
# STEP 5: MODEL EVALUATION
# ============================================================================

print("\n[STEP 5] Evaluating model...")

# Predictions
y_train_pred = model.predict(X_train_scaled)
y_test_pred = model.predict(X_test_scaled)
y_train_proba = model.predict_proba(X_train_scaled)[:, 1]
y_test_proba = model.predict_proba(X_test_scaled)[:, 1]

# Training metrics
train_accuracy = model.score(X_train_scaled, y_train)
train_auc = roc_auc_score(y_train, y_train_proba)

# Test metrics
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
# STEP 6: FEATURE IMPORTANCE (COEFFICIENTS)
# ============================================================================

print("\n[STEP 6] Analyzing feature importance...")

# Get coefficients
coefficients = pd.DataFrame({
    'feature': X.columns,
    'coefficient': model.coef_[0],
    'abs_coefficient': np.abs(model.coef_[0])
}).sort_values('abs_coefficient', ascending=False)

print("\nTop 20 Most Important Features:")
print(coefficients.head(20).to_string(index=False))

# Separate base features and state features
base_coefs = coefficients[~coefficients['feature'].str.startswith('state_')]
state_coefs = coefficients[coefficients['feature'].str.startswith('state_')].sort_values('coefficient', ascending=False)

print(f"\n{'='*60}")
print("BASE FEATURE COEFFICIENTS:")
print(f"{'='*60}")
print(base_coefs.to_string(index=False))

print(f"\n{'='*60}")
print("STATE COEFFICIENTS (Top 10 Most Positive):")
print(f"{'='*60}")
print(state_coefs.head(10).to_string(index=False))

print(f"\n{'='*60}")
print("STATE COEFFICIENTS (Top 10 Most Negative):")
print(f"{'='*60}")
print(state_coefs.tail(10).to_string(index=False))

# Save coefficients
coefficients.to_csv(OUTPUT_DIR / 'feature_coefficients.csv', index=False)
base_coefs.to_csv(OUTPUT_DIR / 'base_feature_coefficients.csv', index=False)
state_coefs.to_csv(OUTPUT_DIR / 'state_coefficients.csv', index=False)
print(f"\n[OK] Saved all coefficients")

# ============================================================================
# STEP 7: VISUALIZATIONS
# ============================================================================

print("\n[STEP 7] Creating visualizations...")

# 1. Base Feature Importance Plot
fig, ax = plt.subplots(figsize=(10, 8))
colors = ['green' if x > 0 else 'red' for x in base_coefs['coefficient']]
ax.barh(range(len(base_coefs)), base_coefs['coefficient'], color=colors, alpha=0.7)
ax.set_yticks(range(len(base_coefs)))
ax.set_yticklabels(base_coefs['feature'])
ax.set_xlabel('Coefficient Value')
ax.set_title('Base Features Importance (Logistic Regression)\nGreen = Positive Impact, Red = Negative Impact')
ax.axvline(x=0, color='black', linestyle='--', linewidth=0.5)
ax.grid(axis='x', alpha=0.3)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'base_feature_importance.png', dpi=300, bbox_inches='tight')
print("[OK] Saved base feature importance plot")

# 2. State Coefficients Plot (Top 20)
fig, ax = plt.subplots(figsize=(12, 10))
top_states = pd.concat([state_coefs.head(10), state_coefs.tail(10)])
colors = ['green' if x > 0 else 'red' for x in top_states['coefficient']]
state_names = [x.replace('state_', '') for x in top_states['feature']]
ax.barh(range(len(top_states)), top_states['coefficient'], color=colors, alpha=0.7)
ax.set_yticks(range(len(top_states)))
ax.set_yticklabels(state_names)
ax.set_xlabel('Coefficient Value')
ax.set_title('Top 20 State Effects on Financial Inclusion\n(Positive = Higher Inclusion, Negative = Lower Inclusion)')
ax.axvline(x=0, color='black', linestyle='--', linewidth=0.5)
ax.grid(axis='x', alpha=0.3)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'state_coefficients.png', dpi=300, bbox_inches='tight')
print("[OK] Saved state coefficients plot")

# 3. ROC Curve
fig, ax = plt.subplots(figsize=(8, 6))
fpr, tpr, _ = roc_curve(y_test, y_test_proba)
ax.plot(fpr, tpr, color='blue', lw=2, label=f'ROC curve (AUC = {test_auc:.3f})')
ax.plot([0, 1], [0, 1], color='gray', lw=1, linestyle='--', label='Random Classifier')
ax.set_xlabel('False Positive Rate')
ax.set_ylabel('True Positive Rate')
ax.set_title('ROC Curve - Model with State Variables')
ax.legend(loc='lower right')
ax.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'roc_curve.png', dpi=300, bbox_inches='tight')
print("[OK] Saved ROC curve")

# 4. Confusion Matrix
fig, ax = plt.subplots(figsize=(8, 6))
cm = confusion_matrix(y_test, y_test_pred)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax)
ax.set_xlabel('Predicted')
ax.set_ylabel('Actual')
ax.set_title('Confusion Matrix - Test Set')
ax.set_xticklabels(['Not Included', 'Formally Included'])
ax.set_yticklabels(['Not Included', 'Formally Included'])
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'confusion_matrix.png', dpi=300, bbox_inches='tight')
print("[OK] Saved confusion matrix")

# ============================================================================
# STEP 8: SAVE MODEL ARTIFACTS
# ============================================================================

print("\n[STEP 8] Saving model artifacts...")

# Save model coefficients in dashboard format
dashboard_coefficients = {}
for idx, row in coefficients.iterrows():
    dashboard_coefficients[row['feature']] = float(row['coefficient'])

# Add intercept
dashboard_coefficients['intercept'] = float(model.intercept_[0])

# Save as JSON
with open(OUTPUT_DIR / 'model_coefficients.json', 'w') as f:
    json.dump(dashboard_coefficients, f, indent=2)
print("[OK] Saved model coefficients (JSON)")

# Save model metrics
metrics = {
    'train_accuracy': float(train_accuracy),
    'test_accuracy': float(test_accuracy),
    'train_auc': float(train_auc),
    'test_auc': float(test_auc),
    'cv_auc_mean': float(cv_scores.mean()),
    'cv_auc_std': float(cv_scores.std()),
    'n_features': int(X.shape[1]),
    'n_base_features': len(base_features),
    'n_state_features': len(state_dummies.columns),
    'n_train_samples': int(len(X_train)),
    'n_test_samples': int(len(X_test)),
    'baseline_inclusion_rate': float(y.mean())
}

with open(OUTPUT_DIR / 'model_metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)
print("[OK] Saved model metrics (JSON)")

# Save feature names and scaling parameters
model_config = {
    'features': X.columns.tolist(),
    'base_features': base_features,
    'state_features': state_dummies.columns.tolist(),
    'reference_state': sorted(df['state'].unique())[0],
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
print("[OK] Saved model configuration (JSON)")

# ============================================================================
# STEP 9: COMPARE WITH BASELINE AND PREVIOUS MODEL
# ============================================================================

print("\n[STEP 9] Comparing performance...")

baseline_rate = y.mean()
print(f"\nBaseline (always predict majority class): {baseline_rate:.1%}")
print(f"Model accuracy improvement: {(test_accuracy - baseline_rate)*100:.2f} percentage points")

# Try to load previous model metrics
try:
    with open('new_model_results/model_metrics.json', 'r') as f:
        prev_metrics = json.load(f)
    
    print(f"\nComparison with Previous Model (without states):")
    print(f"  Previous Test Accuracy: {prev_metrics['test_accuracy']:.4f}")
    print(f"  Current Test Accuracy:  {test_accuracy:.4f}")
    print(f"  Improvement: {(test_accuracy - prev_metrics['test_accuracy'])*100:.2f} pp")
    print(f"  Previous Test AUC: {prev_metrics['test_auc']:.4f}")
    print(f"  Current Test AUC:  {test_auc:.4f}")
    print(f"  Improvement: {(test_auc - prev_metrics['test_auc']):.4f}")
except:
    print("\nCould not load previous model metrics for comparison")

# ============================================================================
# STEP 10: SUMMARY REPORT
# ============================================================================

print("\n" + "="*80)
print("MODEL TRAINING COMPLETE")
print("="*80)

summary_report = f"""
MODEL WITH STATE VARIABLES - TRAINING SUMMARY
==============================================

Dataset:
  - Total samples: {len(X):,}
  - Training samples: {len(X_train):,}
  - Test samples: {len(X_test):,}
  - Total features: {X.shape[1]}
  - Base features: {len(base_features)}
  - State dummy variables: {len(state_dummies.columns)}
  - Reference state: {sorted(df['state'].unique())[0]}

Model Performance:
  - Test Accuracy: {test_accuracy:.4f}
  - Test AUC-ROC: {test_auc:.4f}
  - 5-Fold CV AUC: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})
  - Baseline Rate: {baseline_rate:.4f}
  - Improvement over baseline: {(test_accuracy - baseline_rate)*100:.2f} pp

Top 5 Base Features (Positive):
{chr(10).join([f'  {i+1}. {row["feature"]}: {row["coefficient"]:.4f}' for i, (_, row) in enumerate(base_coefs[base_coefs['coefficient'] > 0].head(5).iterrows())])}

Top 5 States (Highest Inclusion):
{chr(10).join([f'  {i+1}. {row["feature"].replace("state_", "")}: {row["coefficient"]:.4f}' for i, (_, row) in enumerate(state_coefs.head(5).iterrows())])}

Top 5 States (Lowest Inclusion):
{chr(10).join([f'  {i+1}. {row["feature"].replace("state_", "")}: {row["coefficient"]:.4f}' for i, (_, row) in enumerate(state_coefs.tail(5).iterrows())])}

Output Files:
  - {OUTPUT_DIR / 'feature_coefficients.csv'}
  - {OUTPUT_DIR / 'base_feature_coefficients.csv'}
  - {OUTPUT_DIR / 'state_coefficients.csv'}
  - {OUTPUT_DIR / 'model_coefficients.json'}
  - {OUTPUT_DIR / 'model_metrics.json'}
  - {OUTPUT_DIR / 'model_config.json'}
  - {OUTPUT_DIR / 'base_feature_importance.png'}
  - {OUTPUT_DIR / 'state_coefficients.png'}
  - {OUTPUT_DIR / 'roc_curve.png'}
  - {OUTPUT_DIR / 'confusion_matrix.png'}

Next Steps:
  1. Review model performance vs. previous model
  2. Analyze state-specific coefficients
  3. Update dashboard prediction.js with new coefficients
  4. Regenerate population_data.json with new model
  5. Test dashboard with state-specific predictions
"""

print(summary_report)

# Save summary
with open(OUTPUT_DIR / 'TRAINING_SUMMARY.txt', 'w') as f:
    f.write(summary_report)

print(f"\n[OK] Saved training summary to {OUTPUT_DIR / 'TRAINING_SUMMARY.txt'}")
print("\n" + "="*80)
print("✅ MODEL RETRAINING WITH STATES COMPLETE!")
print("="*80)
