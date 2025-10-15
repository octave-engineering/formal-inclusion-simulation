# Dashboard Improvements Implementation Plan

## Based on User Questions (October 13, 2024)

---

## Changes to Implement

### ✅ 1. Add Clarification About Informal Savings Methods

**Location:** `dashboard/src/components/IndividualMode.jsx` - Savings Behavior section header

**Add informational alert/notice:**
```jsx
<div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
  <div className="flex items-start">
    <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-3" />
    <div>
      <p className="text-sm font-medium text-blue-900">About Savings Behavior</p>
      <p className="text-xs text-blue-700 mt-1">
        These variables measure <strong>any savings behavior</strong>, including both formal (bank accounts, mobile money) 
        and informal methods (saving at home, ROSCAs/esusu/ajo/adashi, savings with family/friends, livestock, assets).
        Having a savings habit—even through informal means—indicates financial discipline and readiness for formal financial services.
      </p>
      <p className="text-xs text-blue-600 mt-2">
        <strong>Common informal savings methods in Nigeria:</strong> Esusu, Ajo, Adashi (rotating savings groups), 
        saving cash at home, purchasing assets (gold, livestock), savings with trusted community members.
      </p>
    </div>
  </div>
</div>
```

**Location:** `dashboard/src/components/VariableInfo.jsx` - Update all savings variable descriptions

Add to each savings variable description:
- Clarify that it includes informal savings
- List examples of informal methods
- Explain why informal savings behavior predicts formal inclusion propensity

---

### ✅ 2. Add State Selection Dropdown

**Location:** `dashboard/src/components/IndividualMode.jsx` - Demographics section

**Implementation:**

1. **Add state to inputs (non-model feature, display only):**
```jsx
const [inputs, setInputs] = useState({
  ...SURVEY_DEFAULTS,
  state: 'LAGOS' // Add state selection
});
```

2. **Add state dropdown in Demographics card:**
```jsx
<SelectInput
  label="State"
  value={inputs.state}
  onChange={(val) => setInputs(prev => ({...prev, state: val}))}
  options={NIGERIAN_STATES.map(state => ({ value: state, label: state }))}
  help="Select your state of residence"
/>
```

3. **Define states constant:**
```jsx
const NIGERIAN_STATES = [
  "ABIA", "ADAMAWA", "AKWA-IBOM", "ANAMBRA", "BAUCHI", "BAYELSA", "BENUE", "BORNO",
  "CROSS RIVER", "DELTA", "EBONYI", "EDO", "EKITI", "ENUGU", "FCT ABUJA", "GOMBE",
  "IMO", "JIGAWA", "KADUNA", "KANO", "KATSINA", "KEBBI", "KOGI", "KWARA",
  "LAGOS", "NASARAWA", "NIGER", "OGUN", "ONDO", "OSUN", "OYO", "PLATEAU",
  "RIVERS", "SOKOTO", "TARABA", "YOBE", "ZAMFARA"
];
```

**Note:** State is for display/context only, not used in model prediction (to avoid overfitting with 37 dummy variables).

---

### ✅ 3. Improve Contributing Factors Display

**Location:** `dashboard/src/components/IndividualMode.jsx` - Feature Contributions section

**Current Issues:**
- Numbers are raw contribution values (not percentages)
- Bars are too short
- Units unclear

**Changes:**

1. **Calculate percentage contributions:**
```jsx
const featureContributions = useMemo(() => {
  const contributions = [];
  let totalAbsContribution = 0;
  
  // First pass: calculate raw contributions
  features.forEach(feature => {
    const weight = FEATURE_WEIGHTS[feature.key] || 0;
    const value = inputs[feature.key] || 0;
    const contribution = weight * value;
    
    contributions.push({
      name: feature.name,
      rawContribution: contribution,
      absContribution: Math.abs(contribution)
    });
    
    totalAbsContribution += Math.abs(contribution);
  });
  
  // Second pass: calculate percentages
  contributions.forEach(c => {
    c.percentContribution = (c.absContribution / totalAbsContribution) * 100;
    c.displayValue = c.percentContribution.toFixed(1) + '%';
  });
  
  // Sort by absolute contribution
  return contributions.sort((a, b) => b.absContribution - a.absContribution).slice(0, 8);
}, [inputs]);
```

2. **Update display:**
```jsx
<div className="space-y-3">
  <div className="flex items-center justify-between mb-2">
    <h3 className="text-sm font-semibold text-text-primary">Top Contributing Factors</h3>
    <span className="text-xs text-text-tertiary">% of inclusion score</span>
  </div>
  {featureContributions.map((feature, idx) => (
    <div key={idx} className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <feature.icon className="w-4 h-4" style={{ color: feature.color }} />
          <span className="text-xs font-medium text-text-primary truncate">{feature.name}</span>
        </div>
        <span className="text-xs font-bold text-text-primary ml-2">{feature.displayValue}</span>
      </div>
      <div className="w-full h-2 bg-border-light rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${feature.percentContribution}%`,
            backgroundColor: feature.color
          }}
        />
      </div>
    </div>
  ))}
  <p className="text-xs text-text-tertiary mt-3">
    Values show each factor's percentage contribution to your overall inclusion score.
    Higher percentages indicate stronger influence on your prediction.
  </p>
