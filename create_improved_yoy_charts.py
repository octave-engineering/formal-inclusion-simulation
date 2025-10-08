"""
Create improved variable changes visualizations
Addressing: side-by-side comparison, better handling of negatives, clearer units
"""
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from pathlib import Path

# Set style
sns.set_style("whitegrid")
plt.rcParams['font.family'] = 'Arial'

output_dir = Path('efina_analysis_results')

# Load data
driver_changes = pd.read_csv(output_dir / 'driver_changes_over_time.csv', index_col=0)

# Clean variable names
var_names = {
    'access_agents': 'Access to Agents\n(Index 0-1)',
    'wealth_numeric': 'Wealth Level\n(Quintile 1-5)',
    'income_numeric': 'Income Level\n(₦/month)',
    'urban': 'Urban Population\n(Proportion)',
    'runs_out_of_money': 'Financial Stress\n(Proportion)',
    'transactional_account_binary': 'Transactional Account\n(Proportion)',
    'savings_frequency_numeric': 'Savings Frequency\n(0-4 scale)',
    'education_numeric': 'Education Level\n(1-3 scale)',
    'Population': 'Population Density\n(per area)'
}

# Select top 8 variables by absolute change
top_vars = driver_changes.sort_values('change_2018_2023', key=abs, ascending=False).head(8)

# ============================================================================
# CHART 1: GROUPED BAR CHART (2018 vs 2023 Side-by-Side)
# ============================================================================

fig1, axes = plt.subplots(3, 3, figsize=(16, 12))
axes = axes.flatten()

for idx, (var, row) in enumerate(top_vars.iterrows()):
    ax = axes[idx]
    
    val_2018 = row['2018']
    val_2023 = row['2023']
    change_pct = row['pct_change_2018_2023']
    
    # Create grouped bars
    x = [0, 1]
    values = [val_2018, val_2023]
    colors = ['#ff9800', '#4caf50']
    
    bars = ax.bar(x, values, color=colors, edgecolor='black', linewidth=2, width=0.6)
    
    # Add value labels on bars
    for i, (val, bar) in enumerate(zip(values, bars)):
        height = bar.get_height()
        if var == 'income_numeric':
            label = f'₦{val:,.0f}'
        elif var in ['access_agents', 'urban', 'runs_out_of_money', 'transactional_account_binary']:
            label = f'{val:.2f}'
        else:
            label = f'{val:.1f}'
        
        ax.text(bar.get_x() + bar.get_width()/2., height,
                label, ha='center', va='bottom', fontsize=11, fontweight='bold')
    
    # Add change annotation
    mid_point = (val_2018 + val_2023) / 2
    color = '#4caf50' if change_pct > 0 else '#f44336'
    ax.annotate(f'{change_pct:+.1f}%', xy=(0.5, mid_point), 
                fontsize=13, fontweight='bold', color=color,
                ha='center', bbox=dict(boxstyle='round,pad=0.5', facecolor='white', edgecolor=color, linewidth=2))
    
    # Formatting
    ax.set_xticks(x)
    ax.set_xticklabels(['2018', '2023'], fontsize=11, fontweight='bold')
    ax.set_title(var_names.get(var, var), fontsize=12, fontweight='bold', pad=10)
    ax.grid(True, alpha=0.3, axis='y')
    
    # Set y-axis to start from 0 unless negative values exist
    if val_2018 >= 0 and val_2023 >= 0:
        ax.set_ylim(bottom=0)

# Remove extra subplot
axes[8].axis('off')

plt.suptitle('Variable Changes: 2018 vs 2023 Comparison\nSide-by-Side View with Percentage Change',
             fontsize=18, fontweight='bold', y=0.995)
plt.tight_layout()

fig1_path = output_dir / 'figures' / 'variables_2018_vs_2023_grouped.png'
plt.savefig(fig1_path, dpi=300, bbox_inches='tight', facecolor='white')
plt.close()

print("✓ Chart 1: Grouped bar chart created")

# ============================================================================
# CHART 2: DUMBBELL CHART (Start → End with Arrow)
# ============================================================================

fig2, ax = plt.subplots(figsize=(12, 10))

# Normalize values for better visualization (0-1 scale for each variable)
normalized_data = []
for var, row in top_vars.iterrows():
    val_2018 = row['2018']
    val_2023 = row['2023']
    change = row['change_2018_2023']
    pct_change = row['pct_change_2018_2023']
    
    # Normalize to 0-100 scale based on min/max
    min_val = min(val_2018, val_2023)
    max_val = max(val_2018, val_2023)
    range_val = max_val - min_val if max_val != min_val else 1
    
    normalized_data.append({
        'variable': var,
        'val_2018': val_2018,
        'val_2023': val_2023,
        'change': change,
        'pct_change': pct_change
    })

