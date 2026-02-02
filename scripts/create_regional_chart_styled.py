"""
Create regional formal inclusion chart in agents_growth_analysis style
"""
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from pathlib import Path

sns.set_style("whitegrid")
plt.rcParams['font.family'] = 'Arial'

output_dir = Path('efina_analysis_results')

# Load regional data
regional_trends = pd.read_csv(output_dir / 'regional_yearly_trends.csv')

# Convert to percentage
regional_trends['inclusion_rate'] = regional_trends['inclusion_rate'] * 100

# Pivot for easier plotting
regional_pivot = regional_trends.pivot(index='Year', columns='region', values='inclusion_rate')

# Calculate changes
changes_2018_2023 = {}
for region in regional_pivot.columns:
    change = regional_pivot.loc[2023, region] - regional_pivot.loc[2018, region]
    changes_2018_2023[region] = change

# ============================================================================
# Create styled chart (matching agents_growth_analysis)
# ============================================================================

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

# Define colors for each region (professional palette)
region_colors = {
    'South West': '#f44336',      # Red (highest)
    'South South': '#ff9800',     # Orange
    'North Central': '#4caf50',   # Green
    'South East': '#2196f3',      # Blue
    'North West': '#9c27b0',      # Purple
    'North East': '#795548'       # Brown (lowest)
}

# Sort regions by 2023 inclusion rate for legend
regions_sorted = regional_pivot.loc[2023].sort_values(ascending=False).index

# ============================================================================
# LEFT PLOT: Time series of all regions
# ============================================================================

years = regional_pivot.index

for region in regions_sorted:
    values = regional_pivot[region].values
    color = region_colors[region]
    
    # Plot line with markers
    ax1.plot(years, values, marker='o', linewidth=3, markersize=10, 
             color=color, label=region, markeredgewidth=2, markeredgecolor='white')
    
    # Add value annotation for 2023
    final_val = values[-1]
    ax1.annotate(f'{final_val:.1f}%', (2023, final_val), 
                textcoords="offset points", xytext=(10, 0), 
                ha='left', fontsize=9, fontweight='bold', color=color)

ax1.set_xlabel('Year', fontsize=13, fontweight='bold')
ax1.set_ylabel('Formal Inclusion Rate (%)', fontsize=13, fontweight='bold')
ax1.set_title('Regional Inclusion Trends (2018-2023)\nAll Six Regions', 
             fontsize=14, fontweight='bold', pad=15)
ax1.grid(True, alpha=0.3)
ax1.set_xticks(years)
ax1.set_ylim(20, 90)
ax1.legend(loc='upper left', fontsize=10, frameon=True, fancybox=True)

# ============================================================================
# RIGHT PLOT: Change 2018-2023 (bar chart with starting point reference)
# ============================================================================

# Sort by change magnitude
changes_df = pd.DataFrame(list(changes_2018_2023.items()), columns=['Region', 'Change'])
changes_df = changes_df.sort_values('Change', ascending=True)

y_pos = np.arange(len(changes_df))
colors_bars = [region_colors[region] for region in changes_df['Region']]

bars = ax2.barh(y_pos, changes_df['Change'], color=colors_bars, 
                edgecolor='black', linewidth=2, height=0.7)

# Add value labels and 2018 → 2023 annotations
for i, (region, change) in enumerate(zip(changes_df['Region'], changes_df['Change'])):
    val_2018 = regional_pivot.loc[2018, region]
    val_2023 = regional_pivot.loc[2023, region]
    
    # Change label
    ax2.text(change + 0.5, i, f'+{change:.1f}pp', 
            va='center', fontsize=10, fontweight='bold')
    
    # 2018 → 2023 annotation (inside bar)
    ax2.text(change/2, i, f'{val_2018:.0f}% → {val_2023:.0f}%', 
            va='center', ha='center', fontsize=9, color='white', fontweight='bold')

ax2.set_yticks(y_pos)
ax2.set_yticklabels(changes_df['Region'], fontsize=11)
ax2.set_xlabel('Percentage Point Change (2018-2023)', fontsize=13, fontweight='bold')
ax2.set_title('Regional Growth: 2018 vs 2023\nChange in Inclusion Rate', 
             fontsize=14, fontweight='bold', pad=15)
ax2.axvline(0, color='black', linewidth=2)
ax2.grid(True, alpha=0.3, axis='x')

# Add annotation for highest and lowest
highest_region = changes_df.iloc[-1]['Region']
highest_change = changes_df.iloc[-1]['Change']
ax2.annotate(f'Highest growth:\n{highest_region}', 
            xy=(highest_change, len(changes_df)-1),
            xytext=(highest_change - 3, len(changes_df) - 0.5),
            fontsize=9, color=region_colors[highest_region], fontweight='bold',
            arrowprops=dict(arrowstyle='->', color=region_colors[highest_region], lw=2))

plt.tight_layout()

# Save
output_path = output_dir / 'figures' / 'regional_inclusion_styled.png'
plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
plt.close()

print(f"✓ Regional chart created: {output_path}")

# ============================================================================
# Create summary stats
# ============================================================================

print("\n" + "="*80)
print("REGIONAL FORMAL INCLUSION SUMMARY")
print("="*80)

print("\n2023 Inclusion Rates (Ranked):")
for i, region in enumerate(regions_sorted, 1):
    rate_2023 = regional_pivot.loc[2023, region]
    rate_2018 = regional_pivot.loc[2018, region]
    change = rate_2023 - rate_2018
    print(f"{i}. {region:15s}: {rate_2023:5.1f}% (2018: {rate_2018:.1f}%, Change: +{change:.1f}pp)")

print("\nKey Insights:")
highest = regions_sorted[0]
lowest = regions_sorted[-1]
gap = regional_pivot.loc[2023, highest] - regional_pivot.loc[2023, lowest]
print(f"• Gap between highest ({highest}) and lowest ({lowest}): {gap:.1f}pp")
print(f"• Average national growth: {changes_df['Change'].mean():.1f}pp")
print(f"• Fastest growing: {changes_df.iloc[-1]['Region']} (+{changes_df.iloc[-1]['Change']:.1f}pp)")
print(f"• Slowest growing: {changes_df.iloc[0]['Region']} (+{changes_df.iloc[0]['Change']:.1f}pp)")

print("="*80)
