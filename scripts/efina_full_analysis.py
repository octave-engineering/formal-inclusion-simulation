"""
EFInA Comprehensive Analysis - Full Pipeline
Identify and rank all drivers of Formal Financial Inclusion (2018-2023)
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import warnings
import json
from scipy import stats
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import cross_val_score
from sklearn.linear_model import LogisticRegression, LassoCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
import statsmodels.api as sm
import statsmodels.formula.api as smf
from statsmodels.stats.outliers_influence import variance_inflation_factor

warnings.filterwarnings('ignore')
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette('husl')

# Paths
output_dir = Path('efina_analysis_results')
output_dir.mkdir(exist_ok=True)
(output_dir / 'figures').mkdir(exist_ok=True)

print("="*80)
print("EFINA COMPREHENSIVE FORMAL FINANCIAL INCLUSION ANALYSIS")
print("="*80)

# ============================================================================
# 1. LOAD AND PREPARE DATA
# ============================================================================

print("\n[1] Loading data...")
df = pd.read_excel('dataset/recent_data.xlsx')
print(f"   Shape: {df.shape}")
print(f"   Years: {sorted(df['Year'].unique())}")

# Define key variables
DEPENDENT_VAR = 'FormallyIncluded'
YEAR_VAR = 'Year'

print(f"\n✓ Dependent variable: {DEPENDENT_VAR}")
print(f"   Distribution: {df[DEPENDENT_VAR].value_counts().to_dict()}")
print(f"   Inclusion rate: {df[DEPENDENT_VAR].mean():.2%}")

# ============================================================================
# 2. FEATURE ENGINEERING
# ============================================================================

print("\n[2] Feature engineering...")

# Create binary/categorical encodings
def safe_binary_encode(series, yes_values=['Yes', 'yes', 'YES', '1', 1]):
    return series.isin(yes_values).astype(int)

# Mobile money binary
if 'MobileMoneyUsage' in df.columns:
    df['mobile_money_binary'] = safe_binary_encode(df['MobileMoneyUsage'])

# Transactional account binary
if 'TransactionalAccount' in df.columns:
    df['transactional_account_binary'] = safe_binary_encode(df['TransactionalAccount'])

# Financial agents binary
if 'FinancialAgents' in df.columns:
    df['financial_agents_binary'] = safe_binary_encode(df['FinancialAgents'])

# Gender binary (Male=1, Female=0)
if 'Gender' in df.columns:
    df['gender_male'] = (df['Gender'] == 'Male').astype(int)

# Urban/Rural binary (Urban=1, Rural=0)
if 'Sector' in df.columns:
    df['urban'] = (df['Sector'] == 'Urban').astype(int)

# Education level encoding (ordinal)
if 'EducationLevel' in df.columns:
    education_map = {
        'Below Secondary Education': 1,
        'Secondary Education': 2,
        'Above Secondary Education': 3
    }
    df['education_numeric'] = df['EducationLevel'].map(education_map)

# Income level extraction (numeric midpoint)
def extract_income_midpoint(income_str):
    if pd.isna(income_str) or income_str in ['Don\'t know', 'Refused', 'No response']:
        return np.nan
    income_str = str(income_str).replace('₦', '').replace(',', '')
    if 'Below' in income_str:
        try:
            return float(income_str.split('Below')[1].strip()) / 2
        except:
            return np.nan
    elif 'Above' in income_str:
        try:
            return float(income_str.split('Above')[1].strip()) * 1.5
        except:
            return np.nan
    elif '–' in income_str or '-' in income_str:
        try:
            parts = income_str.replace('–', '-').split('-')
            return (float(parts[0].strip()) + float(parts[1].strip())) / 2
        except:
            return np.nan
    return np.nan

if 'IncomeLevel' in df.columns:
    df['income_numeric'] = df['IncomeLevel'].apply(extract_income_midpoint)

# Wealth quintile encoding
if 'WealthQuintile' in df.columns:
    wealth_map = {'Poorest': 1, 'Poor': 2, 'Moderate': 3, 'Rich': 4, 'Richest': 5}
    df['wealth_numeric'] = df['WealthQuintile'].map(wealth_map)

# Savings frequency encoding
if 'SavingFrequency' in df.columns:
    savings_map = {
        'No response': 0,
        'Occasionally/when you have surplus money': 1,
        'Monthly': 2,
        'Weekly': 3,
        'Daily': 4
    }
    df['savings_frequency_numeric'] = df['SavingFrequency'].map(savings_map)

# Running out of money binary
if 'RunningOutOfMoneyFrequency (for 12 months)' in df.columns:
    df['runs_out_of_money'] = safe_binary_encode(df['RunningOutOfMoneyFrequency (for 12 months)'])

# Region dummies
if 'region' in df.columns:
    region_dummies = pd.get_dummies(df['region'], prefix='region', drop_first=True)
    df = pd.concat([df, region_dummies], axis=1)

# Year dummies
year_dummies = pd.get_dummies(df[YEAR_VAR], prefix='year', drop_first=True)
df = pd.concat([df, year_dummies], axis=1)

print(f"✓ Feature engineering complete")

# ============================================================================
# 3. CREATE ACCESS TO FINANCIAL AGENTS INDEX
# ============================================================================

print("\n[3] Creating Access to Financial Agents index...")

# Components for the index
agent_components = []

if 'financial_agents_binary' in df.columns:
    agent_components.append('financial_agents_binary')
    print("   • Using: FinancialAgents (direct)")

if 'transactional_account_binary' in df.columns:
    agent_components.append('transactional_account_binary')
    print("   • Using: TransactionalAccount (proxy)")

if 'mobile_money_binary' in df.columns:
    agent_components.append('mobile_money_binary')
    print("   • Using: MobileMoneyUsage (proxy)")

# Create composite index
if len(agent_components) > 0:
    # Standardize each component
    scaler = StandardScaler()
    components_scaled = scaler.fit_transform(df[agent_components].fillna(0))
    
    # Equal-weighted average
    df['access_agents_raw'] = components_scaled.mean(axis=1)
    
    # Rescale to [0, 1]
    min_val = df['access_agents_raw'].min()
    max_val = df['access_agents_raw'].max()
    df['access_agents'] = (df['access_agents_raw'] - min_val) / (max_val - min_val)
    
    print(f"\n✓ Access to Financial Agents index created")
    print(f"   Components: {agent_components}")
    print(f"   Range: [{df['access_agents'].min():.3f}, {df['access_agents'].max():.3f}]")
    print(f"   Mean: {df['access_agents'].mean():.3f}")
    
    # Save component info
    with open(output_dir / 'access_agents_definition.txt', 'w') as f:
        f.write("Access to Financial Agents Index\n")
        f.write("="*50 + "\n\n")
        f.write("Components:\n")
        for i, comp in enumerate(agent_components, 1):
            f.write(f"{i}. {comp}\n")
        f.write("\nConstruction:\n")
        f.write("1. Each component standardized (z-score)\n")
        f.write("2. Equal-weighted average of standardized components\n")
        f.write("3. Rescaled to [0, 1] range using min-max normalization\n")
        f.write(f"\nStatistics:\n")
        f.write(f"Mean: {df['access_agents'].mean():.4f}\n")
        f.write(f"Std: {df['access_agents'].std():.4f}\n")
        f.write(f"Min: {df['access_agents'].min():.4f}\n")
        f.write(f"Max: {df['access_agents'].max():.4f}\n")
else:
    print("⚠ WARNING: No agent-related variables found for index creation")
    df['access_agents'] = 0

# ============================================================================
# 4. DEFINE PREDICTOR VARIABLES
# ============================================================================

print("\n[4] Identifying predictor variables...")

# All potential predictors
predictors = []

# Demographics
demographic_vars = ['Age_numeric', 'gender_male', 'education_numeric', 'wealth_numeric']
predictors.extend([v for v in demographic_vars if v in df.columns])

# Financial behavior
financial_vars = ['mobile_money_binary', 'transactional_account_binary', 
                 'savings_frequency_numeric', 'runs_out_of_money', 'income_numeric']
predictors.extend([v for v in financial_vars if v in df.columns])

# Agent access
if 'access_agents' in df.columns:
    predictors.append('access_agents')

# Geography
geo_vars = ['urban'] + [col for col in df.columns if col.startswith('region_')]
predictors.extend([v for v in geo_vars if v in df.columns])

# Time
year_vars = [col for col in df.columns if col.startswith('year_')]
predictors.extend(year_vars)

# Population
if 'Population' in df.columns:
    predictors.append('Population')

print(f"✓ Identified {len(predictors)} predictor variables:")
for pred in predictors:
    print(f"   • {pred}")

# Save predictor list
with open(output_dir / 'predictor_variables.txt', 'w') as f:
    f.write("Predictor Variables for Formal Financial Inclusion\n")
    f.write("="*50 + "\n\n")
    for i, pred in enumerate(predictors, 1):
        f.write(f"{i}. {pred}\n")

# ============================================================================
# 5. EXPLORATORY DATA ANALYSIS
# ============================================================================

print("\n[5] Performing EDA...")

# Summary stats
summary_stats = df[predictors + [DEPENDENT_VAR]].describe().T
summary_stats.to_csv(output_dir / 'summary_statistics_predictors.csv')
print(f"✓ Saved summary statistics")

# Correlation with dependent variable
correlations = []
for pred in predictors:
    if pred in df.columns and df[pred].dtype in [np.float64, np.int64, np.int32]:
        corr = df[[pred, DEPENDENT_VAR]].corr().iloc[0, 1]
        correlations.append({'variable': pred, 'correlation': corr})

corr_df = pd.DataFrame(correlations).sort_values('correlation', ascending=False, key=abs)
corr_df.to_csv(output_dir / 'correlations_with_formal_inclusion.csv', index=False)
print(f"\n Top 10 correlations with {DEPENDENT_VAR}:")
print(corr_df.head(10))

# Plot correlation
fig, ax = plt.subplots(figsize=(10, 8))
top_20_corr = corr_df.head(20)
colors = ['green' if x > 0 else 'red' for x in top_20_corr['correlation']]
ax.barh(top_20_corr['variable'], top_20_corr['correlation'], color=colors)
ax.set_xlabel('Correlation with Formal Inclusion', fontsize=12)
ax.set_title('Top 20 Predictors by Correlation', fontsize=14, fontweight='bold')
ax.axvline(0, color='black', linestyle='-', linewidth=0.8)
plt.tight_layout()
plt.savefig(output_dir / 'figures' / 'top_correlations.png', dpi=300, bbox_inches='tight')
plt.close()

# Year-over-year trends
yearly_stats = df.groupby(YEAR_VAR).agg({
    DEPENDENT_VAR: ['mean', 'std', 'count']
}).round(4)
yearly_stats.columns = ['inclusion_rate', 'std', 'count']
yearly_stats.to_csv(output_dir / 'yearly_inclusion_trends.csv')

print(f"\nYearly inclusion rates:")
print(yearly_stats)

# Plot time series
fig, ax = plt.subplots(figsize=(10, 6))
ax.plot(yearly_stats.index, yearly_stats['inclusion_rate'], marker='o', linewidth=2, markersize=10)
ax.fill_between(yearly_stats.index, 
                yearly_stats['inclusion_rate'] - yearly_stats['std'],
                yearly_stats['inclusion_rate'] + yearly_stats['std'],
                alpha=0.3)
ax.set_xlabel('Year', fontsize=12)
ax.set_ylabel('Formal Financial Inclusion Rate', fontsize=12)
ax.set_title('Formal Financial Inclusion Rate Over Time', fontsize=14, fontweight='bold')
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(output_dir / 'figures' / 'inclusion_rate_time_series.png', dpi=300, bbox_inches='tight')
plt.close()

print(f"✓ EDA complete, saved figures")

# Save prepared dataset
df.to_csv(output_dir / 'prepared_dataset.csv', index=False)
print(f"\n✓ Saved prepared dataset")

print("\n" + "="*80)
print("PART 1 COMPLETE: Data preparation and EDA")
print("="*80)
