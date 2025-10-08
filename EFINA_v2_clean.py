"""
EFInA Formal Inclusion Pipeline v2 - Clean Feature Engineering
- Stops one-hot encoding binary columns (keeps as 0/1)
- Creates domain-driven composite features
- Reduces 75 noisy features to ~20 meaningful drivers
"""

import warnings
warnings.filterwarnings("ignore")

import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, classification_report, confusion_matrix,
                             f1_score, precision_score, recall_score, roc_auc_score)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Config
EXCEL_PATH = Path(r"dataset\AF2023_Efina.xlsx")
SHEET_NAME = 0
RESP_ID_COL = "respondent_serial"
WEIGHT_COL  = "weighting_variable"
TARGET_COL  = "Formally_Included"
REPORT_DIR = Path("./reports_excel_v2")
ARTIFACTS_DIR = Path("./model_artifacts_excel_v2")
REPORT_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
RANDOM_SEED = 42

# Income sources for aggregation
FORMAL_EMPLOYMENT_COLS = [
    "Salary_from_Government_including_NYSC",
    "Salary_Wages_From_A_Business_Company",
]

INFORMAL_EMPLOYMENT_COLS = [
    "Salary_Wages_From_An_Individual_With_Own_Business",
    "Salary_Wages_From_An_Individual_For_Chores",
]

AGRICULTURAL_COLS = [
    "Subsistence_Small scale farming",
    "Commercial_Large_scale_farming",
    "Own_Business_Trader_Farming_Produce_Livestock",
    "Own_Business_Trader_Agricultural_Inputs",
]

BUSINESS_COLS = [
    "Own_Business_Trader_Non-farming",
    "Own_Business _Provide_service",
]

PASSIVE_INCOME_COLS = [
    "Rent",
    "Pension",
    "Interest_On_Savings",
    "Return_On_Investments",
]

TRANSFERS_COLS = [
    "Government_Grant",
    "Drought_Relief",
    "Get_Money_From_Family_Friends (Students)",
    "Get_Money_From_Family_Friends(unemployed,\nnon -students)",
    "E9_19_Get_Money_From_Family_Friends(retired)",
]

FINANCIAL_ACCESS_COLS = [
    "Is there a financial service agent close to where you live (home)? -",
    "Is there an atm close to where you live (home)?",
    "Is there a microfinance close to where you live (home)",
    "Is there a non interest service provider close to where you live?",
    "Is there a primary mortgage bank close to where you live",
]

MOBILE_ACCESS_COLS = [
    "Mobile Phone",
    "Reliable phone network?",
]

FORMAL_ID_COLS = [
    "NIN",
    "BVN",
]

ALL_INCOME_COLS = (FORMAL_EMPLOYMENT_COLS + INFORMAL_EMPLOYMENT_COLS + 
                   AGRICULTURAL_COLS + BUSINESS_COLS + PASSIVE_INCOME_COLS + TRANSFERS_COLS)

EDUCATION_ORDER = {
    "before secondary school": 0,
    "no formal education": 0,
    "secondary school and above": 1,
    "tertiary": 2,
}

INCOME_ORDER = [
    "No income",
    "Below N15,000 per month",
    "N15,001 – N35,000 per month",
    "N35,001 – N55,000 per month",
    "N55,001 – N75,000 per month",
    "N75,001 – N95,000 per month",
    "N95,001 – N115,000 per month",
    "N115,001 – N135,000 per month",
    "N135,001 – N155,000 per month",
    "N155,001 – N175,000 per month",
    "N175,001 – N195,000 per month",
    "N195,001 – N215,000 per month",
    "N215,001 – N235,000 per month",
    "N235,001 – N255,000 per month",
    "N255,001 – N275,000 per month",
    "N275,001 – N295,000 per month",
    "N295,001 – N315,000 per month",
    "Above N315,000 per month",
    "Refused",
    "Don't know",
]

def load_data():
    if not EXCEL_PATH.exists():
        raise FileNotFoundError(f"Excel file not found: {EXCEL_PATH}")
    df = pd.read_excel(EXCEL_PATH, sheet_name=SHEET_NAME)
    df.columns = [str(c).strip() for c in df.columns]
    return df

def normalize_yes_no(series):
    if pd.api.types.is_numeric_dtype(series):
        return pd.to_numeric(series, errors="coerce")
    s = series.astype(str).str.strip().str.lower()
    mapping = {
        "yes": 1, "y": 1, "1": 1, "true": 1,
        "no": 0, "n": 0, "0": 0, "false": 0,
        "nan": np.nan, "": np.nan,
    }
    return s.map(mapping)

def ordinal_encode_income(series):
    s = series.astype(str).str.strip()
    s = s.str.replace("\u2019", "'", regex=False)
    allowed = {k.lower(): i for i, k in enumerate(INCOME_ORDER)}
    return s.str.lower().map(allowed).astype("float")

