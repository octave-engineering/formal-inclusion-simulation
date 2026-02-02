"""
Year-over-Year Progression Analysis and Driver Explanations
Decomposition and detailed evidence for each driver
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import warnings

warnings.filterwarnings('ignore')
plt.style.use('seaborn-v0_8-darkgrid')

output_dir = Path('efina_analysis_results')

print("="*80)
print("YEAR-OVER-YEAR PROGRESSION & DRIVER ANALYSIS")
print("="*80)

# ============================================================================
# 1. LOAD DATA
# ============================================================================

print("\n[1] Loading data...")
df = pd.read_csv(output_dir / 'prepared_dataset.csv')
top_vars = pd.read_csv(output_dir / 'top_20_variables.csv')
yearly_trends = pd.read_csv(output_dir / 'yearly_inclusion_trends.csv')

print(f"   Data shape: {df.shape}")
print(f"   Top variables: {len(top_vars)}")

# ============================================================================
# 2. YEAR-OVER-YEAR CHANGES
# ============================================================================

print("\n[2] Computing year-over-year changes...")

# Overall inclusion rate by year
yearly_trends['yoy_change'] = yearly_trends['inclusion_rate'].diff()
yearly_trends['yoy_pct_change'] = yearly_trends['inclusion_rate'].pct_change() * 100

print("\nYearly Inclusion Rates:")
print(yearly_trends)

# By region
if 'region' in df.columns:
    regional_trends = df.groupby(['Year', 'region'])['FormallyIncluded'].agg(['mean', 'count']).reset_index()
    regional_trends.columns = ['Year', 'region', 'inclusion_rate', 'count']
    regional_trends.to_csv(output_dir / 'regional_yearly_trends.csv', index=False)
    
    print("\nRegional Trends:")
    regional_pivot = regional_trends.pivot(index='region', columns='Year', values='inclusion_rate')
    print(regional_pivot)
    
    # Plot regional trends
    fig, ax = plt.subplots(figsize=(12, 6))
    for region in regional_pivot.index:
        ax.plot(regional_pivot.columns, regional_pivot.loc[region], 
                marker='o', label=region, linewidth=2, markersize=8)
    ax.set_xlabel('Year', fontsize=12)
    ax.set_ylabel('Formal Inclusion Rate', fontsize=12)
    ax.set_title('Formal Inclusion Rate by Region (2018-2023)', fontsize=14, fontweight='bold')
    ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(output_dir / 'figures' / 'regional_trends.png', dpi=300, bbox_inches='tight')
    plt.close()

# By urban/rural
if 'Sector' in df.columns:
    sector_trends = df.groupby(['Year', 'Sector'])['FormallyIncluded'].agg(['mean', 'count']).reset_index()
    sector_trends.columns = ['Year', 'Sector', 'inclusion_rate', 'count']
    sector_trends.to_csv(output_dir / 'sector_yearly_trends.csv', index=False)
    
    print("\nUrban vs Rural Trends:")
    sector_pivot = sector_trends.pivot(index='Sector', columns='Year', values='inclusion_rate')
    print(sector_pivot)
    
    # Plot sector trends
    fig, ax = plt.subplots(figsize=(10, 6))
    for sector in sector_pivot.index:
        ax.plot(sector_pivot.columns, sector_pivot.loc[sector], 
                marker='o', label=sector, linewidth=2, markersize=10)
    ax.set_xlabel('Year', fontsize=12)
    ax.set_ylabel('Formal Inclusion Rate', fontsize=12)
    ax.set_title('Formal Inclusion Rate: Urban vs Rural (2018-2023)', fontsize=14, fontweight='bold')
    ax.legend()
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(output_dir / 'figures' / 'urban_rural_trends.png', dpi=300, bbox_inches='tight')
    plt.close()

# By gender
if 'Gender' in df.columns:
    gender_trends = df.groupby(['Year', 'Gender'])['FormallyIncluded'].agg(['mean', 'count']).reset_index()
    gender_trends.columns = ['Year', 'Gender', 'inclusion_rate', 'count']
    gender_trends.to_csv(output_dir / 'gender_yearly_trends.csv', index=False)
    
    print("\nGender Trends:")
    gender_pivot = gender_trends.pivot(index='Gender', columns='Year', values='inclusion_rate')
    print(gender_pivot)

# ============================================================================
# 3. DRIVER CHANGES OVER TIME
# ============================================================================

print("\n[3] Analyzing driver changes over time...")

# Top 10 variables
top_10_vars = top_vars.head(10)['variable'].tolist()

driver_trends = {}
for var in top_10_vars:
    if var in df.columns and var not in ['year_2020', 'year_2023']:
        yearly_means = df.groupby('Year')[var].mean()
        driver_trends[var] = yearly_means

driver_trends_df = pd.DataFrame(driver_trends).T
driver_trends_df['change_2018_2023'] = driver_trends_df[2023] - driver_trends_df[2018]
driver_trends_df['pct_change_2018_2023'] = (driver_trends_df[2023] - driver_trends_df[2018]) / driver_trends_df[2018] * 100

print("\nDriver Changes (2018-2023):")
print(driver_trends_df)

driver_trends_df.to_csv(output_dir / 'driver_changes_over_time.csv')

# ============================================================================
# 4. WATERFALL CHART - CONTRIBUTION TO CHANGE
# ============================================================================

print("\n[4] Creating contribution waterfall chart...")

# Compute contribution of each driver to the overall change
# Using correlation approach as approximation
inclusion_change = yearly_trends.loc[yearly_trends['Year']==2023, 'inclusion_rate'].values[0] - \
                   yearly_trends.loc[yearly_trends['Year']==2018, 'inclusion_rate'].values[0]

contributions = []
for var in top_10_vars:
    if var in df.columns and var not in ['year_2020', 'year_2023']:
        # Get change in variable
        var_2018 = df[df['Year']==2018][var].mean()
        var_2023 = df[df['Year']==2023][var].mean()
        var_change = var_2023 - var_2018
        
        # Get coefficient from rankings
        coef = top_vars[top_vars['variable']==var]['coefficient'].values[0]
        
        # Estimated contribution (coefficient * change)
        contrib = coef * var_change
        contributions.append({
            'variable': var,
            'contribution': contrib,
            'var_change': var_change
        })

contrib_df = pd.DataFrame(contributions)
contrib_df = contrib_df.sort_values('contribution', ascending=False)

# Normalize contributions to sum to actual change
total_contrib = contrib_df['contribution'].sum()
if total_contrib != 0:
    contrib_df['contribution_normalized'] = contrib_df['contribution'] / total_contrib * inclusion_change
else:
    contrib_df['contribution_normalized'] = 0

contrib_df.to_csv(output_dir / 'driver_contributions_to_change.csv', index=False)

print("\nDriver Contributions to 2018-2023 Change:")
print(contrib_df[['variable', 'contribution_normalized', 'var_change']])

# Plot waterfall
fig, ax = plt.subplots(figsize=(12, 8))
variables = contrib_df['variable'].tolist()
values = contrib_df['contribution_normalized'].tolist()

# Cumulative values for waterfall
cumulative = [yearly_trends.loc[yearly_trends['Year']==2018, 'inclusion_rate'].values[0]]
for val in values:
    cumulative.append(cumulative[-1] + val)

# Plot bars
colors = ['green' if v > 0 else 'red' for v in values]
for i, (var, val) in enumerate(zip(variables, values)):
    ax.bar(i, val, bottom=cumulative[i], color=colors[i], alpha=0.7, edgecolor='black')
    
# Add start and end lines
ax.axhline(cumulative[0], color='blue', linestyle='--', linewidth=2, label='2018 Baseline')
ax.axhline(cumulative[-1], color='purple', linestyle='--', linewidth=2, label='2023 Actual')

ax.set_xticks(range(len(variables)))
ax.set_xticklabels(variables, rotation=45, ha='right')
ax.set_ylabel('Formal Inclusion Rate', fontsize=12)
ax.set_title('Waterfall: Contribution of Top Drivers to Change (2018-2023)', fontsize=14, fontweight='bold')
ax.legend()
ax.grid(True, alpha=0.3, axis='y')
plt.tight_layout()
plt.savefig(output_dir / 'figures' / 'waterfall_contributions.png', dpi=300, bbox_inches='tight')
plt.close()

# ============================================================================
# 5. TOP DRIVER EXPLANATIONS
# ============================================================================

print("\n[5] Generating driver explanations...")

explanations = []

# Access to Financial Agents
if 'access_agents' in top_10_vars:
    agent_by_year = df.groupby('Year')['access_agents'].mean()
    agent_by_inclusion = df.groupby('FormallyIncluded')['access_agents'].mean()
    
    explanation = f"""
