import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import warnings
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression, LassoCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix, accuracy_score
from sklearn.model_selection import cross_val_score
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor

try:
    import xgboost as xgb
    import shap
    XGBOOST_AVAILABLE = True
except:
    XGBOOST_AVAILABLE = False
    print("XGBoost/SHAP not available")

warnings.filterwarnings('ignore')
plt.style.use('seaborn-v0_8-darkgrid')

output_dir = Path('efina_analysis_results')

print("="*80)
print("EFINA MODELING AND VARIABLE RANKING")
print("="*80)

# 1. LOAD PREPARED DATA

print("\n[1] Loading prepared data...")
df = pd.read_csv(output_dir / 'prepared_dataset.csv')
print(f"   Shape: {df.shape}")

# Load predictor list
predictors = []
with open(output_dir / 'predictor_variables.txt', 'r') as f:
    lines = f.readlines()
    for line in lines:
        if line.strip() and line[0].isdigit():
            pred = line.split('.', 1)[1].strip()
            predictors.append(pred)

DEPENDENT_VAR = 'FormallyIncluded'

print(f"   Predictors: {len(predictors)}")
print(f"   Dependent var: {DEPENDENT_VAR}")

# Prepare modeling dataset (drop rows with missing values in key variables)
modeling_vars = [v for v in predictors if v in df.columns] + [DEPENDENT_VAR]
df_model = df[modeling_vars].dropna()
print(f"   Modeling dataset shape: {df_model.shape}")

X = df_model[[v for v in predictors if v in df_model.columns]]
y = df_model[DEPENDENT_VAR]

print(f"✓ Data prepared: {X.shape[0]} observations, {X.shape[1]} features")

# 2. CHECK AND REMOVE MULTICOLLINEARITY

print("\n[2] Checking multicollinearity...")

# Remove perfectly correlated variables
corr_matrix = X.corr().abs()
upper_tri = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
to_drop = [column for column in upper_tri.columns if any(upper_tri[column] > 0.95)]

if to_drop:
    print(f"   Dropping {len(to_drop)} highly correlated variables: {to_drop[:5]}...")
    X = X.drop(columns=to_drop)

print(f"   Final feature set: {X.shape[1]} features")

# 3. LOGISTIC REGRESSION

print("\n[3] Logistic Regression...")

# Standardize predictors
scaler = StandardScaler()
X_scaled = pd.DataFrame(
    scaler.fit_transform(X),
    columns=X.columns,
    index=X.index
)

# Fit logistic regression with regularization to handle any remaining multicollinearity
try:
    X_with_const = sm.add_constant(X_scaled)
    logit_model = sm.Logit(y, X_with_const)
    logit_results = logit_model.fit(disp=0, method='bfgs', maxiter=100)
except:
    print("   Regular logit failed, using sklearn LogisticRegression...")
    from sklearn.linear_model import LogisticRegression
    lr_model = LogisticRegression(max_iter=1000, C=1.0)
    lr_model.fit(X_scaled, y)
    
    # Create a results-like object
    coef_df = pd.DataFrame({
        'variable': X.columns,
        'coefficient': lr_model.coef_[0],
        'std_error': np.nan,
        'z_value': np.nan,
        'p_value': np.nan,
        'conf_low': np.nan,
        'conf_high': np.nan
    })
    
    # Skip to saving coefficients
    logit_results = None

# Extract coefficients
if logit_results is not None:
    coef_df = pd.DataFrame({
        'variable': X.columns,
        'coefficient': logit_results.params[1:],  # Exclude intercept
        'std_error': logit_results.bse[1:],
        'z_value': logit_results.tvalues[1:],
        'p_value': logit_results.pvalues[1:],
        'conf_low': logit_results.conf_int()[0][1:],
        'conf_high': logit_results.conf_int()[1][1:]
    })
    
    print(f"\n✓ Logistic Regression Results:")
    print(f"   Pseudo R²: {logit_results.prsquared:.4f}")
    print(f"   AIC: {logit_results.aic:.2f}")
    print(f"   BIC: {logit_results.bic:.2f}")

# Sort by absolute coefficient
coef_df['abs_coef'] = coef_df['coefficient'].abs()
coef_df = coef_df.sort_values('abs_coef', ascending=False)
coef_df['rank'] = range(1, len(coef_df) + 1)

# Save coefficients
coef_df.to_csv(output_dir / 'logistic_regression_coefficients.csv', index=False)

print(f"\nTop 10 predictors by standardized coefficient:")
print(coef_df[['variable', 'coefficient']].head(10))

