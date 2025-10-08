# Dashboard Integration Guide

## Files Created

1. **`src/utils/prediction.js`** - Shared prediction logic for both modes
2. **`src/components/PolicyMode.jsx`** - Policy simulation interface
3. **`public/population_data.json`** - 28k population records (11.97 MB)

## Next Steps to Complete Integration

### Step 1: Update Main App.jsx

Replace the current `App.jsx` with the integrated version that:
- Adds mode toggle (Individual vs Policy)
- Loads population data asynchronously
- Renders Individual mode (current UI) or Policy mode

### Step 2: Move Individual Logic to Component

Extract current individual simulation to `src/components/IndividualMode.jsx`

### Step 3: Create Mode Switcher

Add toggle button in header to switch between:
- **Individual Mode:** Current person-level simulator
- **Policy Mode:** National population-level simulator

## How It Will Work

### Individual Mode (Current)
- User adjusts sliders for ONE person's characteristics
- Prediction shows that person's inclusion probability
- Baseline comparison shows deviation from 64% average

### Policy Mode (New)
- User adjusts sliders for POPULATION percentages
- Example: "% with tertiary education: 9% → 25%"
- System simulates changes across all 28,392 people
- Shows new national inclusion rate
- Displays impact: "+7.2% national rate, ~13.5k newly included"

## Technical Implementation

### Population Data Loading
```javascript
const [population, setPopulation] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/population_data.json')
    .then(res => res.json())
    .then(data => {
      setPopulation(data.population);
      setLoading(false);
    });
}, []);
```

### Mode Toggle
```javascript
const [mode, setMode] = useState('individual'); // 'individual' or 'policy'

return (
  <div>
    <ModeToggle mode={mode} onChange={setMode} />
    {mode === 'individual' ? (
      <IndividualMode />
    ) : (
      <PolicyMode population={population} />
    )}
  </div>
);
```

### Policy Simulation Logic
1. User sets target: "Bank account coverage: 55% → 75%"
2. System identifies people without bank accounts (45% of population)
3. Randomly selects subset to "upgrade" (20% of 45% = 9% of total)
4. Recalculates inclusion probability for all upgraded individuals
5. Aggregates to new national rate

## Performance Considerations

- **Population size:** 28,392 records
- **File size:** 11.97 MB JSON
- **Load time:** ~2-3 seconds on initial load
- **Simulation time:** ~500ms for full population recalculation
- **Solution:** Show loading spinner, use React.useMemo for caching

## UI Layout Changes

### Header
```
┌─────────────────────────────────────────────────────────┐
│ EFInA Simulator  [Individual | Policy] ← Mode Toggle   │
└─────────────────────────────────────────────────────────┘
```

### Individual Mode (Unchanged)
- Person-level controls
- Single probability output
- Feature contribution chart

### Policy Mode (New Layout)
```
┌─────────────┬─────────────┬─────────────┐
│ National    │ Education   │ Infrastruc  │
│ Impact KPI  │ Policy      │ -ture Policy│
│ 64% → 71%   │ Tertiary:   │ NIN: 68→95% │
└─────────────┴─────────────┴─────────────┘
┌─────────────┬─────────────┬─────────────┐
│ Financial   │ Reset       │ Impact      │
│ Access      │ Button      │ Breakdown   │
│ 14% → 40%   │             │ Chart       │
└─────────────┴─────────────┴─────────────┘
```

## Would you like me to:
1. Complete the full App.jsx integration now?
2. Create step-by-step instructions for you to integrate manually?
3. Build it in phases (first add mode toggle, then policy mode)?

Let me know and I'll proceed with the full integration!
