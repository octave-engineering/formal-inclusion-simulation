
# EFInA Formal Financial Inclusion Analysis Results

## Quick Links

### Executive Documents
- [Executive Summary](EXECUTIVE_SUMMARY.md) - 2-page overview with key findings and recommendations
- [Technical Report](TECHNICAL_REPORT.md) - Full methodology and results
- [Driver Explanations](driver_explanations.md) - Detailed mechanisms for each driver

### Data Files
- [Top 20 Variables](top_20_variables.csv) - Ranked drivers with all metrics
- [Consolidated Rankings](consolidated_variable_rankings.csv) - Full ranking table
- [Yearly Trends](yearly_inclusion_trends.csv) - Year-over-year progression
- [Regional Trends](regional_yearly_trends.csv) - Regional breakdowns
- [Driver Changes Over Time](driver_changes_over_time.csv) - How drivers evolved

### Model Outputs
- [Logistic Regression Coefficients](logistic_regression_coefficients.csv)
- [Random Forest Importance](random_forest_importance.csv)
- [SHAP Importance](shap_importance.csv)
- [LASSO Variable Selection](lasso_variable_selection.csv)
- [VIF Multicollinearity Check](vif_multicollinearity.csv)

### Visualizations (in figures/)
- Correlation heatmap
- Time series plots (overall, regional, urban/rural)
- SHAP summary plots
- Waterfall contribution chart
- Regional heatmap

### Metadata
- [Access to Financial Agents Definition](access_agents_definition.txt)
- [Variable Search Results](variable_search_results.json)
- [All Columns Metadata](all_columns_metadata.csv)

## Summary Statistics

**Dataset:**
- 85,341 respondents
- 3 years (2018, 2020, 2023)
- 32 variables analyzed

**Key Finding:**
Formal financial inclusion increased from 45.2% (2018) to 61.2% (2023).

**#1 Driver:**
Access to Financial Agents (coefficient: 19.78, SHAP: 3.60)

**Top 5 Drivers:**
1. Access to Financial Agents
2. Transactional Account Ownership
3. Wealth Level
4. Education Level
5. Year 2023 Effect

---

Generated: 2025-10-02 00:26:50