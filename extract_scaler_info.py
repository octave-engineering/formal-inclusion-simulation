import json

with open('complete_model_results/model_config.json', 'r') as f:
    config = json.load(f)

print(f"Total features: {len(config['features'])}")
print(f"Scaler mean length: {len(config['scaler_mean'])}")
print(f"Scaler scale length: {len(config['scaler_scale'])}")

# Find indices of new features
infra_idx = config['features'].index('Infrastructure_Access_Index')
mob_idx = config['features'].index('Mobility_Index')

print(f"\nInfrastructure_Access_Index (index {infra_idx}):")
print(f"  Mean: {config['scaler_mean'][infra_idx]}")
print(f"  Scale: {config['scaler_scale'][infra_idx]}")

print(f"\nMobility_Index (index {mob_idx}):")
print(f"  Mean: {config['scaler_mean'][mob_idx]}")
print(f"  Scale: {config['scaler_scale'][mob_idx]}")