### 1. ACCESS TO FINANCIAL AGENTS (Rank #1)

**Mechanism:**
Access to financial agents (bank branches, ATMs, mobile money agents, POS terminals) reduces 
barriers to formal financial inclusion by providing convenient touchpoints for opening accounts, 
making transactions, and accessing financial services.

**Evidence from EFInA Data:**
- Coefficient: {top_vars[top_vars['variable']=='access_agents']['coefficient'].values[0]:.4f} (highest)
- SHAP Importance: {top_vars[top_vars['variable']=='access_agents']['shap_importance'].values[0]:.4f}
- Mean access index (2018): {agent_by_year.get(2018, 0):.4f}
- Mean access index (2023): {agent_by_year.get(2023, 0):.4f}
- Change: {agent_by_year.get(2023, 0) - agent_by_year.get(2018, 0):.4f} ({(agent_by_year.get(2023, 0) - agent_by_year.get(2018, 0))/agent_by_year.get(2018, 1)*100:.1f}%)

**Differential by Inclusion Status:**
- Formally included: {agent_by_inclusion.get(1, 0):.4f}
- Not formally included: {agent_by_inclusion.get(0, 0):.4f}
- Difference: {agent_by_inclusion.get(1, 0) - agent_by_inclusion.get(0, 0):.4f}