# Sort by percentage change (descending)
normalized_data.sort(key=lambda x: x['pct_change'], reverse=True)

y_positions = np.arange(len(normalized_data))

for i, data in enumerate(normalized_data):
    var = data['variable']
    val_2018 = data['val_2018']
    val_2023 = data['val_2023']
    pct_change = data['pct_change']
    
    # Draw line connecting 2018 to 2023
    color = '#4caf50' if pct_change > 0 else '#f44336'
    ax.plot([val_2018, val_2023], [i, i], color=color, linewidth=3, alpha=0.6, zorder=1)
    
    # Draw points
    ax.scatter(val_2018, i, s=200, color='#ff9800', edgecolor='black', linewidth=2, zorder=3, label='2018' if i == 0 else '')
    ax.scatter(val_2023, i, s=200, color='#4caf50', edgecolor='black', linewidth=2, zorder=3, label='2023' if i == 0 else '')
    
    # Add value labels
    if var == 'income_numeric':
        label_2018 = f'₦{val_2018:,.0f}'
        label_2023 = f'₦{val_2023:,.0f}'
    elif var in ['access_agents', 'urban', 'runs_out_of_money', 'transactional_account_binary']:
        label_2018 = f'{val_2018:.2f}'
        label_2023 = f'{val_2023:.2f}'
    else:
        label_2018 = f'{val_2018:.1f}'
        label_2023 = f'{val_2023:.1f}'
    
    # Position labels smartly
    if val_2023 > val_2018:
        ax.text(val_2018, i, label_2018, ha='right', va='center', fontsize=10, fontweight='bold')
        ax.text(val_2023, i, label_2023, ha='left', va='center', fontsize=10, fontweight='bold')
    else:
        ax.text(val_2018, i, label_2018, ha='left', va='center', fontsize=10, fontweight='bold')
        ax.text(val_2023, i, label_2023, ha='right', va='center', fontsize=10, fontweight='bold')
    
    # Add percentage change in middle
    mid_val = (val_2018 + val_2023) / 2
    ax.text(mid_val, i + 0.25, f'{pct_change:+.1f}%', ha='center', va='bottom',
            fontsize=11, fontweight='bold', color=color,
            bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor=color, linewidth=1.5))

# Y-axis labels
y_labels = [var_names.get(d['variable'], d['variable']) for d in normalized_data]
ax.set_yticks(y_positions)
ax.set_yticklabels(y_labels, fontsize=11)

ax.set_xlabel('Variable Value', fontsize=13, fontweight='bold')
ax.set_title('Dumbbell Chart: Variable Trajectory (2018 → 2023)\nOrange = 2018 | Green = 2023 | Arrow shows direction of change',
             fontsize=16, fontweight='bold', pad=20)
ax.legend(loc='lower right', fontsize=11, frameon=True, fancybox=True)
ax.grid(True, alpha=0.3, axis='x')

plt.tight_layout()

fig2_path = output_dir / 'figures' / 'variables_dumbbell_chart.png'
plt.savefig(fig2_path, dpi=300, bbox_inches='tight', facecolor='white')
plt.close()

print("✓ Chart 2: Dumbbell chart created")

# ============================================================================
# CHART 3: PERCENTAGE CHANGE WATERFALL (Handles Negatives Better)
# ============================================================================

fig3, ax = plt.subplots(figsize=(12, 8))

# Sort by percentage change
sorted_vars = top_vars.sort_values('pct_change_2018_2023', ascending=False)

labels = [var_names.get(idx, idx).replace('\n', ' ') for idx in sorted_vars.index]
pct_changes = sorted_vars['pct_change_2018_2023'].values

# Create bar chart with better handling of negatives
colors = ['#4caf50' if pc > 0 else '#f44336' for pc in pct_changes]
y_pos = np.arange(len(labels))

bars = ax.barh(y_pos, pct_changes, color=colors, edgecolor='black', linewidth=2, height=0.7)

# Add value labels
for i, (pc, bar) in enumerate(zip(pct_changes, bars)):
    width = bar.get_width()
    label = f'{pc:+.1f}%'
    
    if pc > 0:
        ax.text(width + 2, i, label, va='center', ha='left', fontsize=11, fontweight='bold', color='#4caf50')
    else:
        ax.text(width - 2, i, label, va='center', ha='right', fontsize=11, fontweight='bold', color='#f44336')

