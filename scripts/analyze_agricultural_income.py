"""
Analyze agricultural income effect in different contexts
"""
import pandas as pd
import numpy as np

# Load the complete dataset
df = pd.read_csv('complete_model_results/complete_dataset.csv')

print("="*80)
print("AGRICULTURAL INCOME ANALYSIS")
print("="*80)

# Overall statistics
print("\n1. OVERALL DISTRIBUTION")
print(f"Total records: {len(df):,}")
print(f"Has agricultural income: {df['Agricultural_Income'].sum():,} ({df['Agricultural_Income'].mean()*100:.1f}%)")
print(f"Formally included: {df['Formally_Included'].sum():,} ({df['Formally_Included'].mean()*100:.1f}%)")

# Agricultural income alone vs with other sources
print("\n2. AGRICULTURAL INCOME SCENARIOS")

# Scenario A: ONLY agricultural income
only_ag = (df['Agricultural_Income'] == 1) & \
          (df['Formal_Employment'] == 0) & \
          (df['Business_Income'] == 0) & \
          (df['Passive_Income'] == 0)

print(f"\nA. ONLY Agricultural Income (no other sources):")
print(f"   Count: {only_ag.sum():,}")
print(f"   Formal inclusion rate: {df[only_ag]['Formally_Included'].mean()*100:.1f}%")

# Scenario B: Agricultural + Formal Employment
ag_formal = (df['Agricultural_Income'] == 1) & (df['Formal_Employment'] == 1)
print(f"\nB. Agricultural + Formal Employment:")
print(f"   Count: {ag_formal.sum():,}")
print(f"   Formal inclusion rate: {df[ag_formal]['Formally_Included'].mean()*100:.1f}%")

# Scenario C: Agricultural + Business
ag_business = (df['Agricultural_Income'] == 1) & (df['Business_Income'] == 1)
print(f"\nC. Agricultural + Business Income:")
print(f"   Count: {ag_business.sum():,}")
print(f"   Formal inclusion rate: {df[ag_business]['Formally_Included'].mean()*100:.1f}%")

# Scenario D: No agricultural income
no_ag = (df['Agricultural_Income'] == 0) & (df['income_numeric'] > 0)
print(f"\nD. Has income but NO Agricultural:")
print(f"   Count: {no_ag.sum():,}")
print(f"   Formal inclusion rate: {df[no_ag]['Formally_Included'].mean()*100:.1f}%")

# Comparison: Formal Employment with vs without agricultural income
print("\n3. IMPACT OF ADDING AGRICULTURAL TO FORMAL EMPLOYMENT")

formal_only = (df['Formal_Employment'] == 1) & (df['Agricultural_Income'] == 0)
formal_plus_ag = (df['Formal_Employment'] == 1) & (df['Agricultural_Income'] == 1)

print(f"\nFormally employed WITHOUT agricultural income:")
print(f"   Count: {formal_only.sum():,}")
print(f"   Inclusion rate: {df[formal_only]['Formally_Included'].mean()*100:.1f}%")

print(f"\nFormally employed WITH agricultural income:")
print(f"   Count: {formal_plus_ag.sum():,}")
print(f"   Inclusion rate: {df[formal_plus_ag]['Formally_Included'].mean()*100:.1f}%")

diff = df[formal_plus_ag]['Formally_Included'].mean() - df[formal_only]['Formally_Included'].mean()
print(f"\n   *** DIFFERENCE: {diff*100:+.1f} percentage points ***")

# Comparison: Business Income with vs without agricultural income
print("\n4. IMPACT OF ADDING AGRICULTURAL TO BUSINESS INCOME")

business_only = (df['Business_Income'] == 1) & (df['Agricultural_Income'] == 0)
business_plus_ag = (df['Business_Income'] == 1) & (df['Agricultural_Income'] == 1)

print(f"\nBusiness income WITHOUT agricultural:")
print(f"   Count: {business_only.sum():,}")
print(f"   Inclusion rate: {df[business_only]['Formally_Included'].mean()*100:.1f}%")

print(f"\nBusiness income WITH agricultural:")
print(f"   Count: {business_plus_ag.sum():,}")
print(f"   Inclusion rate: {df[business_plus_ag]['Formally_Included'].mean()*100:.1f}%")

diff2 = df[business_plus_ag]['Formally_Included'].mean() - df[business_only]['Formally_Included'].mean()
print(f"\n   *** DIFFERENCE: {diff2*100:+.1f} percentage points ***")

# Look at income diversity effect
print("\n5. INCOME DIVERSITY COMPENSATION")
print(f"\nIncome Diversity Score distribution with agricultural income:")
diversity_with_ag = df[df['Agricultural_Income'] == 1]['Income_Diversity_Score'].value_counts().sort_index()
print(diversity_with_ag)

print(f"\nMean Income Diversity Score:")
print(f"   With agricultural income: {df[df['Agricultural_Income'] == 1]['Income_Diversity_Score'].mean():.2f}")
print(f"   Without agricultural income: {df[df['Agricultural_Income'] == 0]['Income_Diversity_Score'].mean():.2f}")

# Urban vs Rural
print("\n6. URBAN VS RURAL EFFECT")
ag_urban = (df['Agricultural_Income'] == 1) & (df['urban'] == 1)
ag_rural = (df['Agricultural_Income'] == 1) & (df['urban'] == 0)

print(f"\nAgricultural income in URBAN areas:")
print(f"   Count: {ag_urban.sum():,}")
print(f"   Inclusion rate: {df[ag_urban]['Formally_Included'].mean()*100:.1f}%")

print(f"\nAgricultural income in RURAL areas:")
print(f"   Count: {ag_rural.sum():,}")
print(f"   Inclusion rate: {df[ag_rural]['Formally_Included'].mean()*100:.1f}%")

print("\n" + "="*80)
print("INTERPRETATION")
print("="*80)
print("""
The model coefficient (-0.36) represents the MARGINAL effect of having 
agricultural income, holding all other variables constant. This captures:

1. Correlation with rural living
2. Cash-based, irregular income patterns
3. Lower financial literacy / trust in formal systems
4. Geographic distance from financial services

If adding agricultural income to an already formally employed person REDUCES
their predicted inclusion, this suggests the coefficient may be capturing
something beyond just "farmer = excluded" - possibly:
- Multicollinearity with urban/rural
- Need for interaction terms
- Agricultural income as a marker of other barriers

Recommendation: Consider interaction terms or separate models for different
employment types to better capture these nuances.
""")
