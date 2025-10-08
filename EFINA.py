# efina_pipeline_excel.py
"""
EFInA Formal Inclusion — End-to-End Pipeline (Excel, robust + aligned)
- Uses your exact headers (see YESNO_COLS / CAT_COLS_DECLARED / INCOME_COL).
- Maps Yes/No columns to 0/1 before building the preprocessor.
- Treats only true numeric columns as numeric (median imputation).
- Robust Income_Level ordinal encoding.
- Gets output feature names from the *fitted* preprocessor inside each pipeline.
- Aligns names/importances to avoid shape errors.
- Trains Logistic Regression, Random Forest, Gradient Boosting with EFInA sampling weights.
- Exports Top-10 per model + Consensus Top-10, metrics, and artifacts.

Run:
    python efina_pipeline_excel.py
"""

import warnings
warnings.filterwarnings("ignore")

import json
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, classification_report, confusion_matrix,
                             f1_score, precision_score, recall_score, roc_auc_score)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

# =========================
# Config — EDIT THESE
# =========================
EXCEL_PATH = Path(r"dataset\AF2023_Efina.xlsx")  # <— change this
SHEET_NAME = 0  # first sheet (or a string like "Data")

RESP_ID_COL = "respondent_serial"
WEIGHT_COL  = "weighting_variable"
TARGET_COL  = "Formally_Included"   # numeric 1/0 per your description

REPORT_DIR = Path("./reports_excel")
ARTIFACTS_DIR = Path("./model_artifacts_excel")
REPORT_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

RANDOM_SEED = 42

# =========================
# Your exact columns
# =========================
# Categorical (small domain)
CAT_COLS_DECLARED = [
    "Education",
    "Gender",
    "Age_Group",
    "Sector",
]

# Income (ordinal)
INCOME_COL = "Income_Level"
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
    "Don't know",  # normalized form
]

# Yes/No columns (must be mapped to 0/1)
YESNO_COLS = [
    "Salary_from_Government_including_NYSC",
    "Salary_Wages_From_A_Business_Company",
    "Salary_Wages_From_An_Individual_With_Own_Business",
    "Salary_Wages_From_An_Individual_For_Chores",
    "Subsistence_Small_scale_farming",
    "Commercial_Large_scale_farming",
    "Own_Business_Trader_Non_farming",
    "Own_Business_Trader_Farming_Produce_Livestock",
    "Own_Business_Trader_Agricultural_Inputs",
    "Own_Business_Provide_service",
    "Rent",
    "Pension",
    "Government_Grant",
    "Drought_Relief",
    "Interest_On_Savings",
    "Return_On_Investments",
    "Get_Money_From_Family_Friends_Students",
    "Get_Money_From_Family_Friends_Unemployed_NonStudents",
    "Get_Money_From_Family_Friends_Retired",
    "Financial_Service_Agent_Near_Home",
    "ATM_Near_Home",
    "Microfinance_Bank_Near_Home",
    "Non_Interest_Service_Provider_Near_Home",
    "Primary_Mortgage_Bank_Near_Home",
    "Mobile_Phone",
    "Reliable_Phone_Network",
    "Bank_Account",
    "NIN",
    "BVN",
]

# Engineered feature groups
EDUCATION_ORDER = {
    "No formal education": 0,
    "Primary": 1,
    "Secondary": 2,
    "Tertiary": 3,
    "Vocational": 2,
    "Islamic": 1,
    "Adult education": 1,
}

ACCESS_INFRA_COLS = [
    "Financial_Service_Agent_Near_Home",
    "ATM_Near_Home",
    "Microfinance_Bank_Near_Home",
    "Non_Interest_Service_Provider_Near_Home",
    "Primary_Mortgage_Bank_Near_Home",
]

FORMAL_ID_COLS = [
    "NIN",
    "BVN",
]

MOBILE_ACCESS_COLS = [
    "Mobile_Phone",
    "Reliable_Phone_Network",
]

