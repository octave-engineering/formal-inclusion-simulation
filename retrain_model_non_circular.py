"""
Retrain Logistic Regression Model with Non-Circular Variables
===============================================================

This script trains a new logistic regression model using only valid,
non-circular predictors plus the new savings behavior features.
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
OUTPUT_DIR = Path('new_model_results')
OUTPUT_DIR.mkdir(exist_ok=True)

print("="*80)
print("RETRAINING LOGISTIC REGRESSION MODEL (NON-CIRCULAR VARIABLES)")
print("="*80)

# ============================================================================
# STEP 1: LOAD DATA
# ============================================================================

print("\n[STEP 1] Loading data...")

X = pd.read_csv(DATA_DIR / 'X_features.csv')
y = pd.read_csv(DATA_DIR / 'y_target.csv')['FormallyIncluded']

print(f"Features (X): {X.shape}")
print(f"Target (y): {y.shape}")
print(f"\nTarget distribution:")
print(f"  Formally Included: {y.sum():,} ({y.mean()*100:.1f}%)")
print(f"  Not Included: {len(y) - y.sum():,} ({(1-y.mean())*100:.1f}%)")

print(f"\nFeatures:")
for i, col in enumerate(X.columns, 1):
    print(f"  {i:2d}. {col}")

# Check for missing values
print(f"\nMissing values:")
missing = X.isnull().sum()
if missing.sum() > 0:
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
cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='roc_auc')
print(f"\n5-Fold Cross-Validation AUC: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

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

print("\nTop 15 Most Important Features:")
print(coefficients.head(15).to_string(index=False))

# Save coefficients
coefficients.to_csv(OUTPUT_DIR / 'feature_coefficients.csv', index=False)
print(f"\n[OK] Saved coefficients to {OUTPUT_DIR / 'feature_coefficients.csv'}")

# ============================================================================
# STEP 7: VISUALIZATIONS
# ============================================================================

print("\n[STEP 7] Creating visualizations...")

# 1. Feature Importance Plot
fig, ax = plt.subplots(figsize=(10, 8))
top_15 = coefficients.head(15)
colors = ['green' if x > 0 else 'red' for x in top_15['coefficient']]
ax.barh(range(len(top_15)), top_15['coefficient'], color=colors, alpha=0.7)
ax.set_yticks(range(len(top_15)))
ax.set_yticklabels(top_15['feature'])
ax.set_xlabel('Coefficient Value')
ax.set_title('Top 15 Features by Importance (Logistic Regression)\nGreen = Positive Impact, Red = Negative Impact')
ax.axvline(x=0, color='black', linestyle='--', linewidth=0.5)
ax.grid(axis='x', alpha=0.3)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'feature_importance.png', dpi=300, bbox_inches='tight')
print("[OK] Saved feature importance plot")

# 2. ROC Curve
fig, ax = plt.subplots(figsize=(8, 6))
fpr, tpr, _ = roc_curve(y_test, y_test_proba)
ax.plot(fpr, tpr, color='blue', lw=2, label=f'ROC curve (AUC = {test_auc:.3f})')
ax.plot([0, 1], [0, 1], color='gray', lw=1, linestyle='--', label='Random Classifier')
ax.set_xlabel('False Positive Rate')
ax.set_ylabel('True Positive Rate')
ax.set_title('ROC Curve - Non-Circular Model')
ax.legend(loc='lower right')
ax.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'roc_curve.png', dpi=300, bbox_inches='tight')
print("[OK] Saved ROC curve")

# 3. Confusion Matrix
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
# STEP 9: COMPARE WITH BASELINE
# ============================================================================

print("\n[STEP 9] Comparing with baseline...")

baseline_rate = y.mean()
print(f"\nBaseline (always predict majority class): {baseline_rate:.1%}")
print(f"Model accuracy improvement: {(test_accuracy - baseline_rate)*100:.2f} percentage points")

# ============================================================================
# STEP 10: SUMMARY REPORT
# ============================================================================

print("\n" + "="*80)
print("MODEL TRAINING COMPLETE")
print("="*80)

summary_report = f"""
NON-CIRCULAR MODEL TRAINING SUMMARY
====================================

Dataset:
  - Total samples: {len(X):,}
  - Training samples: {len(X_train):,}
  - Test samples: {len(X_test):,}
  - Features: {X.shape[1]}

Model Performance:
  - Test Accuracy: {test_accuracy:.4f}
  - Test AUC-ROC: {test_auc:.4f}
  - 5-Fold CV AUC: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})
  - Baseline Rate: {baseline_rate:.4f}
  - Improvement: {(test_accuracy - baseline_rate)*100:.2f} pp

Top 5 Positive Predictors:
{chr(10).join([f'  {i+1}. {row["feature"]}: {row["coefficient"]:.4f}' for i, (_, row) in enumerate(coefficients[coefficients['coefficient'] > 0].head(5).iterrows())])}

Top 5 Negative Predictors:
{chr(10).join([f'  {i+1}. {row["feature"]}: {row["coefficient"]:.4f}' for i, (_, row) in enumerate(coefficients[coefficients['coefficient'] < 0].head(5).iterrows())])}

Output Files:
  - {OUTPUT_DIR / 'feature_coefficients.csv'}
  - {OUTPUT_DIR / 'model_coefficients.json'}
  - {OUTPUT_DIR / 'model_metrics.json'}
  - {OUTPUT_DIR / 'model_config.json'}
  - {OUTPUT_DIR / 'feature_importance.png'}
  - {OUTPUT_DIR / 'roc_curve.png'}
  - {OUTPUT_DIR / 'confusion_matrix.png'}

Next Steps:
  1. Review feature coefficients and model performance
  2. Update dashboard prediction.js with new coefficients
  3. Update dashboard variable lists
  4. Regenerate population_data.json with new model
  5. Test dashboard with new predictions
"""

print(summary_report)

# Save summary
with open(OUTPUT_DIR / 'TRAINING_SUMMARY.txt', 'w') as f:
    f.write(summary_report)

print(f"\n[OK] Saved training summary to {OUTPUT_DIR / 'TRAINING_SUMMARY.txt'}")