</div>
```

---

### ✅ 4. Implement Conditional Logic for Savings Variables

**Location:** `dashboard/src/components/IndividualMode.jsx` - Savings Behavior section

**Logic:**
- If `Saves_Money` = 0 (No), disable all other savings variables
- Auto-set disabled variables to 0
- Show tooltip explaining why they're disabled

**Implementation:**

1. **Update `updateInput` function:**
```jsx
const updateInput = (key, value) => {
  setInputs(prev => {
    const newInputs = { ...prev, [key]: parseFloat(value) };
    
    // If Saves_Money is turned off, disable all other savings variables
    if (key === 'Saves_Money' && value === 0) {
      newInputs.Regular_Saver = 0;
      newInputs.Informal_Savings_Mode = 0;
      newInputs.Diverse_Savings_Reasons = 0;
      newInputs.Savings_Frequency_Score = 0;
      newInputs.Savings_Behavior_Score = 0;
      // Keep savings_frequency_numeric and Old_Age_Planning independent
    }
    
    return newInputs;
  });
};
```

2. **Disable controls when Saves_Money = No:**
```jsx
const savingsDisabled = inputs.Saves_Money === 0;

<ToggleInput
  label="Regular Saver"
  value={inputs.Regular_Saver}
  onChange={(val) => updateInput('Regular_Saver', val)}
  help="Saves regularly and consistently"
  disabled={savingsDisabled}
/>

