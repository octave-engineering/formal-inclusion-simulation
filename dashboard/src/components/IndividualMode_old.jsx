import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, DollarSign, Smartphone, CreditCard, FileText, MapPin, Building2, UserCheck, Briefcase, Tractor, Wallet, Users, RotateCcw, Gauge } from 'lucide-react';

// Model coefficients from Logistic Regression (importance values)
const FEATURE_WEIGHTS = {
  'Education_Ordinal': 0.14851,
  'Income_Level_Ordinal': 0.00989,
  'Formal_Employment_Binary': 0.07810,
  'Agricultural_Income_Binary': 0.01204,
  'Business_Income_Binary': 0.05915,
  'Passive_Income_Binary': 0.03390,
  'Income_Diversity_Score': 0.01444,
  'Financial_Access_Index': 0.05609,
  'Access_Diversity_Score': 0.05609,
  'Mobile_Digital_Readiness': 0.11246,
  'Formal_ID_Count': 0.16307,
  'Bank_Account': 0.06597,
  'Gender_Male': 0.06512,
  'Age_18_Plus': 0.06887,
  'Sector_Urban': 0.05631,
};

const BASELINE_INCLUSION_RATE = 0.64;

// Survey average defaults from EFInA 2023 data
const SURVEY_DEFAULTS = {
  Education_Ordinal: 0.7,
  Income_Level_Ordinal: 6,
  Formal_Employment_Binary: 0,
  Agricultural_Income_Binary: 0,
  Business_Income_Binary: 0,
  Passive_Income_Binary: 0,
  Income_Diversity_Score: 0.6,
  Financial_Access_Index: 0.14,
  Access_Diversity_Score: 0.7,
  Mobile_Digital_Readiness: 1,
  Formal_ID_Count: 1.2,
  Bank_Account: 1,
  Gender_Male: 0,
  Age_18_Plus: 1,
  Sector_Urban: 1,
};

