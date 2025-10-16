import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, GraduationCap, Building2, Smartphone, ArrowUp, ArrowDown, RotateCcw, AlertCircle, CreditCard } from 'lucide-react';
import { simulatePolicyImpact, EFINA_BASELINE_RATE, CALIBRATION_FACTOR } from '../utils/policyPrediction';

export default function PolicyMode({ population }) {
  const [policyInputs, setPolicyInputs] = useState(null);
  const [baselineStats, setBaselineStats] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Calculate baseline stats from population
  useEffect(() => {
    if (population && population.length > 0) {
      try {
        console.log('Calculating baseline from', population.length, 'records...');
        
        // Key policy-relevant features
        const hasNIN = (population.filter(p => p.Has_NIN === 1).length / population.length) * 100;
        const digitalAvg = population.reduce((sum, p) => sum + (p.Digital_Access_Index || 0), 0) / population.length;
        const educationAvg = population.reduce((sum, p) => sum + (p.education_numeric || 0), 0) / population.length;
        const infraAvg = population.reduce((sum, p) => sum + (p.Infrastructure_Access_Index || 0), 0) / population.length;
        const wealthAvg = population.reduce((sum, p) => sum + (p.wealth_numeric || 0), 0) / population.length;
        const incomeAvg = population.reduce((sum, p) => sum + (p.income_numeric || 0), 0) / population.length;
        
        // Calculate raw baseline rate
        const included = population.filter(p => p.Formally_Included === 1).length;
        const rawRate = (included / population.length) * 100;
        const calibratedRate = rawRate * CALIBRATION_FACTOR;

        const roundValue = (val, decimals = 1) => Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);

        const baselineData = {
          // High-impact features
          NIN_Current: roundValue(hasNIN, 1),
          Digital_Current: roundValue(digitalAvg, 2),
          Education_Current: roundValue(educationAvg, 2),
          Infrastructure_Current: roundValue(infraAvg, 2),
          
          // Economic
          Wealth_Current: roundValue(wealthAvg, 2),
          Income_Current: roundValue(incomeAvg, 0),
          
          // Rates
          Raw_Baseline_Rate: roundValue(rawRate, 2),
          Baseline_Inclusion_Rate: roundValue(calibratedRate, 2),
          Total_Population: population.length,
          Currently_Included: included,
        };

        console.log('Baseline calculated:', baselineData);
        setBaselineStats(baselineData);

        // Initialize policy inputs at current baseline
        const policyInputsData = {
          NIN_Target: baselineData.NIN_Current,
          Digital_Target: baselineData.Digital_Current,
          Education_Target: baselineData.Education_Current,
          Infrastructure_Target: baselineData.Infrastructure_Current,
        };
        
        setPolicyInputs(policyInputsData);
        
      } catch (error) {
        console.error('Error calculating baseline stats:', error);
      }
    }
  }, [population]);

  // Simulate policy impact with debouncing for performance
  const policyResults = useMemo(() => {
    if (!population || !baselineStats || !policyInputs) {
      console.log('Missing data:', { hasPopulation: !!population, hasBaseline: !!baselineStats, hasInputs: !!policyInputs });
      return null;
    }

    console.log('Policy Inputs:', policyInputs);
    console.log('Baseline Stats:', baselineStats);

    // Check if any policies have changed from baseline
    const ninDelta = Math.abs(policyInputs.NIN_Target - baselineStats.NIN_Current);
    const digitalDelta = Math.abs(policyInputs.Digital_Target - baselineStats.Digital_Current);
    const educationDelta = Math.abs(policyInputs.Education_Target - baselineStats.Education_Current);
    const infraDelta = Math.abs(policyInputs.Infrastructure_Target - baselineStats.Infrastructure_Current);
    
    console.log('Deltas:', { ninDelta, digitalDelta, educationDelta, infraDelta });
    
    const hasChanges = 
      ninDelta > 0.1 ||
      digitalDelta > 0.01 ||
      educationDelta > 0.01 ||
      infraDelta > 0.1;

    console.log('Has changes:', hasChanges);

    // If no policy changes, return baseline stats
    if (!hasChanges) {
      return {
        baseline: {
          rate: baselineStats.Baseline_Inclusion_Rate,
          count: baselineStats.Currently_Included
        },
        projected: {
          rate: baselineStats.Baseline_Inclusion_Rate,
          count: baselineStats.Currently_Included
        },
        impact: {
          deltaRate: 0,
          deltaPercentagePoints: 0,
          newlyIncluded: 0,
          percentAffected: 0
        }
      };
    }

    // Run simulation with policy changes
    console.log('Running simulation with changes...');
    setIsSimulating(true);
    
    const policyChanges = {
      NIN_Target: policyInputs.NIN_Target,
      Digital_Target: policyInputs.Digital_Target,
      Education_Target: policyInputs.Education_Target,
      Infrastructure_Target: policyInputs.Infrastructure_Target,
    };

    const results = simulatePolicyImpact(population, policyChanges);
    setIsSimulating(false);
    
    console.log('Simulation results:', results);
    return results;
  }, [population, baselineStats, policyInputs]);

  const updatePolicy = (key, value) => {
    console.log(`Updating ${key} to ${value}`);
    setPolicyInputs(prev => {
      const updated = { ...prev, [key]: value };
      console.log('Updated policy inputs:', updated);
      return updated;
    });
  };

  const resetPolicies = useCallback(() => {
    if (baselineStats) {
      setPolicyInputs({
        NIN_Target: baselineStats.NIN_Current,
        Digital_Target: baselineStats.Digital_Current,
        Education_Target: baselineStats.Education_Current,
        Infrastructure_Target: baselineStats.Infrastructure_Current,
      });
    }
  }, [baselineStats]);

  if (!baselineStats || !policyInputs || !policyResults) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading population data...</p>
        </div>
      </div>
    );
  }

  const PolicyCard = ({ icon: Icon, title, color, children }) => (
    <div className="bg-white rounded-xl shadow-card border border-border-light p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-semibold text-text-primary">{title}</h3>
      </div>
      {children}
    </div>
  );

  const SliderPolicy = ({ label, current, target, onChange, min, max, step, unit = '', help }) => (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <label className="text-sm font-medium text-text-primary">{label}</label>
          {help && <p className="text-xs text-text-tertiary mt-1">{help}</p>}
        </div>
        <div className="text-right">
          <div className="text-xs text-text-tertiary">Current: {current}{unit}</div>
          <div className="text-sm font-semibold text-accent-primary">Target: {target}{unit}</div>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={target}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-border-light rounded-lg appearance-none cursor-pointer accent-accent-primary"
      />
      <div className="flex justify-between text-xs text-text-tertiary">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );

  const TogglePolicy = ({ label, value, onChange, help }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <label className="text-sm font-medium text-text-primary">{label}</label>
          {help && <p className="text-xs text-text-tertiary mt-1">{help}</p>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!!value}
          onClick={() => onChange(!value)}
          className={`relative inline-flex items-center w-16 h-8 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            value ? 'bg-brand-green focus:ring-brand-green' : 'bg-border-medium focus:ring-accent-primary'
          }`}
        >
          <span className={`absolute left-2 text-[10px] font-semibold tracking-wider ${value ? 'text-white' : 'text-white/70'}`}>
            {value ? 'ON' : ''}
          </span>
          <span className={`absolute right-2 text-[10px] font-semibold tracking-wider ${!value ? 'text-white' : 'text-white/70'}`}>
            {!value ? 'OFF' : ''}
          </span>
          <span
            className={`inline-block w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
              value ? 'translate-x-8' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );

  const deltaPercentagePoints = policyResults.impact.deltaPercentagePoints;
  const impactColor = deltaPercentagePoints >= 5 ? 'text-brand-green' : deltaPercentagePoints >= 1 ? 'text-accent-primary' : 'text-text-secondary';
  const impactBg = deltaPercentagePoints >= 5 ? 'from-brand-green to-green-400' : deltaPercentagePoints >= 1 ? 'from-accent-primary to-accent-secondary' : 'from-gray-400 to-gray-500';

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Results Header */}
        <div className="bg-gradient-to-br from-white to-bg-secondary shadow-card-lg border border-border-light rounded-2xl p-8">
          {isSimulating && (
            <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-accent-primary">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-primary"></div>
              <span>Simulating...</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Baseline Rate */}
            <div className="text-center">
              <div className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-2">Current Rate</div>
              <div className="text-4xl font-bold text-text-primary">{policyResults.baseline.rate.toFixed(1)}%</div>
              <div className="text-xs text-text-tertiary mt-1">{policyResults.baseline.count.toLocaleString()} included</div>
            </div>

            {/* Projected Rate */}
            <div className="text-center">
              <div className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-2">Projected Rate</div>
              <div className={`text-4xl font-bold ${impactColor}`}>{policyResults.projected.rate.toFixed(1)}%</div>
              <div className="text-xs text-text-tertiary mt-1">{policyResults.projected.count.toLocaleString()} included</div>
            </div>

            {/* Impact */}
            <div className="text-center">
              <div className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-2">Change</div>
              <div className="flex items-center justify-center gap-2">
                {deltaPercentagePoints > 0 ? (
                  <ArrowUp className={`w-6 h-6 ${impactColor}`} />
                ) : deltaPercentagePoints < 0 ? (
                  <ArrowDown className="w-6 h-6 text-brand-red" />
                ) : null}
                <div className={`text-4xl font-bold ${impactColor}`}>
                  {deltaPercentagePoints >= 0 ? '+' : ''}{deltaPercentagePoints.toFixed(1)}pp
                </div>
              </div>
              <div className="text-xs text-text-tertiary mt-1">Percentage points</div>
            </div>
            
            {/* Newly Included */}
            <div className="text-center">
              <div className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-2">Newly Included</div>
              <div className={`text-4xl font-bold ${impactColor}`}>
                {policyResults.impact.newlyIncluded.toLocaleString()}
              </div>
              <div className="text-xs text-text-tertiary mt-1">
                {policyResults.impact.percentAffected.toFixed(2)}% of population
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="relative h-4 bg-border-light rounded-full overflow-hidden">
              <div 
                className={`absolute top-0 left-0 h-full bg-gradient-to-r ${impactBg} rounded-full transition-all duration-700`}
                style={{ width: `${Math.min(100, policyResults.projected.rate)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-text-tertiary mt-2">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Policy Controls - Top 4 High-Impact Levers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* NIN Enrollment Drive */}
          <PolicyCard icon={CreditCard} title="National ID (NIN) Enrollment" color="from-emerald-500 to-teal-500">
            <SliderPolicy
              label="NIN Enrollment Rate"
              current={baselineStats.NIN_Current.toFixed(1)}
              target={policyInputs.NIN_Target.toFixed(1)}
              onChange={(val) => updatePolicy('NIN_Target', val)}
              min={baselineStats.NIN_Current}
              max={100}
              step={1}
              unit="%"
              help="Increase from current 68% to near-universal coverage. NIN is required for formal banking (Coefficient: +0.666)"
            />
            <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-xs text-emerald-800">
                <strong>Impact:</strong> Highest coefficient (+0.666). NIN is foundational for KYC and formal financial services.
                Potential to reach <strong>{Math.round((100 - baselineStats.NIN_Current) / 100 * baselineStats.Total_Population).toLocaleString()}</strong> additional people.
              </p>
            </div>
          </PolicyCard>
          
          {/* Digital Access Expansion */}
          <PolicyCard icon={Smartphone} title="Digital Access Expansion" color="from-blue-500 to-indigo-500">
            <SliderPolicy
              label="Digital Access Index"
              current={baselineStats.Digital_Current.toFixed(2)}
              target={policyInputs.Digital_Target.toFixed(2)}
              onChange={(val) => updatePolicy('Digital_Target', val)}
              min={baselineStats.Digital_Current}
              max={2.0}
              step={0.05}
              help="Mobile ownership + network coverage (0-2 scale). Currently 1.49, target up to 2.0 (Coefficient: +0.530)"
            />
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Impact:</strong> Second-highest coefficient (+0.530). Digital access enables mobile banking, digital payments, and fintech.
                Current gap: <strong>{((2.0 - baselineStats.Digital_Current) / 2.0 * 100).toFixed(0)}%</strong> room for improvement.
              </p>
            </div>
          </PolicyCard>
          
          {/* Education Programs */}
          <PolicyCard icon={GraduationCap} title="Education Programs" color="from-purple-500 to-pink-500">
            <SliderPolicy
              label="Education Level"
              current={baselineStats.Education_Current.toFixed(2)}
              target={policyInputs.Education_Target.toFixed(2)}
              onChange={(val) => updatePolicy('Education_Target', val)}
              min={baselineStats.Education_Current}
              max={3.0}
              step={0.1}
              help="Average education: 0=None, 1=Primary, 2=Secondary, 3=Tertiary. Currently 1.58 (Coefficient: +0.510)"
            />
            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-800">
                <strong>Impact:</strong> Third-highest coefficient (+0.510). Education improves financial literacy and employability.
                Reaching secondary level (2.0) would impact <strong>{Math.round((2.0 - baselineStats.Education_Current) / 2.0 * baselineStats.Total_Population).toLocaleString()}</strong> people.
              </p>
            </div>
          </PolicyCard>
          
          {/* Infrastructure Access */}
          <PolicyCard icon={Building2} title="Infrastructure Access" color="from-orange-500 to-red-500">
            <SliderPolicy
              label="Infrastructure Access Index"
              current={baselineStats.Infrastructure_Current.toFixed(2)}
              target={policyInputs.Infrastructure_Target.toFixed(2)}
              onChange={(val) => updatePolicy('Infrastructure_Target', val)}
              min={baselineStats.Infrastructure_Current}
              max={12.0}
              step={0.5}
              help="Number of nearby facilities (banks, ATMs, agents). Currently 3.23 / 12 (Coefficient: +0.403)"
            />
            <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-xs text-orange-800">
                <strong>Impact:</strong> Fourth-highest coefficient (+0.403). Infrastructure reduces physical barriers to access.
                Current coverage: only <strong>{(baselineStats.Infrastructure_Current / 12 * 100).toFixed(0)}%</strong>. Tripling to 10/12 would be transformative.
              </p>
            </div>
          </PolicyCard>
        </div>

        {/* Policy Insights & Reset */}
        <div className="bg-white rounded-xl shadow-card border border-border-light p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Policy Impact Summary</h3>
              <p className="text-sm text-text-secondary">
                These 4 levers represent the highest-impact interventions for financial inclusion based on the model coefficients.
                Adjust sliders to see combined effects.
              </p>
              {deltaPercentagePoints > 0 && (
                <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-900">
                    <strong>Combined Impact:</strong> Your policy interventions would bring <strong>{policyResults.impact.newlyIncluded.toLocaleString()}</strong> additional people 
                    into formal financial inclusion, increasing the national rate by <strong>{deltaPercentagePoints.toFixed(2)} percentage points</strong>.
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={resetPolicies}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-border-medium rounded-xl text-text-primary font-medium hover:bg-bg-secondary hover:border-accent-primary transition-all shadow-sm hover:shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All
            </button>
          </div>
        </div>
        
        {/* Methodology Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <strong>Methodology:</strong> Policy simulations use probabilistic application based on target coverage. 
              Results show potential impact on {baselineStats.Total_Population.toLocaleString()} survey respondents. 
              Baseline rate calibrated to EFInA standard: {policyResults.baseline.rate.toFixed(1)}%.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