INCOME_STREAM_COLS = [
    "Salary_from_Government_including_NYSC",
    "Salary_Wages_From_A_Business_Company",
    "Salary_Wages_From_An_Individual_With_Own_Business",
    "Salary_Wages_From_An_Individual_For_Chores",
    "Subsistence_Small_scale_farming",
    "Commercial_Large_scale_farming",
    "Own_Business_Trader_Non_farming",
    "Own_Business_Trader_Farming_Produce_Livestock",
    "Own_Business_Trader_Agricultural_Inputs",
    "Own_Business_Provide_service",
    "Rent",
    "Pension",
    "Government_Grant",
    "Drought_Relief",
    "Interest_On_Savings",
    "Return_On_Investments",
    "Get_Money_From_Family_Friends_Students",
    "Get_Money_From_Family_Friends_Unemployed_NonStudents",
    "Get_Money_From_Family_Friends_Retired",
]

DOMAIN_WEIGHTS = {
    "Education_Ordinal": 1.7,
    "Education_Tertiary": 1.5,
    "Income_Level": 1.3,
    "Income_Stream_Count": 1.3,
    "Access_Channel_Share": 1.4,
    "Formal_ID_Count": 1.3,
    "Mobile_Access_Score": 1.2,
    "Bank_Account": 1.2,
    "Financial_Service_Agent_Near_Home": 1.4,
    "ATM_Near_Home": 1.2,
    "Microfinance_Bank_Near_Home": 1.2,
    "NIN": 1.4,
    "BVN": 1.4,
}

# =========================
# Helpers
# =========================
def load_excel(path: Path, sheet_name=0) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Excel file not found at: {path}")
    df = pd.read_excel(path, sheet_name=sheet_name)
    if isinstance(df, dict):  # rare guard
        df = df[list(df.keys())[0]]
    df.columns = [str(c).strip() for c in df.columns]
    return df

def normalize_yes_no(series: pd.Series) -> pd.Series:
    """
    Map Yes/No-like values to 1/0. Leaves NaN as NaN.
    Accepts many forms: Yes/No, Y/N, 1/0, True/False, etc.
    """
    if pd.api.types.is_numeric_dtype(series):
        return pd.to_numeric(series, errors="coerce")
    s = series.astype(str).str.strip().str.lower()
    mapping = {
        "yes": 1, "y": 1, "1": 1, "true": 1, "t": 1,
        "no": 0,  "n": 0, "0": 0, "false": 0, "f": 0,
        "nan": np.nan, "": np.nan, "none": np.nan,
    }
    return s.map(mapping)

def ordinal_encode_income(series: pd.Series) -> pd.Series:
    """
    Encode Income_Level as ordered numeric 0..K-1.
    Robust to variants of "Don't/Don’t know", capitalization, stray spaces.
    """
    s = series.astype(str).str.strip()
    # normalize curly apostrophes and variants
    s = s.str.replace("\u2019", "'", regex=False)  # ’ -> '
    s = s.str.replace("Don’t", "Don't", regex=False)
    s = s.str.replace("don’t", "don't", regex=False)
    s = s.str.replace("Don’t know", "Don't know", regex=False)
    s = s.str.replace("Don’t Know", "Don't know", regex=False)
    s = s.str.replace("Don’t know", "Don't know", regex=False)
    # map case-insensitively
    allowed = {k.lower(): i for i, k in enumerate(INCOME_ORDER)}
    out = s.str.lower().map(allowed)
    return out.astype("float")  # keep NaN