def engineer_features(df):
    """Create clean composite features"""
    
    # Convert all Yes/No columns to 0/1
    binary_cols_all = (ALL_INCOME_COLS + FINANCIAL_ACCESS_COLS + 
                      MOBILE_ACCESS_COLS + FORMAL_ID_COLS + ["Bank_Account"])
    
    for col in binary_cols_all:
        if col in df.columns:
            df[col] = normalize_yes_no(df[col])
    
    # Ordinal encodings
    df["Education_Ordinal"] = df["Education"].astype(str).str.strip().str.lower().map(EDUCATION_ORDER).astype(float)
    df["Income_Level_Ordinal"] = ordinal_encode_income(df["Income_Level"]) if "Income_Level" in df.columns else np.nan
    df["Gender_Male"] = (df["Gender"].astype(str).str.strip().str.lower() == "male").astype(float)
    df["Age_18_Plus"] = (df["Age_Group"].astype(str).str.strip().str.contains("18", na=False)).astype(float)
    df["Sector_Urban"] = (df["Sector"].astype(str).str.strip().str.lower() == "urban").astype(float)
    
    # Composite features - Income sources
    formal_emp_df = df[[c for c in FORMAL_EMPLOYMENT_COLS if c in df.columns]]
    df["Formal_Employment_Binary"] = (formal_emp_df.fillna(0).sum(axis=1) > 0).astype(float)
    
    agri_df = df[[c for c in AGRICULTURAL_COLS if c in df.columns]]
    df["Agricultural_Income_Binary"] = (agri_df.fillna(0).sum(axis=1) > 0).astype(float)
    
    business_df = df[[c for c in BUSINESS_COLS if c in df.columns]]
    df["Business_Income_Binary"] = (business_df.fillna(0).sum(axis=1) > 0).astype(float)
    
    passive_df = df[[c for c in PASSIVE_INCOME_COLS if c in df.columns]]
    df["Passive_Income_Binary"] = (passive_df.fillna(0).sum(axis=1) > 0).astype(float)
    
    all_income_df = df[[c for c in ALL_INCOME_COLS if c in df.columns]]
    df["Income_Diversity_Score"] = all_income_df.fillna(0).sum(axis=1)
    
    # Financial access index
    access_df = df[[c for c in FINANCIAL_ACCESS_COLS if c in df.columns]]
    df["Financial_Access_Index"] = access_df.fillna(0).mean(axis=1)
    df["Access_Diversity_Score"] = access_df.fillna(0).sum(axis=1)
    
    # Mobile readiness
    mobile_df = df[[c for c in MOBILE_ACCESS_COLS if c in df.columns]]
    df["Mobile_Digital_Readiness"] = (mobile_df.fillna(0).sum(axis=1) == len(MOBILE_ACCESS_COLS)).astype(float)
    
    # Formal ID count
    id_df = df[[c for c in FORMAL_ID_COLS if c in df.columns]]
    df["Formal_ID_Count"] = id_df.fillna(0).sum(axis=1)
    
    # Bank account (keep as-is)
    if "Bank_Account" in df.columns:
        df["Bank_Account"] = df["Bank_Account"].fillna(0)
    
    return df

def create_feature_matrix(df):
    """Select only engineered + core features for modeling"""
    
    feature_cols = [
        # Engineered composites
        "Education_Ordinal",
        "Income_Level_Ordinal",
        "Formal_Employment_Binary",
        "Agricultural_Income_Binary",
        "Business_Income_Binary",
        "Passive_Income_Binary",
        "Income_Diversity_Score",
        "Financial_Access_Index",
        "Access_Diversity_Score",
        "Mobile_Digital_Readiness",
        "Formal_ID_Count",
        "Bank_Account",
        # Demographics
        "Gender_Male",
        "Age_18_Plus",
        "Sector_Urban",
    ]
    
    # Keep only columns that exist
    existing_cols = [c for c in feature_cols if c in df.columns]
    X = df[existing_cols].copy()
    
    # Fill remaining NaNs
    for col in X.columns:
        if X[col].isna().any():
            X[col] = X[col].fillna(X[col].median() if pd.api.types.is_numeric_dtype(X[col]) else 0)
    
    return X, existing_cols

def evaluate_model(name, y_true, y_prob, y_pred, weights):
    try:
        auc = roc_auc_score(y_true, y_prob, sample_weight=weights)
    except:
        auc = np.nan
    return {
        "model": name,
        "auc": auc,
        "accuracy": accuracy_score(y_true, y_pred, sample_weight=weights),
        "f1": f1_score(y_true, y_pred, sample_weight=weights),
        "precision": precision_score(y_true, y_pred, sample_weight=weights),
        "recall": recall_score(y_true, y_pred, sample_weight=weights),
    }

