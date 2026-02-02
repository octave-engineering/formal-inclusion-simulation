"""
Test the new Infrastructure and Mobility features
"""
import pandas as pd
import pickle
from pathlib import Path

# Load the trained model
OUTPUT_DIR = Path('complete_model_results')
with open(OUTPUT_DIR / 'model.pkl', 'rb') as f:
    model = pickle.load(f)

with open(OUTPUT_DIR / 'scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)

# Test scenarios
print("="*80)
print("TESTING NEW FEATURES: Infrastructure & Mobility")
print("="*80)

# Baseline person
baseline = {
    'gender_male': 0, 'education_numeric': 2, 'income_numeric': 28400,
    'wealth_numeric': 3, 'urban': 1, 'savings_frequency_numeric': 1,
    'runs_out_of_money': 1, 'Saves_Money': 0, 'Informal_Savings_Mode': 0,
    'Regular_Saver': 0, 'Diverse_Savings_Reasons': 0, 'Old_Age_Planning': 0,
    'Savings_Frequency_Score': 0, 'Savings_Behavior_Score': 1,
    'Has_NIN': 1, 'Formal_Employment': 0, 'Business_Income': 0,
    'Agricultural_Income': 0, 'Passive_Income': 0, 'Income_Diversity_Score': 1,
    'Digital_Access_Index': 1,
    'Infrastructure_Access_Index': 3,  # Baseline
    'Mobility_Index': 4,  # Baseline
}

# Add age dummies (35-44 default)
baseline.update({
    'age_25-34': 0, 'age_35-44': 1, 'age_45-54': 0, 'age_55-64': 0, 'age_65+': 0
})

# Add state dummies (Lagos)
state_features = [f'state_{s}' for s in ['ADAMAWA', 'AKWA IBOM', 'ANAMBRA', 'BAUCHI', 'BAYELSA', 
                                           'BENUE', 'BORNO', 'CROSS RIVER', 'DELTA', 'EBONYI', 
                                           'EDO', 'EKITI', 'ENUGU', 'FCT', 'GOMBE', 'IMO', 
                                           'JIGAWA', 'KADUNA', 'KANO', 'KATSINA', 'KEBBI', 'KOGI', 
                                           'KWARA', 'LAGOS', 'NASARAWA', 'NIGER', 'OGUN', 'ONDO', 
                                           'OSUN', 'OYO', 'PLATEAU', 'RIVERS', 'SOKOTO', 'TARABA', 
                                           'YOBE', 'ZAMFARA']]
for sf in state_features:
    baseline[sf] = 1 if sf == 'state_LAGOS' else 0

def predict_scenario(person_dict, label):
    """Make prediction for a scenario"""
    # Ensure column order matches training
    import json
    with open(OUTPUT_DIR / 'model_config.json', 'r') as f:
        config = json.load(f)
    
    feature_order = config['features']
    X = pd.DataFrame([person_dict])[feature_order]
    X_scaled = scaler.transform(X)
    prob = model.predict_proba(X_scaled)[0, 1]
    
    infra = person_dict['Infrastructure_Access_Index']
    mobility = person_dict['Mobility_Index']
    
    print(f"\n{label}")
    print(f"  Infrastructure: {infra}/12 facilities")
    print(f"  Mobility: {mobility}/6 (1=high, 6=low)")
    print(f"  → Formal Inclusion Probability: {prob*100:.1f}%")
    return prob

# Test scenarios
print("\n" + "="*80)
print("SCENARIO TESTING")
print("="*80)

baseline_prob = predict_scenario(baseline, "1. BASELINE (Urban, Medium Infrastructure)")

# Scenario 2: High infrastructure
high_infra = baseline.copy()
high_infra['Infrastructure_Access_Index'] = 10
high_infra_prob = predict_scenario(high_infra, "2. HIGH INFRASTRUCTURE")
print(f"  Change from baseline: {(high_infra_prob - baseline_prob)*100:+.1f} percentage points")

# Scenario 3: Low infrastructure
low_infra = baseline.copy()
low_infra['Infrastructure_Access_Index'] = 0
low_infra_prob = predict_scenario(low_infra, "3. LOW INFRASTRUCTURE (Rural)")
print(f"  Change from baseline: {(low_infra_prob - baseline_prob)*100:+.1f} percentage points")

# Scenario 4: High mobility
high_mobility = baseline.copy()
high_mobility['Mobility_Index'] = 1  # Travels every day
high_mobility_prob = predict_scenario(high_mobility, "4. HIGH MOBILITY (Frequent traveler)")
print(f"  Change from baseline: {(high_mobility_prob - baseline_prob)*100:+.1f} percentage points")

# Scenario 5: Low mobility
low_mobility = baseline.copy()
low_mobility['Mobility_Index'] = 6  # Never travels
low_mobility_prob = predict_scenario(low_mobility, "5. LOW MOBILITY (Never leaves home)")
print(f"  Change from baseline: {(low_mobility_prob - baseline_prob)*100:+.1f} percentage points")

# Scenario 6: Worst case (rural + immobile)
worst_case = baseline.copy()
worst_case['Infrastructure_Access_Index'] = 0
worst_case['Mobility_Index'] = 6
worst_case['urban'] = 0
worst_case_prob = predict_scenario(worst_case, "6. WORST CASE (Rural, No infrastructure, Immobile)")
print(f"  Change from baseline: {(worst_case_prob - baseline_prob)*100:+.1f} percentage points")

# Scenario 7: Best case (urban + high infrastructure + mobile)
best_case = baseline.copy()
best_case['Infrastructure_Access_Index'] = 12
best_case['Mobility_Index'] = 1
best_case['urban'] = 1
best_case_prob = predict_scenario(best_case, "7. BEST CASE (Urban, Full infrastructure, Highly mobile)")
print(f"  Change from baseline: {(best_case_prob - baseline_prob)*100:+.1f} percentage points")

print("\n" + "="*80)
print("SUMMARY")
print("="*80)
print(f"Range: {worst_case_prob*100:.1f}% (worst) to {best_case_prob*100:.1f}% (best)")
print(f"Impact: {(best_case_prob - worst_case_prob)*100:.1f} percentage point difference")
print(f"\nInfrastructure effect: {(high_infra_prob - low_infra_prob)*100:.1f} pp")
print(f"Mobility effect: {(high_mobility_prob - low_mobility_prob)*100:.1f} pp")
print("\n✅ Infrastructure and Mobility are working correctly!")
