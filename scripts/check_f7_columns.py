import pandas as pd

# Try both Excel and CSV
print("=" * 60)
print("CHECKING EXCEL FILE")
print("=" * 60)
df_excel = pd.read_excel('dataset/AF2023_Efina.xlsx')
df_excel.columns = df_excel.columns.str.strip()

# Search for F7 related columns
f7_cols_excel = [c for c in df_excel.columns if 'F7' in c.upper() or 'f7' in c.lower()]
print(f"\nF7 columns in Excel ({len(f7_cols_excel)}):")
for col in f7_cols_excel[:30]:
    print(f"  - {col}")

# Search for expense/run out related columns
expense_cols = [c for c in df_excel.columns if 'running' in c.lower() or 'run out' in c.lower() or 'expense' in c.lower() or 'money' in c.lower()]
print(f"\nExpense/money-related columns in Excel ({len(expense_cols)}):")
for col in expense_cols[:20]:
    print(f"  - {col}")

print("\n" + "=" * 60)
print("CHECKING CSV FILE")
print("=" * 60)
df_csv = pd.read_csv('dataset/A2F_2023_complete.csv', low_memory=False)
df_csv.columns = df_csv.columns.str.strip()

# Search for F7 related columns
f7_cols_csv = [c for c in df_csv.columns if 'F7' in c.upper() or 'f7' in c.lower()]
print(f"\nF7 columns in CSV ({len(f7_cols_csv)}):")
for col in f7_cols_csv[:30]:
    print(f"  - {col}")

# Search for expense/run out related columns
expense_cols_csv = [c for c in df_csv.columns if 'running' in c.lower() or 'run out' in c.lower() or 'expense' in c.lower()]
print(f"\nExpense-related columns in CSV ({len(expense_cols_csv)}):")
for col in expense_cols_csv[:20]:
    print(f"  - {col}")