export default function IndividualMode({ onReset }) {
  const [inputs, setInputs] = useState(SURVEY_DEFAULTS);

  // Calculate prediction
  const prediction = useMemo(() => {
    const normalizeInputs = (inputValues) => ({
      Education_Ordinal: inputValues.Education_Ordinal / 3,
      Income_Level_Ordinal: inputValues.Income_Level_Ordinal / 19,
      Formal_Employment_Binary: inputValues.Formal_Employment_Binary,
      Agricultural_Income_Binary: inputValues.Agricultural_Income_Binary,
      Business_Income_Binary: inputValues.Business_Income_Binary,
      Passive_Income_Binary: inputValues.Passive_Income_Binary,
      Income_Diversity_Score: Math.min(inputValues.Income_Diversity_Score / 5, 1),
      Financial_Access_Index: inputValues.Financial_Access_Index,
      Access_Diversity_Score: inputValues.Access_Diversity_Score / 5,
      Mobile_Digital_Readiness: inputValues.Mobile_Digital_Readiness,
      Formal_ID_Count: inputValues.Formal_ID_Count / 2,
      Bank_Account: inputValues.Bank_Account,
      Gender_Male: inputValues.Gender_Male,
      Age_18_Plus: inputValues.Age_18_Plus,
      Sector_Urban: inputValues.Sector_Urban,
    });

    const calculateScore = (normalized) => {
      let score = 0;
      for (const [key, value] of Object.entries(normalized)) {
        score += value * FEATURE_WEIGHTS[key];
      }
      return score;
    };

    const baselineNormalized = normalizeInputs(SURVEY_DEFAULTS);
    const baselineScore = calculateScore(baselineNormalized);
    const currentNormalized = normalizeInputs(inputs);
    const currentScore = calculateScore(currentNormalized);
    const scoreDelta = currentScore - baselineScore;
    const sensitivity = 1.5;
    const probability = BASELINE_INCLUSION_RATE + (scoreDelta * sensitivity);
    
    return Math.max(0.05, Math.min(0.95, probability));
  }, [inputs]);

  // Feature contributions
  const featureContributions = useMemo(() => {
    const contributions = [];
    const normalized = {
      Education_Ordinal: inputs.Education_Ordinal / 3,
      Income_Level_Ordinal: inputs.Income_Level_Ordinal / 19,
      Formal_Employment_Binary: inputs.Formal_Employment_Binary,
      Agricultural_Income_Binary: inputs.Agricultural_Income_Binary,
      Business_Income_Binary: inputs.Business_Income_Binary,
      Passive_Income_Binary: inputs.Passive_Income_Binary,
      Income_Diversity_Score: Math.min(inputs.Income_Diversity_Score / 5, 1),
      Financial_Access_Index: inputs.Financial_Access_Index,
      Access_Diversity_Score: inputs.Access_Diversity_Score / 5,
      Mobile_Digital_Readiness: inputs.Mobile_Digital_Readiness,
      Formal_ID_Count: inputs.Formal_ID_Count / 2,
      Bank_Account: inputs.Bank_Account,
      Gender_Male: inputs.Gender_Male,
      Age_18_Plus: inputs.Age_18_Plus,
      Sector_Urban: inputs.Sector_Urban,
    };

    for (const [key, value] of Object.entries(normalized)) {
      contributions.push({
        name: key.replace(/_/g, ' '),
        value: (value * FEATURE_WEIGHTS[key] * 100).toFixed(1),
        fullValue: value * FEATURE_WEIGHTS[key],
      });
    }

    return contributions.sort((a, b) => b.fullValue - a.fullValue).slice(0, 10);
  }, [inputs]);

  const updateInput = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  const resetInputs = () => {
    setInputs(SURVEY_DEFAULTS);
    if (onReset) onReset();
  };

  const probabilityPercent = prediction * 100;
  const probabilityColor = prediction >= 0.7 ? 'text-brand-green' : prediction >= 0.5 ? 'text-accent-orange' : 'text-brand-red';
  const probabilityGradient = prediction >= 0.7 
    ? 'from-brand-green to-brand-green-dark' 
    : prediction >= 0.5 
    ? 'from-accent-orange to-yellow-600' 
    : 'from-brand-red to-brand-red-dark';

  return (
    <div className="flex-1 bg-bg-primary overflow-y-auto">
      <div className="max-w-7xl mx-auto animate-fade-in">
        
        {/* Hero KPI Section - Sticky on mobile */}
        <div className="sticky top-0 z-10 lg:relative lg:z-0 bg-gradient-to-br from-white to-bg-secondary shadow-lg lg:shadow-card-lg border-b lg:border border-border-light transition-all lg:rounded-2xl lg:mx-6 lg:mt-6 p-4 sm:p-6 lg:p-8 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-3 sm:mb-6">
            <div>
              <div className="text-xs sm:text-sm font-medium text-text-secondary uppercase tracking-wide mb-1 sm:mb-2">Formal Inclusion Rate</div>
              <div className="flex items-baseline gap-2 sm:gap-3">
                <div className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${probabilityColor} tracking-tight`}>
                  {probabilityPercent.toFixed(1)}%
                </div>
                <div className={`text-xs sm:text-sm font-medium ${probabilityColor}`}>
                  {prediction >= 0.7 ? 'High' : prediction >= 0.5 ? 'Moderate' : 'Low'}
                </div>
              </div>
            </div>
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary">
              <Gauge className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
          
          {/* Animated progress bar */}
          <div className="relative h-2 sm:h-3 bg-border-light rounded-full overflow-hidden">
            <div 
              className={`absolute top-0 left-0 h-full bg-gradient-to-r ${probabilityGradient} rounded-full transition-all duration-700 ease-out`}
              style={{ width: `${probabilityPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse-slow"></div>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 text-xs sm:text-sm">
            <p className="text-text-secondary text-center">
              A person with these characteristics has a <span className={`font-bold ${probabilityColor}`}>{probabilityPercent.toFixed(1)}%</span> likelihood of being formally included
            </p>
          </div>
        </div>

        {/* Input Controls Grid */}
        <div className="p-6 pt-4 lg:px-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Demographics */}
          <FeatureCard icon={<Users className="w-5 h-5" />} title="Demographics" color="from-blue-500 to-cyan-500">
            <SliderInput
              label="Education Level"
              value={inputs.Education_Ordinal}
              onChange={(v) => updateInput('Education_Ordinal', v)}
              min={0}
              max={3}
              step={1}
              labels={['None', 'Primary', 'Secondary', 'Tertiary']}
            />
            <ToggleInput
              label="Age 18+"
              value={inputs.Age_18_Plus}
              onChange={(v) => updateInput('Age_18_Plus', v)}
            />
            <ToggleInput
              label="Male Gender"
              value={inputs.Gender_Male}
              onChange={(v) => updateInput('Gender_Male', v)}
            />
            <ToggleInput
              label="Urban Sector"
              value={inputs.Sector_Urban}
              onChange={(v) => updateInput('Sector_Urban', v)}
            />
          </FeatureCard>

          {/* Financial Infrastructure */}
          <FeatureCard icon={<Building2 className="w-5 h-5" />} title="Financial Infrastructure" color="from-emerald-500 to-teal-500">
            <SliderInput
              label="Formal ID Count"
              value={inputs.Formal_ID_Count}
              onChange={(v) => updateInput('Formal_ID_Count', v)}
              min={0}
              max={2}
              step={1}
              labels={['None', 'One ID', 'Both IDs']}
            />
            <SliderInput
              label="Financial Access Index"
              value={inputs.Financial_Access_Index}
              onChange={(v) => updateInput('Financial_Access_Index', v)}
              min={0}
              max={1}
              step={0.1}
              percentage
            />
            <SliderInput
              label="Access Diversity (Channels)"
              value={inputs.Access_Diversity_Score}
              onChange={(v) => updateInput('Access_Diversity_Score', v)}
              min={0}
              max={5}
              step={1}
            />
            <ToggleInput
              label="Has Bank Account"
              value={inputs.Bank_Account}
              onChange={(v) => updateInput('Bank_Account', v)}
            />
          </FeatureCard>

          {/* Income & Employment */}
          <FeatureCard icon={<DollarSign className="w-5 h-5" />} title="Income & Employment" color="from-purple-500 to-indigo-500">
            <SliderInput
              label="Income Level"
              value={inputs.Income_Level_Ordinal}
              onChange={(v) => updateInput('Income_Level_Ordinal', v)}
              min={0}
              max={19}
              step={1}
            />
            <SliderInput
              label="Income Diversity Score"
              value={inputs.Income_Diversity_Score}
              onChange={(v) => updateInput('Income_Diversity_Score', v)}
              min={0}
              max={10}
              step={1}
            />
            <ToggleInput
              label="Formal Employment"
              value={inputs.Formal_Employment_Binary}
              onChange={(v) => updateInput('Formal_Employment_Binary', v)}
            />
            <ToggleInput
              label="Business Income"
              value={inputs.Business_Income_Binary}
              onChange={(v) => updateInput('Business_Income_Binary', v)}
            />
            <ToggleInput
              label="Agricultural Income"
              value={inputs.Agricultural_Income_Binary}
              onChange={(v) => updateInput('Agricultural_Income_Binary', v)}
            />
            <ToggleInput
              label="Passive Income"
              value={inputs.Passive_Income_Binary}
              onChange={(v) => updateInput('Passive_Income_Binary', v)}
            />
          </FeatureCard>

          {/* Digital Access */}
          <FeatureCard icon={<Smartphone className="w-5 h-5" />} title="Digital Access" color="from-pink-500 to-rose-500">
            <ToggleInput
              label="Mobile Digital Readiness"
              value={inputs.Mobile_Digital_Readiness}
              onChange={(v) => updateInput('Mobile_Digital_Readiness', v)}
              description="Has phone + reliable network"
            />
          </FeatureCard>

          {/* Feature Contributions Chart */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-card p-6 border border-border-light hover:shadow-card-hover transition-shadow">
            <h3 className="font-semibold text-text-primary mb-4">Top 10 Feature Contributions</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureContributions} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    formatter={(value) => `${value}%`}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {featureContributions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index < 3 ? '#6366f1' : index < 6 ? '#8b5cf6' : '#a78bfa'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={resetInputs}
            className="group flex items-center gap-2 px-6 py-3 bg-white border border-border-medium rounded-xl hover:border-accent-primary hover:bg-accent-primary-light hover:shadow-card transition-all font-medium text-text-primary"
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            Reset
          </button>
        </div>
        </div>

      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, color, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 border border-border-light hover:shadow-card-hover transition-shadow group">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${color} text-white group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <h3 className="font-semibold text-text-primary text-sm">{title}</h3>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

// Slider Input Component
function SliderInput({ label, value, onChange, min, max, step, labels, percentage }) {
  const displayValue = labels ? labels[value] : percentage ? `${(value * 100).toFixed(0)}%` : value;

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
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full accent-accent-primary"
      />
    </div>
  );
}

// Modern Toggle Component
function ToggleInput({ label, value, onChange, description }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-bg-secondary transition-colors">
      <div className="flex-1">
        <label className="text-xs font-medium text-text-primary cursor-pointer">{label}</label>
        {description && <div className="text-[10px] text-text-tertiary mt-0.5">{description}</div>}
      </div>
      <button
        onClick={() => onChange(value === 1 ? 0 : 1)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value === 1 ? 'bg-brand-green' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
            value === 1 ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