# Plot coefficients
fig, ax = plt.subplots(figsize=(10, 10))
top_20 = coef_df.head(20)
colors = ['green' if c > 0 else 'red' for c in top_20['coefficient']]
ax.barh(range(len(top_20)), top_20['coefficient'], color=colors)
ax.set_yticks(range(len(top_20)))
ax.set_yticklabels(top_20['variable'])
ax.set_xlabel('Standardized Coefficient', fontsize=12)
ax.set_title('Top 20 Predictors - Logistic Regression', fontsize=14, fontweight='bold')
ax.axvline(0, color='black', linestyle='-', linewidth=0.8)
plt.tight_layout()
plt.savefig(output_dir / 'figures' / 'logistic_coefficients.png', dpi=300, bbox_inches='tight')
plt.close()

# 4. VARIANCE INFLATION FACTOR (VIF)

print("\n[4] Computing VIF for multicollinearity...")

try:
    vif_data = pd.DataFrame()
    vif_data['variable'] = X_scaled.columns
    vif_data['VIF'] = [variance_inflation_factor(X_scaled.values, i) 
                       for i in range(X_scaled.shape[1])]
    vif_data = vif_data.sort_values('VIF', ascending=False)
    vif_data.to_csv(output_dir / 'vif_multicollinearity.csv', index=False)
    
    print(f"Variables with high VIF (>10):")
    high_vif = vif_data[vif_data['VIF'] > 10]
    if len(high_vif) > 0:
        print(high_vif.head(10))
    else:
        print("   None (good!)")
except Exception as e:
    print(f"   VIF computation failed: {e}")

# 5. LASSO VARIABLE SELECTION

print("\n[5] LASSO variable selection...")

lasso_model = LassoCV(cv=5, random_state=42, max_iter=10000)
lasso_model.fit(X_scaled, y)

lasso_coefs = pd.DataFrame({
    'variable': X.columns,
    'lasso_coefficient': lasso_model.coef_
})
lasso_coefs['abs_coef'] = lasso_coefs['lasso_coefficient'].abs()
lasso_coefs = lasso_coefs.sort_values('abs_coef', ascending=False)
lasso_coefs['selected'] = lasso_coefs['lasso_coefficient'] != 0

lasso_coefs.to_csv(output_dir / 'lasso_variable_selection.csv', index=False)

print(f" LASSO selected {lasso_coefs['selected'].sum()} variables")
print(f"   Optimal alpha: {lasso_model.alpha_:.6f}")
print(f"\nTop 10 variables by LASSO coefficient:")
print(lasso_coefs[lasso_coefs['selected']][['variable', 'lasso_coefficient']].head(10))

# 6. RANDOM FOREST

print("\n[6] Random Forest classification...")

rf_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=50,
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X, y)

# Feature importance
rf_importance = pd.DataFrame({
    'variable': X.columns,
    'rf_importance': rf_model.feature_importances_
}).sort_values('rf_importance', ascending=False)
rf_importance['rank'] = range(1, len(rf_importance) + 1)

rf_importance.to_csv(output_dir / 'random_forest_importance.csv', index=False)

# Predictions
y_pred_rf = rf_model.predict(X)
rf_accuracy = accuracy_score(y, y_pred_rf)
rf_auc = roc_auc_score(y, rf_model.predict_proba(X)[:, 1])

print(f"✓ Random Forest Results:")
print(f"   Accuracy: {rf_accuracy:.4f}")
print(f"   ROC-AUC: {rf_auc:.4f}")
print(f"\nTop 10 features by importance:")
print(rf_importance.head(10))

