import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, GraduationCap, DollarSign, MapPin, PiggyBank, ArrowUp, ArrowDown, RotateCcw, Sparkles, Target } from 'lucide-react';
import { predictPopulation } from '../utils/prediction';

export default function PolicyMode({ population }) {
  const [policyInputs, setPolicyInputs] = useState(null);
  const [baselineStats, setBaselineStats] = useState(null);

  // Calculate baseline stats from population
  useEffect(() => {
    if (population && population.length > 0) {
      try {
        // Demographics
        const educationAvg = (population.reduce((sum, p) => sum + (p.education_numeric || 0), 0) / population.length);
        const urbanRate = (population.filter(p => p.urban >= 0.5).length / population.length) * 100;
        
        // Economic
        const wealthAvg = (population.reduce((sum, p) => sum + (p.wealth_numeric || 0), 0) / population.length);
        const incomeAvg = (population.reduce((sum, p) => sum + (p.income_numeric || 0), 0) / population.length);
        
        // Savings Behavior
        const savesMoney = (population.filter(p => p.Saves_Money >= 0.5).length / population.length) * 100;
        const regularSaver = (population.filter(p => p.Regular_Saver >= 0.5).length / population.length) * 100;
        const oldAgePlanning = (population.filter(p => p.Old_Age_Planning >= 0.5).length / population.length) * 100;
        const diverseSavings = (population.filter(p => p.Diverse_Savings_Reasons >= 0.5).length / population.length) * 100;
        const savingsFreqAvg = (population.reduce((sum, p) => sum + (p.savings_frequency_numeric || 0), 0) / population.length);
        
        const baselineRate = (population.filter(p => p.Formally_Included >= 0.5).length / population.length) * 100;

        const roundValue = (val) => Math.round(val * 10) / 10;

        const baselineData = {
          // Demographics
          Education_Current: roundValue(educationAvg),
          Urbanization_Current: roundValue(urbanRate),
          
          // Economic
          Wealth_Current: roundValue(wealthAvg),
          Income_Current: roundValue(incomeAvg),
          
          // Savings Behavior
          Saves_Money_Current: roundValue(savesMoney),
          Regular_Saver_Current: roundValue(regularSaver),
          Old_Age_Planning_Current: roundValue(oldAgePlanning),
          Diverse_Savings_Current: roundValue(diverseSavings),
          Savings_Frequency_Current: roundValue(savingsFreqAvg),
          
          Baseline_Inclusion_Rate: roundValue(baselineRate),
        };

        setBaselineStats(baselineData);

        const policyInputsData = {
          // Demographics
          Education_Target: baselineData.Education_Current,
          Urbanization_Target: baselineData.Urbanization_Current,
          
          // Economic
          Wealth_Target: baselineData.Wealth_Current,
          Income_Target: baselineData.Income_Current,
          
          // Savings Behavior
          Savings_Promotion: false, // Toggle for savings promotion campaign
        };
        
        setPolicyInputs(policyInputsData);
        
      } catch (error) {
        console.error('Error calculating baseline stats:', error);
      }
    }
  }, [population]);

  // Simulate policy impact
  const policyResults = useMemo(() => {
    if (!population || !baselineStats || !policyInputs) return null;

    // Check if any policies have changed from baseline
    const hasChanges = 
      Math.abs(policyInputs.Education_Target - baselineStats.Education_Current) > 0.1 ||
      Math.abs(policyInputs.Wealth_Target - baselineStats.Wealth_Current) > 0.1 ||
      Math.abs(policyInputs.Income_Target - baselineStats.Income_Current) > 1000 ||
      Math.abs(policyInputs.Urbanization_Target - baselineStats.Urbanization_Current) > 1 ||
      policyInputs.Savings_Promotion === true;

    // If no policy changes, return baseline stats
    if (!hasChanges) {
      return {
        nationalRate: baselineStats.Baseline_Inclusion_Rate,
        baselineRate: baselineStats.Baseline_Inclusion_Rate,
        delta: 0,
        newlyIncluded: 0,
        predictions: [],
      };
    }

    // Apply policy changes and simulate
    const policyChanges = {
      Education_Target: policyInputs.Education_Target,
      Wealth_Target: policyInputs.Wealth_Target,
      Income_Target: policyInputs.Income_Target,
      Urbanization_Target: policyInputs.Urbanization_Target,
      Savings_Promotion: policyInputs.Savings_Promotion,
    };

    const results = predictPopulation(population, policyChanges);
    return {
      ...results,
      nationalRate: results.nationalRate * 100,
      baselineRate: baselineStats.Baseline_Inclusion_Rate,
      delta: (results.nationalRate * 100) - baselineStats.Baseline_Inclusion_Rate,
    };
  }, [population, baselineStats, policyInputs]);

  const updatePolicy = (key, value) => {
    setPolicyInputs(prev => ({ ...prev, [key]: value }));
  };

  const resetPolicies = () => {
    if (baselineStats) {
      setPolicyInputs({
        Education_Target: baselineStats.Education_Current,
        Urbanization_Target: baselineStats.Urbanization_Current,
        Wealth_Target: baselineStats.Wealth_Current,
        Income_Target: baselineStats.Income_Current,
        Savings_Promotion: false,
      });
    }
  };

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

  const impactColor = policyResults.delta >= 5 ? 'text-brand-green' : policyResults.delta >= 1 ? 'text-accent-primary' : 'text-text-secondary';
  const impactBg = policyResults.delta >= 5 ? 'from-brand-green to-green-400' : policyResults.delta >= 1 ? 'from-accent-primary to-accent-secondary' : 'from-gray-400 to-gray-500';

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Results Header */}
        <div className="bg-gradient-to-br from-white to-bg-secondary shadow-card-lg border border-border-light rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Baseline Rate */}
            <div className="text-center">
              <div className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-2">Current Rate</div>
              <div className="text-4xl font-bold text-text-primary">{policyResults.baselineRate.toFixed(1)}%</div>
              <div className="text-xs text-text-tertiary mt-1">Baseline inclusion</div>
            </div>

            {/* Projected Rate */}
            <div className="text-center">
              <div className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-2">Projected Rate</div>
              <div className={`text-4xl font-bold ${impactColor}`}>{policyResults.nationalRate.toFixed(1)}%</div>
              <div className="text-xs text-text-tertiary mt-1">After policy changes</div>
            </div>

            {/* Impact */}
            <div className="text-center">
              <div className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-2">Impact</div>
              <div className="flex items-center justify-center gap-2">
                {policyResults.delta > 0 ? (
                  <ArrowUp className={`w-6 h-6 ${impactColor}`} />
                ) : policyResults.delta < 0 ? (
                  <ArrowDown className="w-6 h-6 text-brand-red" />
                ) : null}
                <div className={`text-4xl font-bold ${impactColor}`}>
                  {policyResults.delta >= 0 ? '+' : ''}{policyResults.delta.toFixed(1)}pp
                </div>
              </div>
              <div className="text-xs text-text-tertiary mt-1">
                {policyResults.newlyIncluded.toLocaleString()} newly included
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="relative h-4 bg-border-light rounded-full overflow-hidden">
              <div 
                className={`absolute top-0 left-0 h-full bg-gradient-to-r ${impactBg} rounded-full transition-all duration-700`}
                style={{ width: `${policyResults.nationalRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Policy Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Education & Demographics */}
          <PolicyCard icon={GraduationCap} title="Education & Demographics" color="from-blue-500 to-cyan-500">
            <SliderPolicy
              label="Education Level"
              current={baselineStats.Education_Current.toFixed(1)}
              target={policyInputs.Education_Target.toFixed(1)}
              onChange={(val) => updatePolicy('Education_Target', val)}
              min={0}
              max={3}
              step={0.1}
              help="Average education level (0=None, 1=Primary, 2=Secondary, 3=Tertiary)"
            />
            
            <SliderPolicy
              label="Urbanization Rate"
              current={baselineStats.Urbanization_Current.toFixed(1)}
              target={policyInputs.Urbanization_Target.toFixed(1)}
              onChange={(val) => updatePolicy('Urbanization_Target', val)}
              min={0}
              max={100}
              step={1}
              unit="%"
              help="Percentage of population in urban areas"
            />
          </PolicyCard>

          {/* Economic Development */}
          <PolicyCard icon={DollarSign} title="Economic Development" color="from-green-500 to-emerald-500">
            <SliderPolicy
              label="Wealth Level"
              current={baselineStats.Wealth_Current.toFixed(1)}
              target={policyInputs.Wealth_Target.toFixed(1)}
              onChange={(val) => updatePolicy('Wealth_Target', val)}
              min={1}
              max={5}
              step={0.1}
              help="Average wealth quintile (1=Poorest, 5=Richest)"
            />
            
            <SliderPolicy
              label="Average Income"
              current={baselineStats.Income_Current.toFixed(0)}
              target={policyInputs.Income_Target.toFixed(0)}
              onChange={(val) => updatePolicy('Income_Target', val)}
              min={0}
              max={100000}
              step={1000}
              unit=" ₦"
              help="Average monthly income in Naira"
            />
          </PolicyCard>

          {/* Savings Behavior Promotion */}
          <PolicyCard icon={PiggyBank} title="Savings Behavior Promotion" color="from-purple-500 to-pink-500">
            <TogglePolicy
              label="Launch Savings Promotion Campaign"
              value={policyInputs.Savings_Promotion}
              onChange={(val) => updatePolicy('Savings_Promotion', val)}
              help="Promote savings behavior through financial literacy and incentives"
            />
            
            {policyInputs.Savings_Promotion && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="text-sm font-semibold text-purple-900 mb-2">Campaign Impact:</h4>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• 30% increase in people who save money</li>
                  <li>• 25% increase in regular savers</li>
                  <li>• 20% increase in diverse savings reasons</li>
                  <li>• 40% increase in old age planning</li>
                </ul>
              </div>
            )}
            
            <div className="mt-4 space-y-2">
              <div className="text-xs text-text-secondary">Current Savings Metrics:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-bg-secondary rounded">
                  <div className="text-text-tertiary">Saves Money</div>
                  <div className="font-semibold text-text-primary">{baselineStats.Saves_Money_Current}%</div>
                </div>
                <div className="p-2 bg-bg-secondary rounded">
                  <div className="text-text-tertiary">Regular Savers</div>
                  <div className="font-semibold text-text-primary">{baselineStats.Regular_Saver_Current}%</div>
                </div>
                <div className="p-2 bg-bg-secondary rounded">
                  <div className="text-text-tertiary">Old Age Planning</div>
                  <div className="font-semibold text-text-primary">{baselineStats.Old_Age_Planning_Current}%</div>
                </div>
                <div className="p-2 bg-bg-secondary rounded">
                  <div className="text-text-tertiary">Diverse Savings</div>
                  <div className="font-semibold text-text-primary">{baselineStats.Diverse_Savings_Current}%</div>
                </div>
              </div>
            </div>
          </PolicyCard>

          {/* Policy Insights */}
          <PolicyCard icon={Target} title="Policy Insights" color="from-orange-500 to-red-500">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-blue-900">Education Impact</div>
                    <div className="text-xs text-blue-700 mt-1">
                      Education has the highest coefficient (0.779). Increasing education levels will have the strongest impact on formal inclusion.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-green-900">Wealth Impact</div>
                    <div className="text-xs text-green-700 mt-1">
                      Wealth (0.764) is the second strongest predictor. Economic empowerment programs are highly effective.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start gap-2">
                  <PiggyBank className="w-4 h-4 text-purple-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-purple-900">Savings Behavior</div>
                    <div className="text-xs text-purple-700 mt-1">
                      Savings features have small coefficients. They work best in combination with education and economic policies.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PolicyCard>
        </div>

        {/* Reset Button */}
        <div className="flex justify-center">
          <button
            onClick={resetPolicies}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-border-medium rounded-xl text-text-primary font-medium hover:bg-bg-secondary hover:border-accent-primary transition-all shadow-sm hover:shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Current Baseline
          </button>
        </div>
      </div>
    </div>
  );
}
