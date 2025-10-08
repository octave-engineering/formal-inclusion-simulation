import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Building2, FileText, Target, ArrowUp, ArrowDown } from 'lucide-react';
import { predictPopulation } from '../utils/prediction';

export default function PolicyMode({ population, onLoadingChange }) {
  const [policyInputs, setPolicyInputs] = useState(null);
  const [baselineStats, setBaselineStats] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate baseline stats from population (real EFInA 2023 data)
  useEffect(() => {
    if (population && population.length > 0) {
      const tertiary = (population.filter(p => p.Education_Ordinal >= 2).length / population.length) * 100;
      const nin = (population.filter(p => p.Formal_ID_Count >= 1).length / population.length) * 100;
      const bankAcc = (population.filter(p => p.Bank_Account >= 0.5).length / population.length) * 100;
      const accessAvg = (population.reduce((sum, p) => sum + p.Financial_Access_Index, 0) / population.length) * 100;
      const baselineRate = (population.filter(p => p.Formally_Included >= 0.5).length / population.length) * 100;

      // Round to 1 decimal place for consistency
      const tertiaryRounded = Math.round(tertiary * 10) / 10;
      const ninRounded = Math.round(nin * 10) / 10;
      const bankAccRounded = Math.round(bankAcc * 10) / 10;
      const accessAvgRounded = Math.round(accessAvg * 10) / 10;

      setBaselineStats({
        Education_Tertiary_Current: tertiaryRounded,
        NIN_Coverage_Current: ninRounded,
        Bank_Account_Current: bankAccRounded,
        Financial_Access_Index_Current: accessAvgRounded,
        Baseline_Inclusion_Rate: Math.round(baselineRate * 10) / 10,
      });

      setPolicyInputs({
        Education_Tertiary_Target: tertiaryRounded,
        NIN_Coverage_Target: ninRounded,
        Bank_Account_Target: bankAccRounded,
        Financial_Access_Index_Target: accessAvgRounded,
      });
    }
  }, [population]);

  // Simulate policy impact
  const policyResults = useMemo(() => {
    if (!population || !baselineStats || !policyInputs || isCalculating) return null;

    // Check if any policies have changed from baseline (compare with 0.1% tolerance)
    const hasChanges = 
      Math.abs(policyInputs.Education_Tertiary_Target - baselineStats.Education_Tertiary_Current) > 0.05 ||
      Math.abs(policyInputs.NIN_Coverage_Target - baselineStats.NIN_Coverage_Current) > 0.05 ||
      Math.abs(policyInputs.Bank_Account_Target - baselineStats.Bank_Account_Current) > 0.05 ||
      Math.abs(policyInputs.Financial_Access_Index_Target - baselineStats.Financial_Access_Index_Current) > 0.05;

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
  }, [population, policyInputs, baselineStats, isCalculating]);

  const updatePolicy = (key, value) => {
    setPolicyInputs(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  const resetPolicies = () => {
    if (baselineStats) {
      setPolicyInputs({
        Education_Tertiary_Target: baselineStats.Education_Tertiary_Current,
        NIN_Coverage_Target: baselineStats.NIN_Coverage_Current,
        Bank_Account_Target: baselineStats.Bank_Account_Current,
        Financial_Access_Index_Target: baselineStats.Financial_Access_Index_Current,
      });
    }
  };

  if (!baselineStats || !policyInputs) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-powerbi-text-secondary">Loading population data...</div>
        </div>
      </div>
    );
  }

  const impactColor = policyResults && policyResults.delta >= 0 ? 'text-powerbi-success' : 'text-powerbi-danger';
  const impactBg = policyResults && policyResults.delta >= 0 ? 'bg-powerbi-success' : 'bg-powerbi-danger';

  return (
    <div className="flex-1 p-4 grid grid-cols-12 grid-rows-12 gap-4 overflow-hidden">
      
      {/* National Impact KPI */}
      <div className="col-span-4 row-span-3 bg-powerbi-card rounded-lg shadow-powerbi p-6 flex flex-col justify-center items-center">
        <div className="text-powerbi-text-secondary text-sm font-medium mb-2">PROJECTED NATIONAL INCLUSION RATE</div>
        <div className={`text-6xl font-bold ${impactColor} mb-2`}>
          {policyResults ? policyResults.nationalRate.toFixed(1) : baselineStats.Baseline_Inclusion_Rate.toFixed(1)}%
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="text-sm text-powerbi-text-secondary">Baseline: {baselineStats.Baseline_Inclusion_Rate.toFixed(1)}%</div>
          {policyResults && (
            <div className={`flex items-center gap-1 font-bold ${impactColor}`}>
              {policyResults.delta >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              {Math.abs(policyResults.delta).toFixed(1)}%
            </div>
          )}
        </div>
        {policyResults && (
          <div className="text-xs text-powerbi-text-secondary mt-3">
            ~{(policyResults.newlyIncluded / 1000).toFixed(1)}k people newly included
          </div>
        )}
      </div>

      {/* Policy Controls - Education */}
      <div className="col-span-4 row-span-3 bg-powerbi-card rounded-lg shadow-powerbi p-4">
        <h3 className="text-powerbi-text font-semibold mb-3 flex items-center gap-2">
          <FileText size={18} /> Education Policy
        </h3>
        <div className="space-y-3">
          <PolicySlider
            label="% with Tertiary Education"
            current={baselineStats.Education_Tertiary_Current}
            target={policyInputs.Education_Tertiary_Target}
            onChange={(v) => updatePolicy('Education_Tertiary_Target', v)}
            min={0}
            max={100}
          />
        </div>
      </div>

      {/* Policy Controls - ID & Banking */}
      <div className="col-span-4 row-span-3 bg-powerbi-card rounded-lg shadow-powerbi p-4">
        <h3 className="text-powerbi-text font-semibold mb-3 flex items-center gap-2">
          <Building2 size={18} /> Infrastructure Policy
        </h3>
        <div className="space-y-3">
          <PolicySlider
            label="% with NIN/BVN"
            current={baselineStats.NIN_Coverage_Current}
            target={policyInputs.NIN_Coverage_Target}
            onChange={(v) => updatePolicy('NIN_Coverage_Target', v)}
            min={0}
            max={100}
          />
          <PolicySlider
            label="% with Bank Account"
            current={baselineStats.Bank_Account_Current}
            target={policyInputs.Bank_Account_Target}
            onChange={(v) => updatePolicy('Bank_Account_Target', v)}
            min={0}
            max={100}
          />
        </div>
      </div>

      {/* Policy Controls - Financial Access */}
      <div className="col-span-4 row-span-3 bg-powerbi-card rounded-lg shadow-powerbi p-4">
        <h3 className="text-powerbi-text font-semibold mb-3 flex items-center gap-2">
          <Building2 size={18} /> Financial Access Policy
        </h3>
        <div className="space-y-3">
          <PolicySlider
            label="Avg Financial Access Index"
            current={baselineStats.Financial_Access_Index_Current}
            target={policyInputs.Financial_Access_Index_Target}
            onChange={(v) => updatePolicy('Financial_Access_Index_Target', v)}
            min={0}
            max={100}
          />
        </div>
      </div>

      {/* Reset Button */}
      <div className="col-span-4 row-span-2 bg-powerbi-card rounded-lg shadow-powerbi p-4 flex flex-col justify-center">
        <button
          onClick={resetPolicies}
          className="w-full px-4 py-3 bg-powerbi-primary text-white rounded hover:bg-powerbi-secondary transition font-medium"
        >
          Reset to Current Baseline
        </button>
        <div className="text-xs text-powerbi-text-secondary mt-2 text-center">
          Population: {population.length.toLocaleString()} respondents
        </div>
      </div>

      {/* Impact Breakdown */}
      <div className="col-span-4 row-span-4 bg-powerbi-card rounded-lg shadow-powerbi p-4">
        <h3 className="text-powerbi-text font-semibold mb-3">Policy Impact Breakdown</h3>
        <div className="space-y-2 text-sm">
          <ImpactRow
            label="Tertiary Education"
            baseline={baselineStats.Education_Tertiary_Current}
            target={policyInputs.Education_Tertiary_Target}
          />
          <ImpactRow
            label="ID Coverage"
            baseline={baselineStats.NIN_Coverage_Current}
            target={policyInputs.NIN_Coverage_Target}
          />
          <ImpactRow
            label="Bank Account"
            baseline={baselineStats.Bank_Account_Current}
            target={policyInputs.Bank_Account_Target}
          />
          <ImpactRow
            label="Financial Access"
            baseline={baselineStats.Financial_Access_Index_Current}
            target={policyInputs.Financial_Access_Index_Target}
          />
        </div>
      </div>

      {/* Summary Card */}
      <div className="col-span-4 row-span-4 bg-powerbi-card rounded-lg shadow-powerbi p-4">
        <h3 className="text-powerbi-text font-semibold mb-3">Scenario Summary</h3>
        {policyResults && (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-powerbi-text-secondary">Current National Rate</div>
              <div className="text-2xl font-bold text-powerbi-text">{baselineStats.Baseline_Inclusion_Rate.toFixed(1)}%</div>
            </div>
            <div className={`p-3 rounded ${policyResults.delta >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="text-xs text-powerbi-text-secondary">After Policy Changes</div>
              <div className={`text-2xl font-bold ${impactColor}`}>{policyResults.nationalRate.toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-xs text-powerbi-text-secondary">Net Impact</div>
              <div className="text-2xl font-bold text-powerbi-primary">{policyResults.delta >= 0 ? '+' : ''}{policyResults.delta.toFixed(1)}%</div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="text-xs text-powerbi-text-secondary">Estimated People Impacted</div>
              <div className="text-lg font-semibold text-powerbi-text">~{(policyResults.newlyIncluded / 1000).toFixed(1)}k</div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function PolicySlider({ label, current, target, onChange, min, max }) {
  const delta = target - current;
  const deltaColor = Math.abs(delta) < 0.05 ? 'text-powerbi-text-secondary' : delta > 0 ? 'text-powerbi-success' : 'text-powerbi-danger';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-powerbi-text">{label}</label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-powerbi-text-secondary">{current.toFixed(1)}%</span>
          <span className="text-xs text-powerbi-text">→</span>
          <span className="text-xs font-semibold text-powerbi-primary">{target.toFixed(1)}%</span>
          <span className={`text-xs font-semibold ${deltaColor}`}>
            ({delta > 0 ? '+' : ''}{delta.toFixed(1)})
          </span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.1}
        value={target}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-powerbi-primary"
      />
    </div>
  );
}

function ImpactRow({ label, baseline, target }) {
  const delta = target - baseline;
  const deltaColor = delta > 0 ? 'text-powerbi-success' : delta < 0 ? 'text-powerbi-danger' : 'text-powerbi-text-secondary';

  return (
    <div className="flex justify-between p-2 bg-gray-50 rounded">
      <span className="text-powerbi-text-secondary">{label}:</span>
      <span className={`font-semibold ${deltaColor}`}>
        {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
      </span>
    </div>
  );
}