ax.set_yticks(y_pos)
ax.set_yticklabels(labels, fontsize=11)
ax.set_xlabel('Percentage Change (2018-2023)', fontsize=13, fontweight='bold')
ax.set_title('Percentage Change by Variable (2018-2023)\nGreen = Increase | Red = Decrease',
             fontsize=16, fontweight='bold', pad=20)
ax.axvline(0, color='black', linewidth=2)
ax.grid(True, alpha=0.3, axis='x')

# Add padding to x-axis for labels
x_min = min(pct_changes) - 20
x_max = max(pct_changes) + 20
ax.set_xlim(x_min, x_max)

plt.tight_layout()

fig3_path = output_dir / 'figures' / 'variables_pct_change_waterfall.png'
plt.savefig(fig3_path, dpi=300, bbox_inches='tight', facecolor='white')
plt.close()

print("✓ Chart 3: Percentage change waterfall created")

# ============================================================================
# CHART 4: DETAILED TABLE VIEW
# ============================================================================

fig4, ax = plt.subplots(figsize=(14, 8))
ax.axis('tight')
ax.axis('off')

# Prepare table data
table_data = []
table_data.append(['Variable', '2018 Value', '2023 Value', 'Absolute Change', '% Change', 'Direction'])

for var, row in top_vars.iterrows():
    val_2018 = row['2018']
    val_2023 = row['2023']
    change = row['change_2018_2023']
    pct_change = row['pct_change_2018_2023']
    
    # Format values based on variable type
    if var == 'income_numeric':
        val_2018_str = f'₦{val_2018:,.0f}'
        val_2023_str = f'₦{val_2023:,.0f}'
        change_str = f'₦{change:,.0f}'
    elif var in ['access_agents', 'urban', 'runs_out_of_money', 'transactional_account_binary']:
        val_2018_str = f'{val_2018:.3f}'
        val_2023_str = f'{val_2023:.3f}'
        change_str = f'{change:+.3f}'
    else:
        val_2018_str = f'{val_2018:.2f}'
        val_2023_str = f'{val_2023:.2f}'
        change_str = f'{change:+.2f}'
    
    pct_str = f'{pct_change:+.1f}%'
    direction = '↑' if change > 0 else '↓' if change < 0 else '→'
    
    var_display = var_names.get(var, var).replace('\n', ' ')
    
    table_data.append([var_display, val_2018_str, val_2023_str, change_str, pct_str, direction])

# Create table
table = ax.table(cellText=table_data, cellLoc='center', loc='center',
                colWidths=[0.35, 0.15, 0.15, 0.15, 0.12, 0.08])

table.auto_set_font_size(False)
table.set_fontsize(10)
table.scale(1, 2.5)

# Style header row
for i in range(6):
    cell = table[(0, i)]
    cell.set_facecolor('#667eea')
    cell.set_text_props(weight='bold', color='white', fontsize=11)

# Style data rows with alternating colors
for i in range(1, len(table_data)):
    for j in range(6):
        cell = table[(i, j)]
        if i % 2 == 0:
            cell.set_facecolor('#f0f0f0')
        else:
            cell.set_facecolor('white')
        
        # Color the direction column
        if j == 5:
            text = cell.get_text().get_text()
            if text == '↑':
                cell.set_text_props(color='#4caf50', weight='bold', fontsize=14)
            elif text == '↓':
                cell.set_text_props(color='#f44336', weight='bold', fontsize=14)

plt.title('Detailed Variable Changes: 2018 vs 2023\nComplete Numerical Comparison',
          fontsize=16, fontweight='bold', pad=20)

plt.tight_layout()

fig4_path = output_dir / 'figures' / 'variables_detailed_table.png'
plt.savefig(fig4_path, dpi=300, bbox_inches='tight', facecolor='white')
plt.close()

print("✓ Chart 4: Detailed table created")

# ============================================================================
# Summary
# ============================================================================

print("\n" + "="*80)
print("IMPROVED VISUALIZATIONS CREATED")
print("="*80)
print("\n4 New Charts:")
print("1. ✓ Grouped Bar Chart (2018 vs 2023 side-by-side)")
print("2. ✓ Dumbbell Chart (trajectory visualization)")
print("3. ✓ Percentage Change Waterfall (better negative handling)")
print("4. ✓ Detailed Table (complete numerical view)")
print("\nAll saved to: efina_analysis_results/figures/")
print("="*80)
