import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CreditCard, Smartphone, GraduationCap, Building2, ArrowUp, ArrowDown, RotateCcw, AlertCircle } from 'lucide-react';
import { simulatePolicyImpact } from '../utils/policyPrediction';

// Nigeria's adult population (18+) - approximately 110 million
const NIGERIA_ADULT_POPULATION = 110_000_000;

// EFInA calibrated baseline rate
const EFINA_BASELINE_RATE = 64.0;

const CALIBRATION_FACTOR = 1.05; // To align with EFInA 64% baseline

// Debounce delay in milliseconds (reduced for faster response)
const DEBOUNCE_DELAY = 300;

export default function PolicyMode({ population }) {
  const [policyInputs, setPolicyInputs] = useState(null);
  const [debouncedPolicyInputs, setDebouncedPolicyInputs] = useState(null);
  const [baselineStats, setBaselineStats] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const debounceTimer = useRef(null);
  
  // Calculate scaling factor from sample to national population
  const scalingFactor = useMemo(() => {
    if (!population || population.length === 0) return 1;
    return NIGERIA_ADULT_POPULATION / population.length;
  }, [population]);

  // Calculate baseline stats from population
  useEffect(() => {
    if (population && population.length > 0) {
      try {
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

        setBaselineStats(baselineData);

        // Initialize policy inputs at current baseline
        const policyInputsData = {
          NIN_Target: baselineData.NIN_Current,
          Digital_Target: baselineData.Digital_Current,
          Education_Target: baselineData.Education_Current,
          Infrastructure_Target: baselineData.Infrastructure_Current,
        };
        
        setPolicyInputs(policyInputsData);
        setDebouncedPolicyInputs(policyInputsData);
        
      } catch (error) {
        console.error('Error calculating baseline stats:', error);
      }
    }
  }, [population]);

  // Debounce policy inputs to reduce simulation frequency
  useEffect(() => {
    if (!policyInputs) return;
    
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set new timer
    debounceTimer.current = setTimeout(() => {
      setDebouncedPolicyInputs(policyInputs);
    }, DEBOUNCE_DELAY);
    
    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [policyInputs]);

  // Simulate policy impact with debouncing for performance
  const policyResults = useMemo(() => {
    if (!population || !baselineStats || !debouncedPolicyInputs) return null;

    // Check if any policies have changed from baseline
    const ninDelta = Math.abs(debouncedPolicyInputs.NIN_Target - baselineStats.NIN_Current);
    const digitalDelta = Math.abs(debouncedPolicyInputs.Digital_Target - baselineStats.Digital_Current);
    const educationDelta = Math.abs(debouncedPolicyInputs.Education_Target - baselineStats.Education_Current);
    const infraDelta = Math.abs(debouncedPolicyInputs.Infrastructure_Target - baselineStats.Infrastructure_Current);
    
    const hasChanges = 
      ninDelta > 0.1 ||
      digitalDelta > 0.01 ||
      educationDelta > 0.01 ||
      infraDelta > 0.1;

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
        },
        contributions: {
          NIN: 0,
          Digital: 0,
          Education: 0,
          Infrastructure: 0
        }
      };
    }

    // Run simulation with policy changes
    setIsSimulating(true);
    
    const policyChanges = {
      NIN_Target: debouncedPolicyInputs.NIN_Target,
      Digital_Target: debouncedPolicyInputs.Digital_Target,
      Education_Target: debouncedPolicyInputs.Education_Target,
      Infrastructure_Target: debouncedPolicyInputs.Infrastructure_Target,
    };

    const results = simulatePolicyImpact(population, policyChanges);
    
    // Calculate marginal contributions - only if policies actually changed from baseline
    const ninChanged = Math.abs(debouncedPolicyInputs.NIN_Target - baselineStats.NIN_Current) > 0.1;
    const digitalChanged = Math.abs(debouncedPolicyInputs.Digital_Target - baselineStats.Digital_Current) > 0.01;
    const educationChanged = Math.abs(debouncedPolicyInputs.Education_Target - baselineStats.Education_Current) > 0.01;
    const infraChanged = Math.abs(debouncedPolicyInputs.Infrastructure_Target - baselineStats.Infrastructure_Current) > 0.1;
    
    // Calculate marginal contribution: impact with all policies EXCEPT this one
    let ninContribution = 0;
    let digitalContribution = 0;
    let educationContribution = 0;
    let infraContribution = 0;
    
    if (ninChanged || digitalChanged || educationChanged || infraChanged) {
      // Baseline with no changes
      const baseline = simulatePolicyImpact(population, {
        NIN_Target: baselineStats.NIN_Current,
        Digital_Target: baselineStats.Digital_Current,
        Education_Target: baselineStats.Education_Current,
        Infrastructure_Target: baselineStats.Infrastructure_Current,
      });
      
      // If only NIN changed, its contribution is the full effect
      if (ninChanged && !digitalChanged && !educationChanged && !infraChanged) {
        ninContribution = results.impact.deltaPercentagePoints;
      } else if (ninChanged) {
        // Calculate effect WITHOUT NIN (all others applied)
        const withoutNIN = simulatePolicyImpact(population, {
          NIN_Target: baselineStats.NIN_Current,
          Digital_Target: debouncedPolicyInputs.Digital_Target,
          Education_Target: debouncedPolicyInputs.Education_Target,
          Infrastructure_Target: debouncedPolicyInputs.Infrastructure_Target,
        });
        ninContribution = results.impact.deltaPercentagePoints - withoutNIN.impact.deltaPercentagePoints;
      }
      
      // Similar for Digital
      if (digitalChanged && !ninChanged && !educationChanged && !infraChanged) {
        digitalContribution = results.impact.deltaPercentagePoints;
      } else if (digitalChanged) {
        const withoutDigital = simulatePolicyImpact(population, {
          NIN_Target: debouncedPolicyInputs.NIN_Target,
          Digital_Target: baselineStats.Digital_Current,
          Education_Target: debouncedPolicyInputs.Education_Target,
          Infrastructure_Target: debouncedPolicyInputs.Infrastructure_Target,
        });
        digitalContribution = results.impact.deltaPercentagePoints - withoutDigital.impact.deltaPercentagePoints;
      }
      
      // Education
      if (educationChanged && !ninChanged && !digitalChanged && !infraChanged) {
        educationContribution = results.impact.deltaPercentagePoints;
      } else if (educationChanged) {
        const withoutEducation = simulatePolicyImpact(population, {
          NIN_Target: debouncedPolicyInputs.NIN_Target,
          Digital_Target: debouncedPolicyInputs.Digital_Target,
          Education_Target: baselineStats.Education_Current,
          Infrastructure_Target: debouncedPolicyInputs.Infrastructure_Target,
        });
        educationContribution = results.impact.deltaPercentagePoints - withoutEducation.impact.deltaPercentagePoints;
      }
      
      // Infrastructure
      if (infraChanged && !ninChanged && !digitalChanged && !educationChanged) {
        infraContribution = results.impact.deltaPercentagePoints;
      } else if (infraChanged) {
        const withoutInfra = simulatePolicyImpact(population, {
          NIN_Target: debouncedPolicyInputs.NIN_Target,
          Digital_Target: debouncedPolicyInputs.Digital_Target,
          Education_Target: debouncedPolicyInputs.Education_Target,
          Infrastructure_Target: baselineStats.Infrastructure_Current,
        });
        infraContribution = results.impact.deltaPercentagePoints - withoutInfra.impact.deltaPercentagePoints;
      }
    }
    
    results.contributions = {
      NIN: ninContribution,
      Digital: digitalContribution,
      Education: educationContribution,
      Infrastructure: infraContribution
    };
    
    setIsSimulating(false);
    
    return results;
  }, [population, baselineStats, debouncedPolicyInputs]);

  const updatePolicy = (key, value) => {
    setPolicyInputs(prev => ({ ...prev, [key]: value }));
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
          <div className="text-sm font-semibold text-accent-primary">{target}{unit}</div>
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

  // Helper function to format millions
  const formatMillions = (num) => {
    const millions = num / 1_000_000;
    if (millions >= 1) {
      return `${millions.toFixed(1)}M`;
    }
    const thousands = num / 1_000;
    return `${thousands.toFixed(0)}K`;
  };
  
  // Fixed baseline and calculated projected rate
  const FIXED_BASELINE_RATE = 64.0; // EFInA calibrated baseline
  const deltaPercentagePoints = policyResults.impact.deltaPercentagePoints;
  const projectedRate = FIXED_BASELINE_RATE + deltaPercentagePoints; // 64% + delta
  
  // Calculate national population counts
  const baselineNational = Math.round((FIXED_BASELINE_RATE / 100) * NIGERIA_ADULT_POPULATION);
  const projectedNational = Math.round((projectedRate / 100) * NIGERIA_ADULT_POPULATION);
  const newlyIncludedNational = projectedNational - baselineNational;
  
  const impactColor = deltaPercentagePoints >= 5 ? 'text-brand-green' : deltaPercentagePoints >= 1 ? 'text-accent-primary' : 'text-text-secondary';
  const impactBg = deltaPercentagePoints >= 5 ? 'bg-brand-green' : deltaPercentagePoints >= 1 ? 'bg-accent-primary' : 'bg-gray-400';

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Sticky Results Header */}
      <div className="sticky top-0 z-30 bg-bg-primary pt-3 md:pt-6 pb-1 md:pb-2">
        <div className="max-w-7xl mx-auto px-3 md:px-6">
          <div className="bg-gradient-to-br from-white to-bg-secondary shadow-card-lg border border-border-light rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 relative">
            {isSimulating && (
              <div className="absolute top-2 right-2 md:top-4 md:right-4 flex items-center gap-1 md:gap-2 text-xs md:text-sm text-accent-primary">
                <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-accent-primary"></div>
                <span className="hidden sm:inline">Simulating...</span>
              </div>
            )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            
            {/* Baseline Rate */}
            <div className="text-center">
              <div className="text-[10px] sm:text-xs md:text-sm font-medium text-text-secondary uppercase tracking-wide mb-1 md:mb-2">Current</div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary">64%</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-text-tertiary mt-0.5 md:mt-1 hidden sm:block">{baselineNational.toLocaleString()} people</div>
            </div>

            {/* Projected Rate */}
            <div className="text-center">
              <div className="text-[10px] sm:text-xs md:text-sm font-medium text-text-secondary uppercase tracking-wide mb-1 md:mb-2">Projected</div>
              <div className={`text-2xl sm:text-3xl md:text-4xl font-bold ${impactColor}`}>{projectedRate.toFixed(1)}%</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-text-tertiary mt-0.5 md:mt-1 hidden sm:block">{projectedNational.toLocaleString()} people</div>
            </div>

            {/* Impact */}
            <div className="text-center">
              <div className="text-[10px] sm:text-xs md:text-sm font-medium text-text-secondary uppercase tracking-wide mb-1 md:mb-2">Change</div>
              <div className="flex items-center justify-center gap-1 md:gap-2">
                {deltaPercentagePoints > 0 ? (
                  <ArrowUp className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${impactColor}`} />
                ) : deltaPercentagePoints < 0 ? (
                  <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-brand-red" />
                ) : null}
                <div className={`text-2xl sm:text-3xl md:text-4xl font-bold ${impactColor}`}>
                  {deltaPercentagePoints >= 0 ? '+' : ''}{deltaPercentagePoints.toFixed(1)}pp
                </div>
              </div>
              <div className="text-[9px] sm:text-[10px] md:text-xs text-text-tertiary mt-0.5 md:mt-1 hidden sm:block">Percentage points</div>
            </div>
            
            {/* Newly Included */}
            <div className="text-center">
              <div className="text-[10px] sm:text-xs md:text-sm font-medium text-text-secondary uppercase tracking-wide mb-1 md:mb-2">New</div>
              <div className={`text-2xl sm:text-3xl md:text-4xl font-bold ${impactColor}`}>
                {formatMillions(newlyIncludedNational)}
              </div>
              <div className="text-[10px] sm:text-xs text-text-tertiary mt-0.5 md:mt-1">
                <div className="font-semibold text-text-primary hidden md:block">{newlyIncludedNational.toLocaleString()} Nigerians</div>
                <div className="text-[9px] sm:text-[10px] mt-0.5 hidden sm:block">{policyResults.impact.percentAffected.toFixed(2)}% of adults</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 md:mt-6">
            <div className="relative h-3 md:h-4 bg-border-light rounded-full overflow-hidden">
              <div 
                className={`absolute top-0 left-0 h-full ${impactBg} rounded-full transition-all duration-700`}
                style={{ width: `${Math.min(100, projectedRate)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] md:text-xs text-text-tertiary mt-1 md:mt-2">
              <span>0%</span>
              <span className="hidden sm:inline">50%</span>
              <span>100%</span>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-w-7xl mx-auto px-3 md:px-6 pb-6 space-y-4 md:space-y-6">
        {/* Policy Controls - Top 4 High-Impact Levers */}
        <div className="relative">
          {/* Loading Overlay */}
          {isSimulating && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-40 rounded-2xl flex items-center justify-center transition-opacity duration-200">
              <div className="flex flex-col items-center gap-3 md:gap-4 bg-white p-6 md:p-8 rounded-xl md:rounded-2xl shadow-2xl border-2 border-accent-primary/20">
                <div className="relative">
                  {/* Outer spinning ring */}
                  <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-3 md:border-4 border-accent-primary border-t-transparent"></div>
                  {/* Inner pulse */}
                  <div className="absolute inset-2 rounded-full bg-accent-primary/10 animate-pulse"></div>
                </div>
                <div className="text-center">
                  <p className="text-sm md:text-base font-bold text-accent-primary">Simulating Impact...</p>
                  <p className="text-[11px] md:text-xs text-text-tertiary mt-1 md:mt-1.5">Processing 28,392 records</p>
                  <p className="text-[10px] text-text-tertiary/70 mt-0.5 md:mt-1">Please wait...</p>
                </div>
              </div>
            </div>
          )}
          
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 ${isSimulating ? 'pointer-events-none opacity-70' : ''}`}>
          
          {/* NIN Enrollment Drive */}
          <PolicyCard icon={CreditCard} title="National ID (NIN) Enrollment" color="from-emerald-500 to-teal-500">
            {policyResults.contributions.NIN > 0 && (
              <div className="mb-3 px-3 py-2 bg-emerald-100 border border-emerald-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-700">Individual Contribution</span>
                  <span className="text-sm font-bold text-emerald-900">+{policyResults.contributions.NIN.toFixed(2)}pp</span>
                </div>
              </div>
            )}
            <SliderPolicy
              label="NIN Enrollment Rate"
              current={baselineStats.NIN_Current.toFixed(1)}
              target={policyInputs.NIN_Target.toFixed(1)}
              onChange={(val) => updatePolicy('NIN_Target', val)}
              min={baselineStats.NIN_Current}
              max={100}
              step={1}
              unit="%"
              help="Increase from current 68% to near-universal coverage. (Coefficient: +0.666)"
            />
            <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-xs text-emerald-800">
                <strong>Impact:</strong> Highest coefficient (+0.666). NIN is foundational for KYC and formal financial services.
                Potential to reach <strong>{formatMillions(Math.round((100 - baselineStats.NIN_Current) / 100 * NIGERIA_ADULT_POPULATION))}</strong> additional Nigerians 
                ({Math.round((100 - baselineStats.NIN_Current) / 100 * NIGERIA_ADULT_POPULATION).toLocaleString()} people).
              </p>
            </div>
          </PolicyCard>
          
          {/* Digital Access Expansion */}
          <PolicyCard icon={Smartphone} title="Digital Access Expansion" color="from-blue-500 to-indigo-500">
            {policyResults.contributions.Digital > 0 && (
              <div className="mb-3 px-3 py-2 bg-blue-100 border border-blue-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-700">Individual Contribution</span>
                  <span className="text-sm font-bold text-blue-900">+{policyResults.contributions.Digital.toFixed(2)}pp</span>
                </div>
              </div>
            )}
            <SliderPolicy
              label="Digital Access Index"
              current={baselineStats.Digital_Current.toFixed(2)}
              target={policyInputs.Digital_Target.toFixed(2)}
              onChange={(val) => updatePolicy('Digital_Target', val)}
              min={baselineStats.Digital_Current}
              max={2.0}
              step={0.05}
              help="Mobile ownership + network coverage (0-2 scale). Target up to 2.0 (Coefficient: +0.530)"
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
            {policyResults.contributions.Education > 0 && (
              <div className="mb-3 px-3 py-2 bg-purple-100 border border-purple-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-purple-700">Individual Contribution</span>
                  <span className="text-sm font-bold text-purple-900">+{policyResults.contributions.Education.toFixed(2)}pp</span>
                </div>
              </div>
            )}
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
                Reaching secondary level (2.0) would impact <strong>{formatMillions(Math.round((2.0 - baselineStats.Education_Current) / 2.0 * NIGERIA_ADULT_POPULATION))}</strong> Nigerians.
              </p>
            </div>
          </PolicyCard>
          
          {/* Infrastructure Access */}
          <PolicyCard icon={Building2} title="Infrastructure Access" color="from-orange-500 to-red-500">
            {policyResults.contributions.Infrastructure > 0 && (
              <div className="mb-3 px-3 py-2 bg-orange-100 border border-orange-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-orange-700">Individual Contribution</span>
                  <span className="text-sm font-bold text-orange-900">+{policyResults.contributions.Infrastructure.toFixed(2)}pp</span>
                </div>
              </div>
            )}
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
        </div> {/* End relative wrapper for loading overlay */}

        {/* Individual Contributions Breakdown */}
        {deltaPercentagePoints > 0 && (
          <div className="bg-white rounded-xl shadow-card border border-border-light p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Individual Policy Contributions</h3>
            <p className="text-sm text-text-secondary mb-4">
              Each policy's independent contribution to the total impact. Note: Combined effect may differ due to interactions.
            </p>
            
            <div className="space-y-3">
              {/* NIN Contribution */}
              {policyResults.contributions.NIN > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-32 text-sm font-medium text-text-primary">NIN Enrollment</div>
                  <div className="flex-1">
                    <div className="relative h-8 bg-emerald-100 rounded-lg overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-emerald-500 flex items-center justify-end pr-2"
                        style={{ width: `${(policyResults.contributions.NIN / deltaPercentagePoints) * 100}%` }}
                      >
                        <span className="text-xs font-bold text-white">+{policyResults.contributions.NIN.toFixed(2)}pp</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-xs text-text-tertiary">
                    {((policyResults.contributions.NIN / deltaPercentagePoints) * 100).toFixed(0)}%
                  </div>
                </div>
              )}
              
              {/* Digital Contribution */}
              {policyResults.contributions.Digital > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-32 text-sm font-medium text-text-primary">Digital Access</div>
                  <div className="flex-1">
                    <div className="relative h-8 bg-blue-100 rounded-lg overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-blue-500 flex items-center justify-end pr-2"
                        style={{ width: `${(policyResults.contributions.Digital / deltaPercentagePoints) * 100}%` }}
                      >
                        <span className="text-xs font-bold text-white">+{policyResults.contributions.Digital.toFixed(2)}pp</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-xs text-text-tertiary">
                    {((policyResults.contributions.Digital / deltaPercentagePoints) * 100).toFixed(0)}%
                  </div>
                </div>
              )}
              
              {/* Education Contribution */}
              {policyResults.contributions.Education > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-32 text-sm font-medium text-text-primary">Education</div>
                  <div className="flex-1">
                    <div className="relative h-8 bg-purple-100 rounded-lg overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-purple-500 flex items-center justify-end pr-2"
                        style={{ width: `${(policyResults.contributions.Education / deltaPercentagePoints) * 100}%` }}
                      >
                        <span className="text-xs font-bold text-white">+{policyResults.contributions.Education.toFixed(2)}pp</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-xs text-text-tertiary">
                    {((policyResults.contributions.Education / deltaPercentagePoints) * 100).toFixed(0)}%
                  </div>
                </div>
              )}
              
              {/* Infrastructure Contribution */}
              {policyResults.contributions.Infrastructure > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-32 text-sm font-medium text-text-primary">Infrastructure</div>
                  <div className="flex-1">
                    <div className="relative h-8 bg-orange-100 rounded-lg overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-orange-500 flex items-center justify-end pr-2"
                        style={{ width: `${(policyResults.contributions.Infrastructure / deltaPercentagePoints) * 100}%` }}
                      >
                        <span className="text-xs font-bold text-white">+{policyResults.contributions.Infrastructure.toFixed(2)}pp</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-xs text-text-tertiary">
                    {((policyResults.contributions.Infrastructure / deltaPercentagePoints) * 100).toFixed(0)}%
                  </div>
                </div>
              )}
              
              {/* Total */}
              <div className="pt-3 mt-3 border-t border-border-light flex items-center gap-3">
                <div className="w-32 text-sm font-bold text-text-primary">Combined Total</div>
                <div className="flex-1">
                  <div className="text-lg font-bold text-accent-primary">+{deltaPercentagePoints.toFixed(2)}pp</div>
                </div>
                <div className="w-16 text-right text-sm font-medium text-text-primary">100%</div>
              </div>
            </div>
          </div>
        )}

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
                    <strong>Combined Impact:</strong> Your policy interventions would bring <strong>{formatMillions(newlyIncludedNational)}</strong> additional Nigerians 
                    ({newlyIncludedNational.toLocaleString()} people) into formal financial inclusion, increasing the national rate by <strong>{deltaPercentagePoints.toFixed(2)} percentage points</strong>.
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
              Based on a representative sample of {baselineStats.Total_Population.toLocaleString()} survey respondents, 
              results are extrapolated to Nigeria's adult population (~{formatMillions(NIGERIA_ADULT_POPULATION)} adults). 
              Baseline rate calibrated to EFInA standard: 64.0%.
            </div>
          </div>
        </div>
      </div> {/* End scrollable content */}
    </div>
  );
}