# Plot RF importance
fig, ax = plt.subplots(figsize=(10, 10))
top_20_rf = rf_importance.head(20)
ax.barh(range(len(top_20_rf)), top_20_rf['rf_importance'], color='steelblue')
ax.set_yticks(range(len(top_20_rf)))
ax.set_yticklabels(top_20_rf['variable'])
ax.set_xlabel('Feature Importance', fontsize=12)
ax.set_title('Top 20 Predictors - Random Forest', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig(output_dir / 'figures' / 'random_forest_importance.png', dpi=300, bbox_inches='tight')
plt.close()

# 7. XGBOOST AND SHAP

if XGBOOST_AVAILABLE:
    print("\n[7] XGBoost and SHAP analysis...")
    
    xgb_model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        n_jobs=-1
    )
    xgb_model.fit(X, y)
    
    # Feature importance
    xgb_importance = pd.DataFrame({
        'variable': X.columns,
        'xgb_importance': xgb_model.feature_importances_
    }).sort_values('xgb_importance', ascending=False)
    xgb_importance.to_csv(output_dir / 'xgboost_importance.csv', index=False)
    
    # SHAP values
    print("   Computing SHAP values (this may take a few minutes)...")
    explainer = shap.TreeExplainer(xgb_model)
    shap_values = explainer.shap_values(X)
    
    # SHAP importance (mean absolute SHAP)
    shap_importance = pd.DataFrame({
        'variable': X.columns,
        'shap_importance': np.abs(shap_values).mean(axis=0)
    }).sort_values('shap_importance', ascending=False)
    shap_importance['rank'] = range(1, len(shap_importance) + 1)
    shap_importance.to_csv(output_dir / 'shap_importance.csv', index=False)
    
    print(f"✓ XGBoost Results:")
    y_pred_xgb = xgb_model.predict(X)
    xgb_accuracy = accuracy_score(y, y_pred_xgb)
    xgb_auc = roc_auc_score(y, xgb_model.predict_proba(X)[:, 1])
    print(f"   Accuracy: {xgb_accuracy:.4f}")
    print(f"   ROC-AUC: {xgb_auc:.4f}")
    
    print(f"\nTop 10 features by SHAP importance:")
    print(shap_importance.head(10))
    
    # SHAP summary plot
    plt.figure(figsize=(10, 8))
    shap.summary_plot(shap_values, X, plot_type="bar", show=False, max_display=20)
    plt.title('Top 20 Predictors - SHAP Values', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(output_dir / 'figures' / 'shap_summary_bar.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    # SHAP beeswarm plot
    plt.figure(figsize=(10, 10))
    shap.summary_plot(shap_values, X, show=False, max_display=20)
    plt.title('SHAP Summary Plot', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(output_dir / 'figures' / 'shap_summary_beeswarm.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    # Save SHAP values
    shap_df = pd.DataFrame(shap_values, columns=X.columns)
    shap_df.to_csv(output_dir / 'shap_values.csv', index=False)
    
    print(f"✓ SHAP analysis complete")
else:
    print("\n[7] XGBoost/SHAP not available, skipping...")

# 8. CONSOLIDATED RANKINGS

print("\n[8] Creating consolidated variable rankings...")

# Merge all rankings
rankings = coef_df[['variable', 'coefficient', 'abs_coef', 'p_value']].copy()
rankings = rankings.merge(lasso_coefs[['variable', 'lasso_coefficient', 'selected']], on='variable', how='left')
rankings = rankings.merge(rf_importance[['variable', 'rf_importance']], on='variable', how='left')

if XGBOOST_AVAILABLE:
    rankings = rankings.merge(xgb_importance[['variable', 'xgb_importance']], on='variable', how='left')
    rankings = rankings.merge(shap_importance[['variable', 'shap_importance']], on='variable', how='left')

# Compute average rank across methods
rank_cols = []

# Rank by logistic coefficient
rankings['rank_logit'] = rankings['abs_coef'].rank(ascending=False)
rank_cols.append('rank_logit')

# Rank by RF importance
rankings['rank_rf'] = rankings['rf_importance'].rank(ascending=False)
rank_cols.append('rank_rf')

if XGBOOST_AVAILABLE:
    # Rank by SHAP
    rankings['rank_shap'] = rankings['shap_importance'].rank(ascending=False)
    rank_cols.append('rank_shap')

# Average rank
rankings['average_rank'] = rankings[rank_cols].mean(axis=1)
rankings = rankings.sort_values('average_rank')
rankings['final_rank'] = range(1, len(rankings) + 1)

# Save consolidated rankings
rankings.to_csv(output_dir / 'consolidated_variable_rankings.csv', index=False)

print(f"\n✓ Consolidated Rankings (Top 15):")
print(rankings[['final_rank', 'variable', 'coefficient', 'rf_importance', 
                'average_rank', 'p_value']].head(15))

# Save top variables
top_variables = rankings.head(20)
top_variables.to_csv(output_dir / 'top_20_variables.csv', index=False)

print("\n" + "="*80)
print("MODELING COMPLETE")
print("="*80)
print(f"\nKey outputs saved to: {output_dir}")
print("- consolidated_variable_rankings.csv")
print("- top_20_variables.csv")
print("- logistic_regression_coefficients.csv")
print("- random_forest_importance.csv")
if XGBOOST_AVAILABLE:
    print("- shap_importance.csv")
    print("- shap_values.csv")