def main():
    np.random.seed(RANDOM_SEED)
    
    print("Loading data...")
    df = load_data()
    print(f"Dataset shape: {df.shape}")
    
    print("\nEngineering features...")
    df = engineer_features(df)
    
    print("\nCreating feature matrix...")
    X, feature_names = create_feature_matrix(df)
    print(f"Final feature count: {len(feature_names)}")
    print(f"Features: {feature_names}")
    
    # Target and weights
    y = pd.to_numeric(df[TARGET_COL], errors="coerce")
    w = pd.to_numeric(df[WEIGHT_COL], errors="coerce").fillna(1.0)
    w = w / w.mean()
    
    # Drop missing target
    mask = ~y.isna()
    X = X.loc[mask]
    y = y.loc[mask].astype(int).values
    w = w.loc[mask].values
    
    # Split
    X_tr, X_te, y_tr, y_te, w_tr, w_te = train_test_split(
        X, y, w, test_size=0.2, stratify=y, random_state=RANDOM_SEED
    )
    
    # Standardize
    scaler = StandardScaler()
    X_tr_scaled = scaler.fit_transform(X_tr)
    X_te_scaled = scaler.transform(X_te)
    
    # Models
    models = {
        "LogisticRegression": LogisticRegression(max_iter=2000, C=1.0, random_state=RANDOM_SEED),
        "RandomForest": RandomForestClassifier(
            n_estimators=300, max_depth=10, min_samples_split=10,
            random_state=RANDOM_SEED, n_jobs=-1
        ),
        "GradientBoosting": GradientBoostingClassifier(
            n_estimators=200, max_depth=5, learning_rate=0.1,
            random_state=RANDOM_SEED
        )
    }
    
    results = []
    importances = {}
    
    print("\nTraining models...")
    for name, model in models.items():
        print(f"  Training {name}...")
        
        # Train
        if name == "LogisticRegression":
            model.fit(X_tr_scaled, y_tr, sample_weight=w_tr)
            y_prob = model.predict_proba(X_te_scaled)[:, 1]
        else:
            model.fit(X_tr, y_tr, sample_weight=w_tr)
            y_prob = model.predict_proba(X_te)[:, 1]
        
        y_pred = (y_prob >= 0.5).astype(int)
        
        # Evaluate
        metrics = evaluate_model(name, y_te, y_prob, y_pred, w_te)
        results.append(metrics)
        
        # Feature importance
        if hasattr(model, "feature_importances_"):
            imp = model.feature_importances_
        elif hasattr(model, "coef_"):
            imp = np.abs(model.coef_[0])
        else:
            imp = np.zeros(len(feature_names))
        
        # Normalize
        if imp.sum() > 0:
            imp = imp / imp.sum()
        
        fi_df = pd.DataFrame({
            "feature": feature_names,
            "importance": imp
        }).sort_values("importance", ascending=False)
        
        importances[name] = fi_df
        try:
            fi_df.head(15).to_csv(REPORT_DIR / f"top15_{name}_v2.csv", index=False)
        except Exception as e:
            print(f"    Warning: Could not save CSV for {name}: {e}")
        print(f"    AUC: {metrics['auc']:.4f}, Accuracy: {metrics['accuracy']:.4f}")
    
    # Consensus
    merged = None
    for name, fi in importances.items():
        tmp = fi.rename(columns={"importance": f"importance_{name}"})
        merged = tmp if merged is None else merged.merge(tmp, on="feature", how="outer")
    
    merged["consensus_importance"] = merged[[f"importance_{m}" for m in models]].mean(axis=1)
    consensus = merged.sort_values("consensus_importance", ascending=False)
    try:
        consensus.to_csv(REPORT_DIR / "top15_consensus_v2.csv", index=False)
    except Exception as e:
        print(f"Warning: Could not save consensus CSV: {e}")
    
    # Save results
    metrics_df = pd.DataFrame(results)
    try:
        metrics_df.to_csv(REPORT_DIR / "model_metrics_v2.csv", index=False)
    except Exception as e:
        print(f"Warning: Could not save metrics CSV: {e}")
    
    with pd.ExcelWriter(REPORT_DIR / "efina_outputs_v2_final.xlsx", engine="xlsxwriter") as writer:
        metrics_df.to_excel(writer, sheet_name="metrics", index=False)
        consensus.head(15).to_excel(writer, sheet_name="top15_consensus", index=False)
        for name, fi in importances.items():
            fi.head(15).to_excel(writer, sheet_name=f"top15_{name}", index=False)
    
    print("\n" + "="*80)
    print("RESULTS")
    print("="*80)
    print(f"\nFeature count: {len(feature_names)} (reduced from 75)")
    print(f"\nTop 10 Drivers (Consensus):")
    for i, row in consensus.head(10).iterrows():
        print(f"  {row['feature']:40s}: {row['consensus_importance']*100:5.2f}%")
    
    print(f"\nModel Performance:")
    for _, row in metrics_df.iterrows():
        print(f"  {row['model']:20s}: AUC={row['auc']:.4f}, Acc={row['accuracy']:.4f}, F1={row['f1']:.4f}")
    
    print(f"\nReports saved to: {REPORT_DIR}")
    print("="*80)

if __name__ == "__main__":
    main()