{savingsDisabled && (
  <p className="text-xs text-orange-600 mt-1">
    💡 Enable "Saves Money" to adjust detailed savings behaviors
  </p>
)}
```

3. **Update ToggleInput component to support disabled state:**
```jsx
const ToggleInput = ({ label, value, onChange, help, disabled }) => {
  // ... existing code ...
  
  <button
    type="button"
    role="switch"
    aria-checked={value === 1}
    onClick={() => !disabled && onChange(value === 1 ? 0 : 1)}
    disabled={disabled}
    className={`... ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    {/* ... */}
  </button>
};
```

---

### ✅ 5. Reorganize Savings Sections

**Location:** `dashboard/src/components/IndividualMode.jsx`

**Current Structure:**
- Economic Status card (includes `savings_frequency_numeric`)
- Savings Behavior card
- Financial Planning card

**New Structure:**

**Combine into ONE "Savings Behavior" card:**

```jsx
{/* Savings Behavior - Combined */}
<div className="bg-white p-6 rounded-lg shadow-sm border border-border-light">
  <div className="flex items-center gap-2 mb-4">
    <PiggyBank className="w-5 h-5 text-brand-purple" />
    <h3 className="text-lg font-semibold text-text-primary">Savings Behavior</h3>
  </div>
  
  {/* Info Notice */}
  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
    <p className="text-xs text-blue-700">
      <strong>Note:</strong> "Savings" includes informal methods 
      (esusu/ajo/adashi, saving at home, assets). Informal savings habits indicate readiness for formal financial services.
    </p>
  </div>
  
  <div className="space-y-4">
    {/* Master Toggle */}
    <ToggleInput
      label="Saves Money"
      value={inputs.Saves_Money}
      onChange={(val) => updateInput('Saves_Money', val)}
      help="Saved any money in past 12 months (formal or informal)"
    />
    
    {/* Conditional Savings Details */}
    {inputs.Saves_Money === 1 && (
      <>
        <SliderInput
          label="Savings Frequency"
          value={inputs.savings_frequency_numeric}
          onChange={(val) => updateInput('savings_frequency_numeric', val)}
          min={0}
          max={5}
          step={1}
          help="0=Never, 1=Rarely, 2=Occasionally, 3=Sometimes, 4=Frequently, 5=Very frequently"
        />
        
        <ToggleInput
          label="Regular Saver"
          value={inputs.Regular_Saver}
          onChange={(val) => updateInput('Regular_Saver', val)}
          help="Saves regularly and consistently"
        />
        
        <ToggleInput
          label="Uses Informal Savings"
          value={inputs.Informal_Savings_Mode}
          onChange={(val) => updateInput('Informal_Savings_Mode', val)}
          help="Uses ROSCAs (esusu/ajo/adashi) or other informal methods"
        />
        
        <ToggleInput
          label="Diverse Savings Reasons"
          value={inputs.Diverse_Savings_Reasons}
          onChange={(val) => updateInput('Diverse_Savings_Reasons', val)}
          help="Saves for 2+ different reasons (emergencies, education, business, etc.)"
        />
        
        <SliderInput
          label="Savings Frequency Score"
          value={inputs.Savings_Frequency_Score}
          onChange={(val) => updateInput('Savings_Frequency_Score', val)}
          min={0}
          max={5}
          step={0.1}
          help="Weighted composite of how often and how much you save"
        />
        
        <SliderInput
          label="Overall Savings Behavior Score"
          value={inputs.Savings_Behavior_Score}
          onChange={(val) => updateInput('Savings_Behavior_Score', val)}
          min={0}
          max={5}
          step={0.1}
          help="Composite score combining all savings behaviors"
        />
      </>
    )}
    
    {inputs.Saves_Money === 0 && (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
        <p className="text-xs text-orange-700">
          💡 Turn on "Saves Money" above to adjust detailed savings behaviors
        </p>
      </div>
    )}
    
    {/* Old Age Planning - Keep separate as it's independent */}
    <div className="pt-4 border-t border-border-light">
      <ToggleInput
        label="Old Age Planning"
        value={inputs.Old_Age_Planning}
        onChange={(val) => updateInput('Old_Age_Planning', val)}
        help="Has any plan for old age/retirement (formal pension, savings, assets, family support)"
      />
    </div>
  </div>
</div>
```

---

### ✅ 6-10. Variable Info Page Updates

**Location:** `dashboard/src/components/VariableInfo.jsx`

**Changes Needed:**

1. **Add explanatory notes for counterintuitive coefficients:**

**runs_out_of_money** card:
```jsx
<div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mt-3">
  <p className="text-xs font-semibold text-yellow-900">Why is this positive?</p>
  <p className="text-xs text-yellow-800 mt-1">
    People who run out of money frequently <strong>need</strong> formal financial services more urgently 
    (savings for emergencies, credit for consumption smoothing, budgeting tools). This variable indicates 
    income volatility and financial stress, which drives demand for formal financial solutions.
  </p>
</div>
```

**Old_Age_Planning** card:
```jsx
<div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mt-3">
  <p className="text-xs font-semibold text-yellow-900">Why is this negative?</p>
  <p className="text-xs text-yellow-800 mt-1">
    People with old-age plans may rely on informal mechanisms (family support, asset accumulation, land ownership) 
    rather than formal pensions. The weak negative coefficient (-0.044) suggests that having informal planning 
    mechanisms reduces perceived need for formal financial services.
  </p>
</div>
```

**Savings scores** cards:
```jsx
<div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mt-3">
  <p className="text-xs font-semibold text-yellow-900">Understanding the weak negative coefficient</p>
  <p className="text-xs text-yellow-800 mt-1">
    These composite scores are calculated FROM other savings variables already in the model, causing 
    multicollinearity. When controlling for individual behaviors (savings_frequency_numeric, etc.), 
    the composite scores add little new information. The important signal is that <strong>frequent saving 
    behavior DOES predict higher formal inclusion</strong> (savings_frequency_numeric: +0.205).
  </p>
</div>
```

2. **Update all savings variable descriptions to mention informal methods:**

Example for **Saves_Money**:
```jsx
description="Whether the respondent saved any money in the past 12 months, through ANY method including: 
formal (bank accounts, mobile money, cooperatives) or informal (saving at home, esusu/ajo/adashi ROSCAs, 
savings with family/friends, purchasing assets like livestock or gold). This basic indicator shows whether 
someone has surplus income and chooses to save rather than spend everything immediately—a key behavior 
indicating readiness for formal financial services."
```

3. **Reorganize Variable Info sections:**
- Combine "Savings Frequency" into "Savings Behavior" section
- Total sections: Demographics (4), Economic (4), Savings Behavior (8)

---

## Summary of Changes

| # | Change | Priority | Effort | Impact |
|---|--------|----------|--------|--------|
| 1 | Add informal savings notice | HIGH | Low | High clarity |
| 2 | Add state selection | MEDIUM | Medium | Better UX |
| 3 | Improve contributing factors (%) | HIGH | Medium | High clarity |
| 4 | Conditional logic (disable if no savings) | HIGH | Medium | Better UX |
| 5 | Reorganize savings sections | HIGH | Low | Simpler UI |
| 6-10 | Update Variable Info explanations | HIGH | High | Critical for interpretation |

---

## Implementation Order

1. ✅ Variable Info updates (add explanatory notes) - CRITICAL for model interpretation
2. ✅ Improve contributing factors display (percentages) - Immediate clarity improvement
3. ✅ Reorganize savings sections - Simplifies UI
4. ✅ Conditional logic for savings - Better UX
5. ✅ Add state selection - Nice-to-have enhancement
6. ✅ Add informal savings notice - Clarifies methodology

---

## Testing Checklist After Implementation

- [ ] Contributing factors show as percentages (0-100%)
- [ ] Contributing factors sum to ~100%
- [ ] Tooltip/legend explains percentage meaning
- [ ] When "Saves Money" = No, other savings vars are disabled/grayed
- [ ] When "Saves Money" = Yes, other savings vars become adjustable
- [ ] State dropdown shows all 37 states
- [ ] State selection doesn't affect prediction (display only)
- [ ] Informal savings notice is visible and clear
- [ ] Variable Info page has explanatory notes for counterintuitive coefficients
- [ ] All savings variables mention informal methods in descriptions
- [ ] Savings sections are reorganized into single coherent section

---

**Status:** Ready for implementation
**Est. Time:** 4-6 hours for all changes
**Priority:** HIGH - Addresses critical interpretability issues
