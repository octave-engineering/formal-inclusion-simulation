import pandas as pd

# Load the dataset
df = pd.read_csv('dataset/A2F_2023_complete.csv', encoding='latin-1', nrows=0)

print(f'Total columns: {len(df.columns)}')
print('\nAll column names:')
for i, col in enumerate(df.columns, 1):
    print(f'{i}. {col}')
