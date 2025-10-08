# EFInA Formal Financial Inclusion Simulator

An interactive Power BI-style dashboard for simulating formal financial inclusion probabilities based on 15 key drivers.

## Features

- **Single-page, non-scrollable layout** - Optimized for full-screen viewing
- **Real-time predictions** - Instant probability updates as you adjust inputs
- **Power BI styling** - Professional Microsoft Power BI-inspired design
- **15 Key Drivers** - All validated features from the clean model
- **Interactive visualizations** - Feature contribution charts and comparisons
- **Model-backed predictions** - Uses actual Logistic Regression coefficients

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Navigate to the dashboard directory:**
   ```bash
   cd dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   The app will automatically open at `http://localhost:3000`

### Build for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

To preview the production build:

```bash
npm run preview
```

## Dashboard Sections

### 1. Main KPI Card
- **Predicted Inclusion Probability** - Large display with color coding
- **Progress bar** - Visual representation of probability
- **Baseline comparison** - Shows impact vs. baseline rate

### 2. Demographics
- Education Level (0-3 scale)
- Age 18+
- Male Gender
- Urban Sector

### 3. Financial Infrastructure
- Formal ID Count (NIN/BVN: 0-2)
- Financial Access Index (0-100%)
- Access Diversity Score (0-5 channels)
- Has Bank Account

### 4. Income & Employment
- Income Level (0-19 scale)
- Income Diversity Score (0-10)
- Formal Employment
- Business Income
- Agricultural Income
- Passive Income

### 5. Digital Access
- Mobile Digital Readiness (phone + reliable network)

### 6. Visualizations
- **Top 10 Feature Contributions** - Horizontal bar chart showing current scenario impact
- **Scenario Comparison** - Current vs. baseline metrics
- **Model Performance Stats** - AUC and accuracy display

## How to Use

1. **Dashboard loads with EFInA 2023 survey averages** - Defaults produce ~64% baseline
2. **Adjust inputs** using sliders and toggles to simulate different scenarios
3. **Watch real-time updates** to the predicted inclusion probability
4. **Compare scenarios** using the comparison card
5. **Analyze drivers** via the feature contribution chart
6. **Reset to survey averages** using the top-right button

## Survey-Calibrated Defaults

The dashboard starts with realistic values from EFInA 2023 survey:

- **Education:** 0.7 (between primary and secondary)
- **Income Level:** 6 (N55,001 - N75,000 range)
- **Formal ID Count:** 1.2 (average of NIN/BVN ownership)
- **Bank Account:** Yes (55% national rate)
- **Mobile Digital Readiness:** Yes (60% have phone + network)
- **Urban Sector:** Yes (55% urban population)
- **Age 18+:** Yes (95% of survey respondents)
- **Gender:** Female (54% of respondents)
- **Financial Access Index:** 14% (low physical access)
- **Access Diversity:** 0.7 channels on average
- **Income Sources:** Mostly informal (low formal employment)

These defaults, when combined, produce the **64% baseline formal inclusion rate** observed in the survey.

## Model Details

- **Algorithm:** Logistic Regression
- **Features:** 15 clean, non-redundant drivers
- **Performance:** 86.7% AUC, 79.8% Accuracy
- **Baseline Rate:** 64% (EFInA survey)

## Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Lucide React** - Icon library

## Color Scheme (Power BI)

- Primary Blue: `#0078d4`
- Success Green: `#107c10`
- Warning Orange: `#ff8c00`
- Danger Red: `#d13438`
- Background: `#f3f2f1`
- Card White: `#ffffff`

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Modern browsers with ES6+ support
