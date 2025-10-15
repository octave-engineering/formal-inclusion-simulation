import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, DollarSign, TrendingUp, MapPin, Wallet, RotateCcw, Gauge, GraduationCap, Coins, PiggyBank } from 'lucide-react';
import { predictIndividual, SURVEY_DEFAULTS, FEATURE_WEIGHTS } from '../utils/prediction';

export default function IndividualMode({ onReset }) {
  const [inputs, setInputs] = useState(SURVEY_DEFAULTS);

  // Calculate prediction using the new model
  const prediction = useMemo(() => {
    return predictIndividual(inputs);
  }, [inputs]);

  const probabilityPercent = prediction * 100;
  const probabilityColor = prediction >= 0.7 ? 'text-brand-green' : prediction >= 0.5 ? 'text-accent-primary' : 'text-brand-red';
  const probabilityGradient = prediction >= 0.7 ? 'from-brand-green to-green-400' : prediction >= 0.5 ? 'from-accent-primary to-accent-secondary' : 'from-brand-red to-red-400';

  const updateInput = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  const resetToDefaults = () => {
    setInputs(SURVEY_DEFAULTS);
  };

  // Feature contributions for visualization
  const featureContributions = useMemo(() => {
    const contributions = [];
    
    // Calculate standardized values and contributions
    const features = [
      { name: 'Education', key: 'education_numeric', icon: GraduationCap, color: '#8b5cf6' },
      { name: 'Wealth', key: 'wealth_numeric', icon: Coins, color: '#f59e0b' },
      { name: 'Income', key: 'income_numeric', icon: DollarSign, color: '#10b981' },
      { name: 'Gender (Male)', key: 'gender_male', icon: Users, color: '#3b82f6' },
      { name: 'Urban', key: 'urban', icon: MapPin, color: '#ec4899' },
      { name: 'Age', key: 'Age_numeric', icon: Users, color: '#6366f1' },
      { name: 'Saves Money', key: 'Saves_Money', icon: PiggyBank, color: '#14b8a6' },
      { name: 'Regular Saver', key: 'Regular_Saver', icon: Wallet, color: '#06b6d4' },
      { name: 'Old Age Planning', key: 'Old_Age_Planning', icon: TrendingUp, color: '#8b5cf6' },
    ];

    features.forEach(feature => {
      const weight = FEATURE_WEIGHTS[feature.key] || 0;
      const value = inputs[feature.key] || 0;
      const contribution = weight * value;
      
      contributions.push({
        name: feature.name,
        contribution: contribution * 100,
        weight: weight,
        icon: feature.icon,
        color: feature.color
      });
    });

    return contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 8);
  }, [inputs]);

  // Input component
  const SliderInput = ({ label, value, onChange, min, max, step, unit = '', help }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <span className="text-sm font-semibold text-accent-primary">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-border-light rounded-lg appearance-none cursor-pointer accent-accent-primary"
      />
      {help && <p className="text-xs text-text-tertiary">{help}</p>}
    </div>
  );

  const ToggleInput = ({ label, value, onChange, help }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <button
          onClick={() => onChange(value === 1 ? 0 : 1)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            value === 1 
              ? 'bg-accent-primary text-white' 
              : 'bg-border-light text-text-secondary hover:bg-border-medium'
          }`}
        >
          {value === 1 ? 'Yes' : 'No'}
        </button>
      </div>
      {help && <p className="text-xs text-text-tertiary">{help}</p>}
    </div>
  );

  const SelectInput = ({ label, value, onChange, options, help }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full px-3 py-2 bg-white border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {help && <p className="text-xs text-text-tertiary">{help}</p>}
    </div>
  );

  const FeatureCard = ({ icon: Icon, title, color, children }) => (
    <div className="bg-white rounded-xl shadow-card border border-border-light p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-semibold text-text-primary text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto">
        {/* Hero KPI Section - Sticky on mobile */}
        <div className="sticky top-0 z-10 lg:relative lg:z-0 bg-gradient-to-br from-white to-bg-secondary shadow-lg lg:shadow-card-lg border-b lg:border border-border-light transition-all lg:rounded-2xl lg:mx-6 lg:mt-6 p-4 sm:p-6 lg:p-8 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-3 sm:mb-6">
            <div>
              <div className="text-xs sm:text-sm font-medium text-text-secondary uppercase tracking-wide mb-1 sm:mb-2">Formal Inclusion Likelihood</div>
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
          <FeatureCard icon={Users} title="Demographics" color="from-blue-500 to-cyan-500">
            <SelectInput
              label="Education Level"
              value={inputs.education_numeric}
              onChange={(val) => updateInput('education_numeric', val)}
              options={[
                { value: 0, label: 'No Education' },
                { value: 1, label: 'Primary' },
                { value: 2, label: 'Secondary' },
                { value: 3, label: 'Tertiary' }
              ]}
              help="Highest level of education completed"
            />
            
            <ToggleInput
              label="Gender"
              value={inputs.gender_male}
              onChange={(val) => updateInput('gender_male', val)}
              help={inputs.gender_male === 1 ? 'Male' : 'Female'}
            />
            
            <ToggleInput
              label="Location"
              value={inputs.urban}
              onChange={(val) => updateInput('urban', val)}
              help={inputs.urban === 1 ? 'Urban area' : 'Rural area'}
            />
            
            <SliderInput
              label="Age"
              value={inputs.Age_numeric}
              onChange={(val) => updateInput('Age_numeric', val)}
              min={18}
              max={80}
              step={1}
              unit=" years"
              help="Age in years"
            />
          </FeatureCard>

          {/* Economic Status */}
          <FeatureCard icon={DollarSign} title="Economic Status" color="from-green-500 to-emerald-500">
            <SliderInput
              label="Wealth Quintile"
              value={inputs.wealth_numeric}
              onChange={(val) => updateInput('wealth_numeric', val)}
              min={1}
              max={5}
              step={1}
              help="1 = Poorest, 5 = Richest"
            />
            
            <SliderInput
              label="Monthly Income"
              value={inputs.income_numeric}
              onChange={(val) => updateInput('income_numeric', val)}
              min={0}
              max={200000}
              step={5000}
              unit=" ₦"
              help="Average monthly income in Naira"
            />
            
            <ToggleInput
              label="Runs Out of Money"
              value={inputs.runs_out_of_money}
              onChange={(val) => updateInput('runs_out_of_money', val)}
              help={inputs.runs_out_of_money === 1 ? 'Often runs out' : 'Rarely runs out'}
            />
          </FeatureCard>

          {/* Savings Behavior - Part 1 */}
          <FeatureCard icon={PiggyBank} title="Savings Behavior" color="from-purple-500 to-pink-500">
            <SliderInput
              label="Savings Frequency"
              value={inputs.savings_frequency_numeric}
              onChange={(val) => updateInput('savings_frequency_numeric', val)}
              min={0}
              max={5}
              step={1}
              help="0 = Never, 5 = Very frequently"
            />
            
            <ToggleInput
              label="Saves Money"
              value={inputs.Saves_Money}
              onChange={(val) => updateInput('Saves_Money', val)}
              help={inputs.Saves_Money === 1 ? 'Saved in past 12 months' : 'Did not save'}
            />
            
            <ToggleInput
              label="Regular Saver"
              value={inputs.Regular_Saver}
              onChange={(val) => updateInput('Regular_Saver', val)}
              help={inputs.Regular_Saver === 1 ? 'Saves regularly' : 'Saves occasionally'}
            />
            
            <ToggleInput
              label="Informal Savings"
              value={inputs.Informal_Savings_Mode}
              onChange={(val) => updateInput('Informal_Savings_Mode', val)}
              help={inputs.Informal_Savings_Mode === 1 ? 'Uses informal methods' : 'No informal savings'}
            />
          </FeatureCard>

          {/* Savings Behavior - Part 2 */}
          <FeatureCard icon={Wallet} title="Financial Planning" color="from-orange-500 to-red-500">
            <ToggleInput
              label="Diverse Savings Reasons"
              value={inputs.Diverse_Savings_Reasons}
              onChange={(val) => updateInput('Diverse_Savings_Reasons', val)}
              help={inputs.Diverse_Savings_Reasons === 1 ? 'Saves for 2+ reasons' : 'Single/no reason'}
            />
            
            <ToggleInput
              label="Old Age Planning"
              value={inputs.Old_Age_Planning}
              onChange={(val) => updateInput('Old_Age_Planning', val)}
              help={inputs.Old_Age_Planning === 1 ? 'Has plan for old age' : 'No old age plan'}
            />
            
            <SliderInput
              label="Savings Frequency Score"
              value={inputs.Savings_Frequency_Score}
              onChange={(val) => updateInput('Savings_Frequency_Score', val)}
              min={0}
              max={5}
              step={1}
              help="Weighted savings frequency (0-5)"
            />
            
            <SliderInput
              label="Savings Behavior Score"
              value={inputs.Savings_Behavior_Score}
              onChange={(val) => updateInput('Savings_Behavior_Score', val)}
              min={0}
              max={5}
              step={1}
              help="Composite savings behavior (0-5)"
            />
          </FeatureCard>

          {/* Feature Contributions */}
          <div className="md:col-span-2 lg:col-span-1">
            <FeatureCard icon={TrendingUp} title="Top Contributing Factors" color="from-indigo-500 to-purple-500">
              <div className="space-y-2">
                {featureContributions.slice(0, 6).map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 flex-1">
                      <feature.icon className="w-3 h-3" style={{ color: feature.color }} />
                      <span className="text-text-secondary truncate">{feature.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-border-light rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(Math.abs(feature.contribution) * 10, 100)}%`,
                            backgroundColor: feature.contribution >= 0 ? '#10b981' : '#ef4444'
                          }}
                        />
                      </div>
                      <span className={`text-xs font-medium w-12 text-right ${feature.contribution >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                        {feature.contribution >= 0 ? '+' : ''}{feature.contribution.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </FeatureCard>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-border-medium rounded-xl text-text-primary font-medium hover:bg-bg-secondary hover:border-accent-primary transition-all shadow-sm hover:shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Survey Averages
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
