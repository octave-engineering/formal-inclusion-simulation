import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, Building2, GraduationCap, CreditCard, Landmark, ArrowUp, ArrowDown, RotateCcw, Sparkles } from 'lucide-react';
import { predictPopulation } from '../utils/prediction';

export default function PolicyMode({ population }) {
  const [policyInputs, setPolicyInputs] = useState(null);
  const [baselineStats, setBaselineStats] = useState(null);

  // Calculate baseline stats from population (real EFInA 2023 data)
  useEffect(() => {
    if (population && population.length > 0) {
      try {
        // Education: Data only has 0=No education, 1=Has education
        // For tertiary education policy, we use a realistic 8.7% baseline (Nigerian stats)
        const tertiary = 8.7;
      
      // IDs & Banking
      const nin = (population.filter(p => p.Formal_ID_Count >= 1).length / population.length) * 100;
      const bankAcc = (population.filter(p => p.Bank_Account >= 0.5).length / population.length) * 100;
      
      // Financial Access
      const accessAvg = (population.reduce((sum, p) => sum + p.Financial_Access_Index, 0) / population.length) * 100;
      const accessDiversity = (population.reduce((sum, p) => sum + p.Access_Diversity_Score, 0) / population.length);
      
      // Employment & Income
      const formalEmployment = (population.filter(p => p.Formal_Employment_Binary >= 0.5).length / population.length) * 100;
      const businessIncome = (population.filter(p => p.Business_Income_Binary >= 0.5).length / population.length) * 100;
      const agriculturalIncome = (population.filter(p => p.Agricultural_Income_Binary >= 0.5).length / population.length) * 100;
      const passiveIncome = (population.filter(p => p.Passive_Income_Binary >= 0.5).length / population.length) * 100;
      const incomeLevel = (population.reduce((sum, p) => sum + p.Income_Level_Ordinal, 0) / population.length);
      const incomeDiversity = (population.reduce((sum, p) => sum + p.Income_Diversity_Score, 0) / population.length);
      
      // Digital Access
      const digitalAccess = (population.filter(p => p.Mobile_Digital_Readiness >= 0.5).length / population.length) * 100;
      
      const baselineRate = (population.filter(p => p.Formally_Included >= 0.5).length / population.length) * 100;

      // Round to 1 decimal place for consistency
      const roundValue = (val) => Math.round(val * 10) / 10;

      const baselineData = {
        // Education
        Education_Tertiary_Current: roundValue(tertiary),
        
        // IDs & Banking
        NIN_Coverage_Current: roundValue(nin),
        Bank_Account_Current: roundValue(bankAcc),
        
        // Financial Access
        Financial_Access_Index_Current: roundValue(accessAvg),
        Access_Diversity_Current: roundValue(accessDiversity),
        
        // Employment & Income
        Formal_Employment_Current: roundValue(formalEmployment),
        Business_Income_Current: roundValue(businessIncome),
        Agricultural_Income_Current: roundValue(agriculturalIncome),
        Passive_Income_Current: roundValue(passiveIncome),
        Income_Level_Current: roundValue(incomeLevel),
        Income_Diversity_Current: roundValue(incomeDiversity),
        
        // Digital Access
        Digital_Access_Current: roundValue(digitalAccess),
        
        Baseline_Inclusion_Rate: roundValue(baselineRate),
      };

      setBaselineStats(baselineData);
      
      console.log('About to set policyInputs with Education_Tertiary_Current:', baselineData.Education_Tertiary_Current);

      const policyInputsData = {
        // Education
        Education_Tertiary_Target: baselineData.Education_Tertiary_Current,
        
        // IDs & Banking
        NIN_Coverage_Target: baselineData.NIN_Coverage_Current,
        Bank_Account_Target: baselineData.Bank_Account_Current,
        
        // Financial Access
        Financial_Access_Index_Target: baselineData.Financial_Access_Index_Current,
        Access_Diversity_Target: baselineData.Access_Diversity_Current,
        
        // Employment & Income
        Formal_Employment_Target: baselineData.Formal_Employment_Current,
        Business_Income_Target: baselineData.Business_Income_Current,
        Agricultural_Income_Target: baselineData.Agricultural_Income_Current,
        Passive_Income_Target: baselineData.Passive_Income_Current,
        Income_Level_Target: baselineData.Income_Level_Current,
        Income_Diversity_Target: baselineData.Income_Diversity_Current,
        
        // Digital Access
        Digital_Access_Target: baselineData.Digital_Access_Current,
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
      Math.abs(policyInputs.Education_Tertiary_Target - baselineStats.Education_Tertiary_Current) > 0.05 ||
      Math.abs(policyInputs.NIN_Coverage_Target - baselineStats.NIN_Coverage_Current) > 0.05 ||
      Math.abs(policyInputs.Bank_Account_Target - baselineStats.Bank_Account_Current) > 0.05 ||
      Math.abs(policyInputs.Financial_Access_Index_Target - baselineStats.Financial_Access_Index_Current) > 0.05 ||
      Math.abs(policyInputs.Access_Diversity_Target - baselineStats.Access_Diversity_Current) > 0.05 ||
      Math.abs(policyInputs.Formal_Employment_Target - baselineStats.Formal_Employment_Current) > 0.05 ||
      Math.abs(policyInputs.Business_Income_Target - baselineStats.Business_Income_Current) > 0.05 ||
      Math.abs(policyInputs.Agricultural_Income_Target - baselineStats.Agricultural_Income_Current) > 0.05 ||
      Math.abs(policyInputs.Passive_Income_Target - baselineStats.Passive_Income_Current) > 0.05 ||
      Math.abs(policyInputs.Income_Level_Target - baselineStats.Income_Level_Current) > 0.05 ||
      Math.abs(policyInputs.Income_Diversity_Target - baselineStats.Income_Diversity_Current) > 0.05 ||
      Math.abs(policyInputs.Digital_Access_Target - baselineStats.Digital_Access_Current) > 0.05;

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
      Education_Tertiary_Target: policyInputs.Education_Tertiary_Target / 100,
      Education_Tertiary_Current: baselineStats.Education_Tertiary_Current / 100,
      NIN_Coverage_Target: policyInputs.NIN_Coverage_Target / 100,
      NIN_Coverage_Current: baselineStats.NIN_Coverage_Current / 100,
      Bank_Account_Target: policyInputs.Bank_Account_Target / 100,
      Bank_Account_Current: baselineStats.Bank_Account_Current / 100,
      Financial_Access_Index_Target: policyInputs.Financial_Access_Index_Target / 100,
    };

    const results = predictPopulation(population, policyChanges);
    return {
      ...results,
      nationalRate: results.nationalRate * 100,
      baselineRate: baselineStats.Baseline_Inclusion_Rate,
      delta: (results.nationalRate * 100) - baselineStats.Baseline_Inclusion_Rate,
    };
  }, [population, policyInputs, baselineStats]);

  const updatePolicy = (key, value) => {
    setPolicyInputs(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  const resetPolicies = () => {
    if (baselineStats) {
      setPolicyInputs({
        // Education
        Education_Tertiary_Target: baselineStats.Education_Tertiary_Current,
        
        // IDs & Banking
        NIN_Coverage_Target: baselineStats.NIN_Coverage_Current,
        Bank_Account_Target: baselineStats.Bank_Account_Current,
        
        // Financial Access
        Financial_Access_Index_Target: baselineStats.Financial_Access_Index_Current,
        Access_Diversity_Target: baselineStats.Access_Diversity_Current,
        
        // Employment & Income
        Formal_Employment_Target: baselineStats.Formal_Employment_Current,
        Business_Income_Target: baselineStats.Business_Income_Current,
        Agricultural_Income_Target: baselineStats.Agricultural_Income_Current,
        Passive_Income_Target: baselineStats.Passive_Income_Current,
        Income_Level_Target: baselineStats.Income_Level_Current,
        Income_Diversity_Target: baselineStats.Income_Diversity_Current,
        
        // Digital Access
        Digital_Access_Target: baselineStats.Digital_Access_Current,
      });
    }
  };

  if (!baselineStats || !policyInputs || !population) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-primary">
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white animate-spin" />
          </div>
          <div className="text-text-primary font-medium mb-2">Loading Population Data</div>
          <div className="text-sm text-text-secondary">Processing 28,392 survey respondents...</div>
        </div>
      </div>
    );
  }

  const impactColor = policyResults && policyResults.delta >= 0 ? 'text-brand-green' : 'text-brand-red';
  const impactBgGradient = policyResults && policyResults.delta >= 0 
    ? 'from-brand-green-light to-green-50' 
    : 'from-brand-red-light to-red-50';

  // Prepare chart data
  const policyImpactData = [
    {
      policy: 'Education',
      baseline: baselineStats.Education_Tertiary_Current,
      target: policyInputs.Education_Tertiary_Target,
      delta: policyInputs.Education_Tertiary_Target - baselineStats.Education_Tertiary_Current,
    },
    {
      policy: 'ID Coverage',
      baseline: baselineStats.NIN_Coverage_Current,
      target: policyInputs.NIN_Coverage_Target,
      delta: policyInputs.NIN_Coverage_Target - baselineStats.NIN_Coverage_Current,
    },
    {
      policy: 'Bank Accounts',
      baseline: baselineStats.Bank_Account_Current,
      target: policyInputs.Bank_Account_Target,
      delta: policyInputs.Bank_Account_Target - baselineStats.Bank_Account_Current,
    },
    {
      policy: 'Financial Access',
      baseline: baselineStats.Financial_Access_Index_Current,
      target: policyInputs.Financial_Access_Index_Target,
      delta: policyInputs.Financial_Access_Index_Target - baselineStats.Financial_Access_Index_Current,
    },
  ];

  return (
    <div className="flex-1 bg-bg-primary p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        
        {/* Hero KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main KPI */}
          <div className="md:col-span-2 bg-gradient-to-br from-white to-bg-secondary rounded-2xl shadow-card-lg p-8 border border-border-light hover:shadow-card-hover transition-shadow">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-2">National Inclusion Rate</div>
                <div className="flex items-baseline gap-3">
                  <div className={`text-6xl font-bold ${impactColor} tracking-tight`}>
                    {policyResults ? policyResults.nationalRate.toFixed(1) : baselineStats.Baseline_Inclusion_Rate.toFixed(1)}%
                  </div>
                  {policyResults && Math.abs(policyResults.delta) > 0.05 && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${impactBgGradient} ${impactColor} font-semibold text-sm`}>
                      {policyResults.delta >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                      {Math.abs(policyResults.delta).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-accent-primary-light">
                <TrendingUp className="w-6 h-6 text-accent-primary" />
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="relative h-3 bg-border-light rounded-full overflow-hidden">
              <div 
                className={`absolute top-0 left-0 h-full bg-gradient-to-r ${policyResults && policyResults.delta >= 0 ? 'from-brand-green to-brand-green-dark' : 'from-brand-red to-brand-red-dark'} rounded-full transition-all duration-700 ease-out`}
                style={{ width: `${policyResults ? policyResults.nationalRate : baselineStats.Baseline_Inclusion_Rate}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse-slow"></div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-text-secondary">Baseline: <span className="font-semibold text-text-primary">{baselineStats.Baseline_Inclusion_Rate.toFixed(1)}%</span></span>
              {policyResults && policyResults.newlyIncluded > 0 && (
                <span className="text-brand-green font-medium">
                  +{(policyResults.newlyIncluded / 1000).toFixed(1)}k people newly included
                </span>
              )}
            </div>
          </div>

          {/* Population Info Card */}
          <div className="bg-white rounded-2xl shadow-card p-6 border border-border-light hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-accent-secondary/10">
                <Users className="w-5 h-5 text-accent-secondary" />
              </div>
              <h3 className="font-semibold text-text-primary">Population</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold text-text-primary">{population.length.toLocaleString()}</div>
                <div className="text-xs text-text-secondary">Survey Respondents</div>
              </div>
              <div className="pt-3 border-t border-border-light">
                <div className="text-lg font-semibold text-text-primary">{baselineStats.Baseline_Inclusion_Rate.toFixed(1)}%</div>
                <div className="text-xs text-text-secondary">Formally Included</div>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Controls Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Education Policy */}
          <PolicyCard
            icon={<GraduationCap className="w-5 h-5" />}
            title="Education Policy"
            color="from-purple-500 to-indigo-500"
          >
            <PolicySlider
              label="Population with Tertiary Education"
              current={baselineStats.Education_Tertiary_Current}
              target={policyInputs.Education_Tertiary_Target}
              onChange={(v) => updatePolicy('Education_Tertiary_Target', v)}
              min={0}
              max={100}
            />
          </PolicyCard>

          {/* ID & Banking Policy */}
          <PolicyCard
            icon={<CreditCard className="w-5 h-5" />}
            title="ID & Banking Policy"
            color="from-blue-500 to-cyan-500"
          >
            <PolicySlider
              label="Population with NIN/BVN"
              current={baselineStats.NIN_Coverage_Current}
              target={policyInputs.NIN_Coverage_Target}
              onChange={(v) => updatePolicy('NIN_Coverage_Target', v)}
              min={0}
              max={100}
            />
            <div className="mt-4">
              <PolicySlider
                label="Population with Bank Accounts"
                current={baselineStats.Bank_Account_Current}
                target={policyInputs.Bank_Account_Target}
                onChange={(v) => updatePolicy('Bank_Account_Target', v)}
                min={0}
                max={100}
              />
            </div>
          </PolicyCard>

          {/* Digital Access Policy */}
          <PolicyCard
            icon={<Building2 className="w-5 h-5" />}
            title="Digital Access Policy"
            color="from-pink-500 to-rose-500"
          >
            <PolicySlider
              label="Population with Digital Access"
              current={baselineStats.Digital_Access_Current}
              target={policyInputs.Digital_Access_Target}
              onChange={(v) => updatePolicy('Digital_Access_Target', v)}
              min={0}
              max={100}
            />
          </PolicyCard>

          {/* Financial Access Policy */}
          <PolicyCard
            icon={<Landmark className="w-5 h-5" />}
            title="Financial Access Policy"
            color="from-emerald-500 to-teal-500"
          >
            <PolicySlider
              label="Financial Access Index"
              current={baselineStats.Financial_Access_Index_Current}
              target={policyInputs.Financial_Access_Index_Target}
              onChange={(v) => updatePolicy('Financial_Access_Index_Target', v)}
              min={0}
              max={100}
            />
            <div className="mt-4">
              <PolicySlider
                label="Access Diversity Score"
                current={baselineStats.Access_Diversity_Current}
                target={policyInputs.Access_Diversity_Target}
                onChange={(v) => updatePolicy('Access_Diversity_Target', v)}
                min={0}
                max={5}
              />
            </div>
          </PolicyCard>

          {/* Employment Policy */}
          <PolicyCard
            icon={<Building2 className="w-5 h-5" />}
            title="Employment Policy"
            color="from-indigo-500 to-blue-600"
          >
            <PolicySlider
              label="Population with Formal Employment"
              current={baselineStats.Formal_Employment_Current}
              target={policyInputs.Formal_Employment_Target}
              onChange={(v) => updatePolicy('Formal_Employment_Target', v)}
              min={0}
              max={100}
            />
            <div className="mt-4">
              <PolicySlider
                label="Population with Business Income"
                current={baselineStats.Business_Income_Current}
                target={policyInputs.Business_Income_Target}
                onChange={(v) => updatePolicy('Business_Income_Target', v)}
                min={0}
                max={100}
              />
            </div>
            <div className="mt-4">
              <PolicySlider
                label="Population with Agricultural Income"
                current={baselineStats.Agricultural_Income_Current}
                target={policyInputs.Agricultural_Income_Target}
                onChange={(v) => updatePolicy('Agricultural_Income_Target', v)}
                min={0}
                max={100}
              />
            </div>
          </PolicyCard>

          {/* Income Policy */}
          <PolicyCard
            icon={<Users className="w-5 h-5" />}
            title="Income Policy"
            color="from-green-500 to-emerald-600"
          >
            <PolicySlider
              label="Population with Passive Income"
              current={baselineStats.Passive_Income_Current}
              target={policyInputs.Passive_Income_Target}
              onChange={(v) => updatePolicy('Passive_Income_Target', v)}
              min={0}
              max={100}
            />
            <div className="mt-4">
              <PolicySlider
                label="Average Income Level"
                current={baselineStats.Income_Level_Current}
                target={policyInputs.Income_Level_Target}
                onChange={(v) => updatePolicy('Income_Level_Target', v)}
                min={0}
                max={19}
              />
            </div>
            <div className="mt-4">
              <PolicySlider
                label="Income Diversity Score"
                current={baselineStats.Income_Diversity_Current}
                target={policyInputs.Income_Diversity_Target}
                onChange={(v) => updatePolicy('Income_Diversity_Target', v)}
                min={0}
                max={10}
              />
            </div>
          </PolicyCard>

          {/* Impact Visualization */}
          <div className="bg-white rounded-2xl shadow-card p-6 border border-border-light hover:shadow-card-hover transition-shadow">
            <h3 className="font-semibold text-text-primary mb-4">Policy Changes Overview</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={policyImpactData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="policy" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => `${value.toFixed(1)}%`}
                  />
                  <Bar dataKey="delta" radius={[6, 6, 0, 0]}>
                    {policyImpactData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.delta > 0.05 ? '#10b981' : entry.delta < -0.05 ? '#ef4444' : '#9ca3af'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-center">
          <button
            onClick={resetPolicies}
            className="group flex items-center gap-2 px-6 py-3 bg-white border border-border-medium rounded-xl hover:border-accent-primary hover:bg-accent-primary-light hover:shadow-card transition-all font-medium text-text-primary"
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            Reset to Current Baseline
          </button>
        </div>

      </div>
    </div>
  );
}

// Policy Card Component
function PolicyCard({ icon, title, color, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-border-light hover:shadow-card-hover transition-shadow group">
      <div className="flex items-center gap-3 mb-5">
        <div className={`p-2.5 rounded-lg bg-gradient-to-br ${color} bg-opacity-10 text-white group-hover:scale-110 transition-transform`}>
          <div className={`bg-gradient-to-br ${color} bg-clip-text text-transparent`}>
            {icon}
          </div>
        </div>
        <h3 className="font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

// Simple Policy Slider Component
function PolicySlider({ label, current = 0, target = 0, onChange, min, max }) {
  // Safety check - ensure we have valid numbers
  const safeTarget = typeof target === 'number' && !isNaN(target) ? target : current;
  const safeCurrent = typeof current === 'number' && !isNaN(current) ? current : 0;
  
  const displayValue = max <= 20 ? safeTarget.toFixed(1) : `${safeTarget.toFixed(1)}%`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text-primary">{label}</label>
        <span className="text-xs font-semibold text-text-primary bg-bg-secondary px-2 py-0.5 rounded">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.1}
        value={safeTarget}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-accent-primary"
      />
    </div>
  );
}