**Policy Implication:**
Expanding agent networks, particularly in underserved areas, is the single most effective 
intervention to increase formal financial inclusion.
"""
    explanations.append(explanation)

# Education
if 'education_numeric' in top_10_vars:
    edu_by_year = df.groupby('Year')['education_numeric'].mean()
    edu_by_inclusion = df.groupby('FormallyIncluded')['education_numeric'].mean()
    
    explanation = f"""
### 2. EDUCATION LEVEL (Rank #4)

**Mechanism:**
Higher education increases financial literacy, awareness of formal financial products, ability 
to navigate banking procedures, and income-earning potential, all of which facilitate formal 
financial inclusion.

**Evidence from EFInA Data:**
- Coefficient: {top_vars[top_vars['variable']=='education_numeric']['coefficient'].values[0]:.4f}
- Mean education (2018): {edu_by_year.get(2018, 0):.2f}
- Mean education (2023): {edu_by_year.get(2023, 0):.2f}
- Change: {edu_by_year.get(2023, 0) - edu_by_year.get(2018, 0):.3f}

**Differential by Inclusion Status:**
- Formally included: {edu_by_inclusion.get(1, 0):.2f}
- Not formally included: {edu_by_inclusion.get(0, 0):.2f}
- Difference: {edu_by_inclusion.get(1, 0) - edu_by_inclusion.get(0, 0):.2f} education levels

**Policy Implication:**
Financial literacy programs and educational initiatives can significantly boost inclusion rates,
especially when targeted at lower-education segments.
"""
    explanations.append(explanation)

# Wealth
if 'wealth_numeric' in top_10_vars:
    wealth_by_year = df.groupby('Year')['wealth_numeric'].mean()
    wealth_by_inclusion = df.groupby('FormallyIncluded')['wealth_numeric'].mean()
    
    explanation = f"""
### 3. WEALTH LEVEL (Rank #3)

**Mechanism:**
Wealthier individuals have greater ability to maintain minimum balances, more frequent 
transactions, and stronger incentives to use formal financial services for asset protection 
and investment.

**Evidence from EFInA Data:**
- Coefficient: {top_vars[top_vars['variable']=='wealth_numeric']['coefficient'].values[0]:.4f}
- Mean wealth quintile (2018): {wealth_by_year.get(2018, 0):.2f}
- Mean wealth quintile (2023): {wealth_by_year.get(2023, 0):.2f}
- Change: {wealth_by_year.get(2023, 0) - wealth_by_year.get(2018, 0):.3f}

**Differential by Inclusion Status:**
- Formally included: {wealth_by_inclusion.get(1, 0):.2f}
- Not formally included: {wealth_by_inclusion.get(0, 0):.2f}
- Difference: {wealth_by_inclusion.get(1, 0) - wealth_by_inclusion.get(0, 0):.2f} quintiles

**Policy Implication:**
Low-cost, zero-balance account products and social safety net payments through formal accounts 
can extend inclusion to lower-wealth segments.
"""
    explanations.append(explanation)

# Save all explanations
with open(output_dir / 'driver_explanations.md', 'w') as f:
    f.write("# Drivers of Formal Financial Inclusion: Detailed Explanations\n\n")
    f.write("## Based on EFInA Data Analysis (2018-2023)\n\n")
    f.write("="*80 + "\n\n")
    for exp in explanations:
        f.write(exp)
        f.write("\n" + "="*80 + "\n\n")

print(f"\n✓ Generated {len(explanations)} detailed driver explanations")

# ============================================================================
# 6. REGIONAL DECOMPOSITION
# ============================================================================

print("\n[6] Regional decomposition...")

if 'region' in df.columns:
    # Inclusion rate by region and year
    regional_detail = df.groupby(['Year', 'region']).agg({
        'FormallyIncluded': 'mean',
        'access_agents': 'mean',
        'education_numeric': 'mean',
        'wealth_numeric': 'mean'
    }).reset_index()
    
    regional_detail.to_csv(output_dir / 'regional_detailed_trends.csv', index=False)
    
    # Heatmap of inclusion by region and year
    inclusion_heatmap = regional_detail.pivot(index='region', columns='Year', values='FormallyIncluded')
    
    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(inclusion_heatmap, annot=True, fmt='.2%', cmap='RdYlGn', 
                cbar_kws={'label': 'Inclusion Rate'}, ax=ax)
    ax.set_title('Formal Inclusion Rate Heatmap by Region and Year', fontsize=14, fontweight='bold')
    ax.set_xlabel('Year', fontsize=12)
    ax.set_ylabel('Region', fontsize=12)
    plt.tight_layout()
    plt.savefig(output_dir / 'figures' / 'regional_heatmap.png', dpi=300, bbox_inches='tight')
    plt.close()

print("\n" + "="*80)
print("YEAR-OVER-YEAR ANALYSIS COMPLETE")
print("="*80)