def preprocess_dataframe(df: pd.DataFrame):
    # Basic cleanup
    df = df.replace({"": np.nan, " ": np.nan})

    # Required columns
    for col in [RESP_ID_COL, WEIGHT_COL, TARGET_COL]:
        if col not in df.columns:
            raise KeyError(f"Missing required column: '{col}'")

    # Map ALL declared Yes/No columns to 0/1
    for col in YESNO_COLS:
        if col in df.columns:
            df[col] = normalize_yes_no(df[col])
        else:
            df[col] = np.nan  # create if missing

    # Declared categoricals
    for col in CAT_COLS_DECLARED:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip().replace({"nan": np.nan})
        else:
            df[col] = np.nan

    # Income ordinal
    if INCOME_COL in df.columns:
        df[INCOME_COL] = ordinal_encode_income(df[INCOME_COL])
    else:
        df[INCOME_COL] = np.nan

    # Engineered macro features (domain driven)
    education_clean = df["Education"].astype(str).str.strip().str.title()
    df["Education_Tertiary"] = education_clean.str.contains("Tertiary", na=False).astype(float)
    df["Education_Ordinal"] = education_clean.map(EDUCATION_ORDER).astype(float)

    access_df = df[[c for c in ACCESS_INFRA_COLS if c in df.columns]].astype(float)
    df["Access_Channel_Share"] = access_df.fillna(0).mean(axis=1)

    id_df = df[[c for c in FORMAL_ID_COLS if c in df.columns]].astype(float)
    df["Formal_ID_Count"] = id_df.fillna(0).sum(axis=1)

    mobile_df = df[[c for c in MOBILE_ACCESS_COLS if c in df.columns]].astype(float)
    df["Mobile_Access_Score"] = mobile_df.fillna(0).mean(axis=1)

    income_stream_df = df[[c for c in INCOME_STREAM_COLS if c in df.columns]].astype(float)
    df["Income_Stream_Count"] = income_stream_df.fillna(0).sum(axis=1)

    # Target (should already be 0/1)
    y = pd.to_numeric(df[TARGET_COL], errors="coerce").astype("float")

    # Weights (normalize mean=1)
    w = pd.to_numeric(df[WEIGHT_COL], errors="coerce").fillna(1.0)
    w = w / w.mean()

    # Build feature matrix — drop id/weight/target
    X = df.drop(columns=[c for c in [RESP_ID_COL, WEIGHT_COL, TARGET_COL] if c in df.columns])

    # =========================
    # Dynamic column typing
    # =========================
    # After mapping yes/no and income, re-detect types:
    #  - Binary columns (0/1) -> numeric
    #  - Declared categoricals -> categorical
    #  - Any remaining object dtype -> categorical (to avoid median on strings)
    #  - Only true numeric dtypes go to numeric pipeline
    binary_cols = [c for c in X.columns if c in YESNO_COLS]
    cat_cols    = [c for c in CAT_COLS_DECLARED if c in X.columns]
    leftover_objects = [c for c in X.select_dtypes(include=["object"]).columns if c not in cat_cols]
    cat_cols += leftover_objects
    numeric_dtypes = list(X.select_dtypes(include=["number"]).columns)
    num_cols = [c for c in numeric_dtypes if c not in set(binary_cols + [INCOME_COL])]

    engineered_cols = [
        "Education_Tertiary",
        "Education_Ordinal",
        "Access_Channel_Share",
        "Formal_ID_Count",
        "Mobile_Access_Score",
        "Income_Stream_Count",
    ]
    for col in engineered_cols:
        if col in X.columns and col not in num_cols and col not in binary_cols:
            num_cols.append(col)

    # Reorder X (optional)
    ordered_cols = binary_cols + cat_cols + ([INCOME_COL] if INCOME_COL in X.columns else []) + num_cols
    X = X[ordered_cols]

    return X, y, w, binary_cols, cat_cols, [INCOME_COL] if INCOME_COL in X.columns else [], num_cols

def build_preprocessor(binary_cols: List[str], cat_cols: List[str], income_cols: List[str], num_cols: List[str]) -> ColumnTransformer:
    bin_pipe = Pipeline([("imputer", SimpleImputer(strategy="most_frequent"))])
    cat_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    num_pipe = Pipeline([("imputer", SimpleImputer(strategy="median"))])

    transformers = []
    if binary_cols:
        transformers.append(("bin", bin_pipe, binary_cols))
    if cat_cols:
        transformers.append(("cat", cat_pipe, cat_cols))
    if income_cols:
        transformers.append(("inc", num_pipe, income_cols))
    if num_cols:
        transformers.append(("num", num_pipe, num_cols))

    pre = ColumnTransformer(transformers=transformers, remainder="drop")
    return pre

def evaluate_and_report(name: str, y_true, y_prob, y_pred, weights, label: str) -> Dict:
    try:
        auc = roc_auc_score(y_true, y_prob, sample_weight=weights)
    except Exception:
        auc = float("nan")
    acc = accuracy_score(y_true, y_pred, sample_weight=weights)
    f1  = f1_score(y_true, y_pred, sample_weight=weights)
    prec = precision_score(y_true, y_pred, sample_weight=weights)
    rec  = recall_score(y_true, y_pred, sample_weight=weights)
    cm = confusion_matrix(y_true, y_pred, sample_weight=weights)
    report = classification_report(y_true, y_pred, sample_weight=weights, digits=3)
    return {
        "label": label,
        "model": name,
        "auc": auc,
        "accuracy": acc,
        "f1": f1,
        "precision": prec,
        "recall": rec,
        "confusion_matrix": cm.tolist(),
        "report": report
    }

