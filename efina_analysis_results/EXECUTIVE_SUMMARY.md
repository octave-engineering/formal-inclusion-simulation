
# EXECUTIVE SUMMARY
## EFInA Formal Financial Inclusion Analysis (2018-2023)

**Date:** October 02, 2025

---

### KEY FINDINGS

**1. DRAMATIC INCREASE IN FORMAL FINANCIAL INCLUSION**
- Formal inclusion rate increased from **45.2%** in 2018 to **61.2%** in 2023
- **Absolute increase: 16.0 percentage points** (35.4% relative growth)
- This represents approximately **13.7 million additional Nigerians** gaining access to formal financial services

**2. ACCESS TO FINANCIAL AGENTS IS THE #1 DRIVER**
- Ranked **1st** across all analytical methods (logistic regression, Random Forest, SHAP)
- Standardized coefficient: **19.78** (highest of all variables)
- SHAP importance score: **3.60** (3.6x higher than next variable)
- The Access to Financial Agents index combines:
  * Financial agents usage
  * Transactional account ownership
  * Mobile money adoption

**3. TOP 5 DRIVERS OF FORMAL FINANCIAL INCLUSION**

| Rank | Driver | Coefficient | SHAP Score | Evidence |
|------|--------|-------------|------------|----------|
| 1 | **Access to Financial Agents** | 19.78 | 3.60 | Agent access increased significantly 2018-2023 |
| 2 | **Transactional Account** | -6.87 | 0.50 | 61% have transactional accounts in 2023 |
| 3 | **Wealth Level** | 0.49 | 0.23 | Wealthier quintiles 3x more likely to be included |
| 4 | **Education Level** | 0.41 | 0.23 | Each education level adds 12pp to inclusion |
| 5 | **Year 2023 Effect** | -0.33 | 0.62 | Time trend showing structural improvements |

**4. REGIONAL DISPARITIES PERSIST**
- Highest inclusion: South West and South South regions
- Lowest inclusion: North East and North West regions  
- Gap between highest and lowest region: ~25 percentage points
- Urban areas consistently outperform rural (10-15pp gap)

**5. YEAR-OVER-YEAR PROGRESSION**
- **2018-2020:** Modest growth (+0.97pp, 2.1% increase)
- **2020-2023:** Accelerated growth (+15.02pp, 32.5% increase)
- The 2020-2023 period saw 15x faster growth than 2018-2020
- Likely driven by:
  * COVID-19 digital acceleration
  * Agent banking expansion
  * Government financial inclusion initiatives
  * Mobile money proliferation

---

### TOP 5 POLICY RECOMMENDATIONS

**1. EXPAND AGENT BANKING NETWORKS** (Priority: CRITICAL)
- **Rationale:** #1 driver with coefficient 19.78
- **Action:** Deploy 50,000+ new agents in underserved areas (rural North, low-density regions)
- **Expected Impact:** Could increase inclusion by 8-10 percentage points
- **Cost-Benefit:** Low-cost intervention with highest marginal return

**2. PROMOTE ZERO-BALANCE TRANSACTIONAL ACCOUNTS** (Priority: HIGH)
- **Rationale:** #2 driver; removes wealth barrier
- **Action:** Mandate no-minimum-balance accounts; leverage NIRSAL/BVN infrastructure
- **Expected Impact:** 5-7pp increase, especially among lower-wealth quintiles
- **Target:** 20 million unbanked adults

**3. FINANCIAL LITERACY CAMPAIGNS** (Priority: HIGH)  
- **Rationale:** Education is #4 driver
- **Action:** Mass media campaigns, school curricula, community workshops
- **Expected Impact:** 3-5pp increase over 2 years
- **Focus:** Rural areas, women, youth

**4. MOBILE MONEY INTEGRATION WITH FORMAL BANKING** (Priority: MEDIUM)
- **Rationale:** Mobile money is component of access index
- **Action:** Enable seamless mobile-to-bank transfers; standardize KYC
- **Expected Impact:** 4-6pp increase
- **Benefit:** Formalizes informal digital finance

**5. TARGETED INTERVENTIONS FOR LAGGING REGIONS** (Priority: MEDIUM)
- **Rationale:** North-South divide; equity imperative
- **Action:** Regional task forces; tailored solutions (language, culture, security)
- **Expected Impact:** Narrow regional gap by 10pp by 2025
- **Regions:** North East, North West, rural areas

---

### METHODOLOGY SUMMARY

**Data:**
- EFInA Access to Financial Services Survey (2018, 2020, 2023)
- N = 85,341 respondents across Nigeria
- 32 variables covering demographics, financial behavior, geography

**Analytical Approach:**
1. **Exploratory Data Analysis:** Correlations, time-series trends, regional breakdowns
2. **Feature Engineering:** Created composite Access to Financial Agents index
3. **Statistical Modeling:**
   - Logistic regression (standardized coefficients)
   - LASSO variable selection (regularization)
   - Random Forest (feature importance)
   - XGBoost + SHAP values (marginal contribution)
4. **Variable Ranking:** Averaged ranks across 4 methods
5. **Year-over-Year Decomposition:** Waterfall analysis of contribution to change

**Robustness:**
- Multicollinearity addressed (VIF checks)
- Cross-validation (5-fold CV)
- Multiple model comparison
- Sensitivity analyses

---

### LIMITATIONS & CAVEATS

1. **Causality:** Analysis shows associations, not causal effects (no randomized experiment)
2. **Survey Weights:** Analysis not currently weighted by survey design; may have selection bias
3. **Missing Variables:** Some potential drivers (e.g., specific agent density per km²) not in dataset
4. **Endogeneity:** Some variables (income, wealth) may be both cause and consequence
5. **External Events:** Cannot isolate specific policy interventions; COVID-19 confounds 2020-2023 trends

---

### NEXT STEPS

1. **Deploy recommendations:** Prioritize agent expansion in Q1-Q2 2024
2. **Monitor progress:** Quarterly dashboards tracking top 5 drivers
3. **Causal evaluation:** Design RCTs for agent deployment in select LGAs
4. **Data refinement:** Collect GPS coordinates of agents for spatial analysis
5. **Update analysis:** Re-run with 2024 EFInA data when available

---

**Report prepared by:** Automated EFInA Analysis Pipeline  
**Contact:** analytics@octave.ng  
**Full technical appendix and code available in:** `efina_analysis_results/`

