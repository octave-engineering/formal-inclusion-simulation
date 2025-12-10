import json

with open('dashboard/public/population_data.json') as f:
    data = json.load(f)

print(f"Total records: {len(data)}")
print(f"\nKeys in first record ({len(data[0])} total):")
print(list(data[0].keys()))

print(f"\nSample values:")
print(f"  state: {data[0].get('state', 'NOT FOUND')}")
print(f"  Has_NIN: {data[0].get('Has_NIN', 'NOT FOUND')}")
print(f"  Digital_Access_Index: {data[0].get('Digital_Access_Index', 'NOT FOUND')}")
print(f"  Formally_Included: {data[0].get('Formally_Included', 'NOT FOUND')}")

print(f"\nHas state dummies:")
print(f"  state_LAGOS: {'state_LAGOS' in data[0]}")
print(f"  state_KANO: {'state_KANO' in data[0]}")

print(f"\nHas age dummies:")
print(f"  age_25-34: {'age_25-34' in data[0]}")
print(f"  age_35-44: {'age_35-44' in data[0]}")
