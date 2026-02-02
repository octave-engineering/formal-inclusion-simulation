import pandas as pd

print("Testing Excel file read...")
df = pd.read_excel('dataset/AF2023_Efina.xlsx', nrows=10)
print(f"Success! Shape: {df.shape}")
print(f"\nHas required columns:")
print(f"  NIN: {'NIN' in df.columns}")
print(f"  Mobile Phone: {'Mobile Phone' in df.columns}")
print(f"  Salary_from_Government: {'Salary_from_Government_including_NYSC' in df.columns}")
print(f"  respondent_serial: {'respondent_serial' in df.columns}")

if 'NIN' in df.columns:
    print(f"\nNIN values:")
    print(df['NIN'].value_counts())