def get_feature_names(pre: ColumnTransformer) -> list:
    """
    Build output feature names from a *fitted* ColumnTransformer `pre`.
    - For 'bin', 'inc', 'num' use the original column lists.
    - For 'cat' expand via the fitted OneHotEncoder.
    """
    assert hasattr(pre, "transformers_"), "ColumnTransformer must be fitted before calling get_feature_names."

    name_to_cols = {name: cols for (name, _, cols) in pre.transformers_ if cols is not None}
    out = []

    if "bin" in name_to_cols:
        out.extend(list(name_to_cols["bin"]))

    if "cat" in name_to_cols:
        cat_cols = list(name_to_cols["cat"])
        cat_tr = pre.named_transformers_["cat"]
        ohe = cat_tr.named_steps.get("onehot", None) if hasattr(cat_tr, "named_steps") else None
        if ohe is not None:
            out.extend(ohe.get_feature_names_out(cat_cols).tolist())
        else:
            out.extend(cat_cols)

    if "inc" in name_to_cols:
        out.extend(list(name_to_cols["inc"]))

    if "num" in name_to_cols:
        out.extend(list(name_to_cols["num"]))

    return out

# =========================
# Main
# =========================
def main():
    np.random.seed(RANDOM_SEED)

    # Load
    df = load_excel(EXCEL_PATH, sheet_name=SHEET_NAME)

    # Preprocess (robust typing)
    X, y_float, w, bin_cols, cat_cols, income_cols, num_cols = preprocess_dataframe(df)

    # Drop rows with missing target
    mask = ~y_float.isna()
    X = X.loc[mask].copy()
    y = y_float.loc[mask].astype(int).values
    w = w.loc[mask].values

    # Split
    X_tr, X_te, y_tr, y_te, w_tr, w_te = train_test_split(
        X, y, w, test_size=0.2, stratify=y, random_state=RANDOM_SEED
    )

    # Preprocessor from detected columns
    pre = build_preprocessor(bin_cols, cat_cols, income_cols, num_cols)

    # Baseline (weighted prevalence)
    baseline_rate = float(np.average(y_tr, weights=w_tr))
    y_te_baseline_pred = np.full_like(y_te, 1 if baseline_rate >= 0.5 else 0)
    y_te_baseline_prob = np.full_like(y_te, baseline_rate, dtype=float)
    baseline_metrics = evaluate_and_report(
        "Weighted Prevalence Baseline", y_te, y_te_baseline_prob, y_te_baseline_pred, w_te, "test"
    )

    # Models
    models = {
        "LogisticRegression": Pipeline([
            ("pre", pre),
            ("clf", LogisticRegression(max_iter=2000, class_weight="balanced", solver="liblinear"))
        ]),
        "RandomForest": Pipeline([
            ("pre", pre),
            ("clf", RandomForestClassifier(
                n_estimators=600, max_depth=None, min_samples_split=4, min_samples_leaf=1,
                random_state=RANDOM_SEED, n_jobs=-1
            ))
        ]),
        "GradientBoosting": Pipeline([
            ("pre", pre),
            ("clf", GradientBoostingClassifier(random_state=RANDOM_SEED))
        ])
    }

    results = []
    importances = {}
    feature_names = None

    # Train/Evaluate per model
    for name, pipe in models.items():
        pipe.fit(X_tr, y_tr, clf__sample_weight=w_tr)

        # predictions
        y_prob = pipe.predict_proba(X_te)[:, 1]
        y_pred = (y_prob >= 0.5).astype(int)

        # metrics
        res = evaluate_and_report(name, y_te, y_prob, y_pred, w_te, "test")
        results.append(res)

        # feature names from the *fitted* preprocessor inside this pipeline
        pre_fitted = pipe.named_steps["pre"]
        feature_names = get_feature_names(pre_fitted)
        n_features = len(feature_names)

        # model importances
        clf = pipe.named_steps["clf"]
        if hasattr(clf, "feature_importances_"):
            importances_arr = clf.feature_importances_
        elif hasattr(clf, "coef_"):
            importances_arr = np.abs(np.ravel(clf.coef_))
        else:
            importances_arr = np.zeros(n_features, dtype=float)

        # align lengths (safe-guard)
        m = min(n_features, len(importances_arr))
        feature_names = feature_names[:m]
        importances_arr = importances_arr[:m]

        # normalize + save
        if importances_arr.sum() > 0:
            importances_arr = importances_arr / importances_arr.sum()
        fi = pd.DataFrame({"feature": feature_names, "importance": importances_arr})
        fi["domain_weight"] = fi["feature"].map(DOMAIN_WEIGHTS).fillna(1.0)
        fi["adjusted_importance"] = fi["importance"] * fi["domain_weight"]
        fi = fi.sort_values("adjusted_importance", ascending=False)
        importances[name] = fi
        fi.head(10)[["feature", "importance", "adjusted_importance", "domain_weight"]] \
            .to_csv(REPORT_DIR / f"top10_{name}.csv", index=False)

    # Consensus Top-10
    merged = None
    for name, fi in importances.items():
        tmp = fi[["feature", "adjusted_importance"]] \
            .rename(columns={"adjusted_importance": f"importance_{name}"})
        merged = tmp if merged is None else merged.merge(tmp, on="feature", how="outer")
    for name in models.keys():
        col = f"importance_{name}"
        if col not in merged.columns:
            merged[col] = 0.0
    merged["consensus_importance"] = merged[[f"importance_{m}" for m in models]].mean(axis=1)
    consensus_top10 = merged.sort_values("consensus_importance", ascending=False).head(10)
    consensus_top10.to_csv(REPORT_DIR / "top10_consensus.csv", index=False)

    # Metrics table
    metrics_df = pd.DataFrame(results + [baseline_metrics])
    metrics_df.to_csv(REPORT_DIR / "model_metrics.csv", index=False)

    # Best model by AUC then F1
    metrics_sorted = metrics_df.sort_values(["auc", "f1"], ascending=[False, False])
    best_name = metrics_sorted.iloc[0]["model"]
    best_pipe = models[best_name]

    # Save artifacts
    joblib.dump(best_pipe, ARTIFACTS_DIR / "best_model.joblib")
    joblib.dump(pre, ARTIFACTS_DIR / "preprocessor.joblib")
    with open(ARTIFACTS_DIR / "feature_names.json", "w", encoding="utf-8") as f:
        json.dump(get_feature_names(pre), f, ensure_ascii=False, indent=2)

    # Summary & bundle
    weighted_rate_full = float(np.average(y, weights=w))
    summary = {
        "weighted_formal_inclusion_rate": weighted_rate_full,
        "published_formal_inclusion_percent_reference": 0.64,
        "best_model": best_name,
        "reports_dir": str(REPORT_DIR.resolve()),
        "artifacts_dir": str(ARTIFACTS_DIR.resolve())
    }
    with open(REPORT_DIR / "summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    with pd.ExcelWriter(REPORT_DIR / "efina_outputs.xlsx", engine="xlsxwriter") as writer:
        metrics_df.to_excel(writer, sheet_name="metrics", index=False)
        consensus_top10.to_excel(writer, sheet_name="top10_consensus", index=False)
        for name, fi in importances.items():
            fi.head(10).to_excel(writer, sheet_name=f"top10_{name}", index=False)

    print("\n==== SUMMARY ====")
    print(json.dumps(summary, indent=2))
    print("\nSaved:")
    print(f" - Reports:        {REPORT_DIR}")
    print(f" - Excel bundle:   {REPORT_DIR / 'efina_outputs.xlsx'}")
    print(f" - Best model:     {ARTIFACTS_DIR / 'best_model.joblib'}")
    print(f" - Preprocessor:   {ARTIFACTS_DIR / 'preprocessor.joblib'}")
    print(f" - Feature names:  {ARTIFACTS_DIR / 'feature_names.json'}")

if __name__ == "__main__":
    main()
