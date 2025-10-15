import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, DollarSign, TrendingUp, MapPin, Wallet, RotateCcw, Gauge, GraduationCap, Coins, PiggyBank, Info, AlertCircle } from 'lucide-react';
import { predictIndividual, SURVEY_DEFAULTS, FEATURE_WEIGHTS, FEATURE_ORDER, SCALER_MEAN, SCALER_SCALE } from '../utils/prediction_new';

const NIGERIAN_STATES = [
  "ABIA", "ADAMAWA", "AKWA-IBOM", "ANAMBRA", "BAUCHI", "BAYELSA", "BENUE", "BORNO",
  "CROSS RIVER", "DELTA", "EBONYI", "EDO", "EKITI", "ENUGU", "FCT ABUJA", "GOMBE",
  "IMO", "JIGAWA", "KADUNA", "KANO", "KATSINA", "KEBBI", "KOGI", "KWARA",
  "LAGOS", "NASARAWA", "NIGER", "OGUN", "ONDO", "OSUN", "OYO", "PLATEAU",
  "RIVERS", "SOKOTO", "TARABA", "YOBE", "ZAMFARA"
];

export default function IndividualMode({ onReset }) {
  const [inputs, setInputs] = useState({
    ...SURVEY_DEFAULTS,
    state: 'LAGOS' // Default state (not used in model, display only)
  });

  // Calculate prediction using the new model
  const prediction = useMemo(() => {
    return predictIndividual(inputs);
  }, [inputs]);

  // Saturation thresholds
  const SATURATION_HIGH = 0.85;  // 85% - approaching maximum
  const SATURATION_LOW = 0.15;   // 15% - approaching minimum

  // Determine saturation status
  const saturationStatus = useMemo(() => {
    if (prediction >= SATURATION_HIGH) {
      return {
        type: 'high',
        message: 'Near maximum likelihood - further improvements will have minimal effect',
        badge: 'Saturation Zone',
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-300'
      };
    } else if (prediction <= SATURATION_LOW) {
      return {
        type: 'low',
        message: 'Very low likelihood - improvements needed across multiple factors',
        badge: 'Low Probability Zone',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300'
      };
    }
    return null;
  }, [prediction]);

  const probabilityPercent = prediction * 100;
  const probabilityColor = prediction >= 0.7 ? 'text-brand-green' : prediction >= 0.5 ? 'text-accent-primary' : 'text-brand-red';
  const probabilityGradient = prediction >= 0.7 ? 'from-brand-green to-green-400' : prediction >= 0.5 ? 'from-accent-primary to-accent-secondary' : 'from-brand-red to-red-400';

  const updateInput = (key, value) => {
    setInputs(prev => {
      // Don't parse string values like age_group and state
      const parsedValue = (key === 'age_group' || key === 'state') ? value : parseFloat(value);
      const newInputs = { ...prev, [key]: parsedValue };
      
      // Prevent untoggling the last income source if income > 0 (silently)
      if ((key === 'Formal_Employment' || key === 'Business_Income' || key === 'Agricultural_Income' || key === 'Passive_Income') && value === 0 && newInputs.income_numeric > 0) {
        const incomeSources = (newInputs.Formal_Employment || 0) + (newInputs.Business_Income || 0) + (newInputs.Agricultural_Income || 0) + (newInputs.Passive_Income || 0);
        if (incomeSources === 0) {
          // Would result in zero sources - silently prevent it
          return prev; // Don't update
        }
      }
      
      // Prevent Income Diversity from being set to 0 when income > 0
      if (key === 'Income_Diversity_Score' && value === 0 && newInputs.income_numeric > 0) {
        // Silently prevent - income earners must have at least 1 diversity score
        return prev; // Don't update
      }
      
      // If Saves_Money is turned off, disable all dependent savings variables
      if (key === 'Saves_Money' && value === 0) {
        newInputs.Regular_Saver = 0;
        newInputs.Informal_Savings_Mode = 0;
        newInputs.Diverse_Savings_Reasons = 0;
        newInputs.Savings_Frequency_Score = 0;
        newInputs.Savings_Behavior_Score = 0;
        newInputs.savings_frequency_numeric = 0;
      }
      
      // If income is zero, disable income-related variables
      if (key === 'income_numeric' && parseFloat(value) === 0) {
        newInputs.Formal_Employment = 0;
        newInputs.Business_Income = 0;
        newInputs.Agricultural_Income = 0;
        newInputs.Passive_Income = 0;
        newInputs.Income_Diversity_Score = 0;
      }

      // If income is positive, ensure at least one income source is selected
      if (key === 'income_numeric' && parseFloat(value) > 0) {
        const anySource = (newInputs.Formal_Employment || 0) + (newInputs.Business_Income || 0) + (newInputs.Agricultural_Income || 0) + (newInputs.Passive_Income || 0) > 0;
        if (!anySource) {
          newInputs.Business_Income = 1; // sensible default
        }
        if ((newInputs.Income_Diversity_Score || 0) < 1) {
          newInputs.Income_Diversity_Score = 1;
        }
      }

      // Global guard: if income > 0 and all sources get toggled off, re-enable Business_Income
      if (key !== 'income_numeric' && (newInputs.income_numeric || 0) > 0) {
        const sourcesCount = (newInputs.Formal_Employment || 0) + (newInputs.Business_Income || 0) + (newInputs.Agricultural_Income || 0) + (newInputs.Passive_Income || 0);
        if (sourcesCount === 0) {
          newInputs.Business_Income = 1;
          if ((newInputs.Income_Diversity_Score || 0) < 1) newInputs.Income_Diversity_Score = 1;
        }
      }
      
      return newInputs;
    });
  };

  const resetToDefaults = () => {
    setInputs({
      ...SURVEY_DEFAULTS,
      state: 'LAGOS'
    });
  };

  // Feature contributions for visualization (as percentages)
  const featureContributions = useMemo(() => {
    const contributions = [];
    let totalAbsContribution = 0;
    
    // Calculate standardized values and contributions
    const features = [
      { name: 'Education Level', key: 'education_numeric', icon: GraduationCap, color: '#8b5cf6' },
      { name: 'Wealth Quintile', key: 'wealth_numeric', icon: Coins, color: '#f59e0b' },
      { name: 'Monthly Income', key: 'income_numeric', icon: DollarSign, color: '#10b981' },
      { name: 'Gender (Male)', key: 'gender_male', icon: Users, color: '#3b82f6' },
      { name: 'Urban Location', key: 'urban', icon: MapPin, color: '#ec4899' },
      { name: 'Has National ID (NIN)', key: 'Has_NIN', icon: Info, color: '#22c55e' },
      { name: 'Digital Access Index', key: 'Digital_Access_Index', icon: Gauge, color: '#06b6d4' },
      { name: 'Infrastructure Access', key: 'Infrastructure_Access_Index', icon: MapPin, color: '#f59e0b' },
      // { name: 'Mobility Index', key: 'Mobility_Index', icon: TrendingUp, color: '#8b5cf6' },  // COMMENTED OUT
      { name: 'Formally Employed', key: 'Formal_Employment', icon: Wallet, color: '#0ea5e9' },
      { name: 'Business Income', key: 'Business_Income', icon: DollarSign, color: '#16a34a' },
      { name: 'Agricultural Income', key: 'Agricultural_Income', icon: MapPin, color: '#65a30d' },
      { name: 'Passive Income', key: 'Passive_Income', icon: PiggyBank, color: '#a16207' },
      { name: 'Income Diversity', key: 'Income_Diversity_Score', icon: TrendingUp, color: '#2563eb' },
      { name: 'Age 25-34', key: 'age_25-34', icon: Users, color: '#6366f1' },
      { name: 'Age 35-44', key: 'age_35-44', icon: Users, color: '#6366f1' },
      { name: 'Age 45-54', key: 'age_45-54', icon: Users, color: '#6366f1' },
      { name: 'Age 55-64', key: 'age_55-64', icon: Users, color: '#6366f1' },
      { name: 'Age 65+', key: 'age_65+', icon: Users, color: '#6366f1' },
      { name: 'Money Shortage Frequency', key: 'money_shortage_frequency', icon: AlertCircle, color: '#f59e0b' },
      { name: 'Savings Frequency', key: 'savings_frequency_numeric', icon: TrendingUp, color: '#14b8a6' },
      { name: 'Saves Money', key: 'Saves_Money', icon: PiggyBank, color: '#14b8a6' },
      { name: 'Regular Saver', key: 'Regular_Saver', icon: Wallet, color: '#06b6d4' },
      { name: 'Old Age Planning', key: 'Old_Age_Planning', icon: TrendingUp, color: '#8b5cf6' },
    ];

    // First pass: calculate standardized contributions
    features.forEach(feature => {
      const weight = FEATURE_WEIGHTS[feature.key] || 0;
      const idx = FEATURE_ORDER.indexOf(feature.key);
      let standardized = 0;
      if (idx !== -1) {
        const value = inputs[feature.key] ?? 0;
        standardized = (value - SCALER_MEAN[idx]) / SCALER_SCALE[idx];
      }
      const contribution = weight * standardized;
      contributions.push({
        name: feature.name,
        rawContribution: contribution,
        absContribution: Math.abs(contribution),
        weight: weight,
        icon: feature.icon,
        color: feature.color
      });
      totalAbsContribution += Math.abs(contribution);
    });
    
    // Second pass: calculate percentages
    contributions.forEach(c => {
      c.percentContribution = totalAbsContribution > 0 ? (c.absContribution / totalAbsContribution) * 100 : 0;
      c.displayValue = c.percentContribution.toFixed(1) + '%';
    });
    
    // Sort by absolute contribution and take top 8
    return contributions.sort((a, b) => b.absContribution - a.absContribution).slice(0, 8);
  }, [inputs]);

  // Input component
  const SliderInput = ({ label, value, onChange, min, max, step, unit = '', help, disabled = false, formatValue }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className={`text-sm font-medium ${disabled ? 'text-text-tertiary' : 'text-text-primary'}`}>{label}</label>
        <span className={`text-sm font-semibold ${disabled ? 'text-text-tertiary' : 'text-accent-primary'}`}>
          {formatValue ? formatValue(value) : `${value}${unit}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className={`w-full h-2 bg-border-light rounded-lg appearance-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer accent-accent-primary'}`}
      />
      {help && <p className="text-xs text-text-tertiary">{help}</p>}
    </div>
  );

  const ToggleInput = ({ label, value, onChange, help, disabled = false, disabledMessage }) => {
    // Determine labels based on the input type
    const getLabels = () => {
      if (label === 'Gender') {
        return { on: 'Male', off: 'Female' };
      } else if (label === 'Location') {
        return { on: 'Urban', off: 'Rural' };
      } else {
        return { on: 'Yes', off: 'No' };
      }
    };

    const labels = getLabels();
    const isWider = label === 'Gender' || label === 'Location';

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className={`text-sm font-medium ${disabled ? 'text-text-tertiary' : 'text-text-primary'}`}>{label}</label>
          <button
            type="button"
            role="switch"
            aria-checked={value === 1}
            onClick={() => !disabled && onChange(value === 1 ? 0 : 1)}
            disabled={disabled}
            className={`relative inline-flex items-center ${isWider ? 'w-20' : 'w-16'} h-8 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              disabled ? 'opacity-50 cursor-not-allowed bg-border-light' : 
              value === 1 ? 'bg-brand-green focus:ring-brand-green cursor-pointer' : 'bg-border-medium focus:ring-accent-primary cursor-pointer'
            }`}
          >
            <span
              className={`absolute left-1.5 text-[9px] font-semibold tracking-wider ${
                value === 1 ? 'text-white' : 'text-white/70'
              }`}
            >{value === 1 ? labels.on : ''}</span>
            <span
              className={`absolute right-1.5 text-[9px] font-semibold tracking-wider ${
                value !== 1 ? 'text-white' : 'text-white/70'
              }`}
            >{value !== 1 ? labels.off : ''}</span>
            <span
              className={`inline-block w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                value === 1 ? (isWider ? 'translate-x-12' : 'translate-x-8') : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        {help && <p className="text-xs text-text-tertiary">{help}</p>}
        {disabled && (
          <p className="text-xs text-orange-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {disabledMessage || 'Enable "Saves Money" to adjust this variable'}
          </p>
        )}
      </div>
    );
  };

  const SelectInput = ({ label, value, onChange, options, help }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {help && <p className="text-xs text-text-tertiary">{help}</p>}
    </div>
  );

  const StateSelect = ({ label, value, onChange, options, help }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <select
        value={value}
        onChange={(e) => setInputs(prev => ({...prev, state: e.target.value}))}
        className="w-full px-3 py-2 bg-white border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
      >
        {options.map(state => (
          <option key={state} value={state}>{state}</option>
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
        {/* Hero KPI Section - Sticky */}
        <div className="sticky top-16 sm:top-[72px] md:top-[14px] z-20 bg-gradient-to-br from-white to-bg-secondary shadow-lg lg:shadow-card-lg border-b border-border-light transition-all lg:rounded-2xl lg:mx-6 lg:mt-6 p-4 sm:p-6 lg:p-8 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-3 sm:mb-6">
            <div className="flex-1">
              <div className="text-xs sm:text-sm font-medium text-text-secondary uppercase tracking-wide mb-1 sm:mb-2">Formal Inclusion Likelihood</div>
              <div className="flex items-baseline gap-2 sm:gap-3 mb-2">
                <div className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${probabilityColor} tracking-tight`}>
                  {probabilityPercent.toFixed(1)}%
                </div>
                <div className={`text-xs sm:text-sm font-medium ${probabilityColor}`}>
                  {prediction >= 0.7 ? 'High' : prediction >= 0.5 ? 'Moderate' : 'Low'}
                </div>
              </div>
              {/* State Display Badge */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-text-tertiary" />
                  <span className="text-xs sm:text-sm text-text-secondary">
                    <span className="font-semibold text-accent-primary">{inputs.state}</span> State
                    {inputs.urban === 1 ? ' (Urban)' : ' (Rural)'}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary">
              <Gauge className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
          
          {/* Saturation Warning */}
          {saturationStatus && (
            <div className={`mb-3 sm:mb-4 p-3 rounded-lg border ${saturationStatus.bgColor} ${saturationStatus.borderColor}`}>
              <div className="flex items-start gap-2">
                <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${saturationStatus.color}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold ${saturationStatus.color}`}>{saturationStatus.badge}</span>
                  </div>
                  <p className={`text-xs ${saturationStatus.color} leading-relaxed`}>
                    {saturationStatus.message}
                  </p>
                </div>
              </div>
            </div>
          )}
          
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
              help="Gender of the respondent"
            />
            
            <ToggleInput
              label="Location"
              value={inputs.urban}
              onChange={(val) => updateInput('urban', val)}
              help="Geographic location type"
            />
            
            <StateSelect
              label="State"
              value={inputs.state}
              options={NIGERIAN_STATES}
              help="State of residence (regional variations captured in model)"
            />
            
            <SelectInput
              label="Age Group"
              value={inputs.age_group}
              onChange={(val) => updateInput('age_group', val)}
              options={[
                { value: '18-24', label: '18-24 years' },
                { value: '25-34', label: '25-34 years' },
                { value: '35-44', label: '35-44 years' },
                { value: '45-54', label: '45-54 years' },
                { value: '55-64', label: '55-64 years' },
                { value: '65+', label: '65+ years' }
              ]}
              help="Age group category"
            />
          </FeatureCard>

          {/* Economic Status */}
          <FeatureCard icon={DollarSign} title="Economic Status" color="from-green-500 to-emerald-500">
            <SelectInput
              label="Wealth Quintile"
              value={inputs.wealth_numeric}
              onChange={(val) => updateInput('wealth_numeric', val)}
              options={[
                { value: 1, label: '1 - Poorest' },
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 4, label: '4' },
                { value: 5, label: '5 - Richest' }
              ]}
              help="Wealth is not the same as monthly income; it reflects long-run assets/living standards"
            />
            
            <SliderInput
              label="Monthly Income"
              value={inputs.income_numeric}
              onChange={(val) => updateInput('income_numeric', val)}
              min={0}
              max={200000}
              step={5000}
              formatValue={(val) => val >= 200000 ? '₦200,000 and above' : `₦${val.toLocaleString()}`}
              help="Average monthly income in Naira"
            />
            
            <SelectInput
              label="Money Shortage Frequency"
              value={inputs.money_shortage_frequency}
              onChange={(val) => updateInput('money_shortage_frequency', parseFloat(val))}
              options={[
                { value: 1, label: 'Never in past 12 months (Best)' },
                { value: 2, label: 'One month in the past year' },
                { value: 3, label: 'More than 1 month in the past year' },
                { value: 4, label: 'Monthly' }
              ]}
              help="How often have you run out of money and couldn't cover expenses? (Lower = Better financial stability)"
            />
          </FeatureCard>

          {/* Identity & Digital Access */}
          <FeatureCard icon={Info} title="Identity & Digital Access" color="from-cyan-500 to-sky-500">
            <ToggleInput
              label="Has National ID (NIN)"
              value={inputs.Has_NIN}
              onChange={(val) => updateInput('Has_NIN', val)}
              help="Do you have a National Identity Number (NIN) card?"
            />

            <SelectInput
              label="Digital Access Index"
              value={inputs.Digital_Access_Index}
              onChange={(val) => updateInput('Digital_Access_Index', val)}
              options={[
                { value: 0, label: 'No phone' },
                { value: 1, label: 'Phone only' },
                { value: 2, label: 'Phone and reliable network' }
              ]}
              help="0 = No phone, 1 = Phone only, 2 = Phone and reliable network"
            />

            <div className="space-y-2">
              <SliderInput
                label="Infrastructure Proximity Index"
                value={inputs.Infrastructure_Access_Index}
                onChange={(val) => updateInput('Infrastructure_Access_Index', val)}
                min={0}
                max={12}
                step={1}
                help="Number of nearby facilities accessible from your home"
              />
              <div className="bg-amber-50 border-l-4 border-amber-500 p-2 rounded-r-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <strong>What counts:</strong> Bank branch, ATM, financial agent, microfinance, provision shop, petrol station, pharmacy, restaurant, post office, mobile phone kiosk, mortgage bank, non-interest provider. 
                      <strong className="block mt-1">Impact:</strong> More nearby facilities = easier access to financial services = higher inclusion likelihood.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILITY INDEX - COMMENTED OUT */}
            {/* <div className="space-y-2">
              <SliderInput
                label="Mobility Index"
                value={inputs.Mobility_Index}
                onChange={(val) => updateInput('Mobility_Index', val)}
                min={1}
                max={6}
                step={1}
                help="How often do you visit places outside your home? (1=Very often, 6=Never)"
              />
              <div className="bg-purple-50 border-l-4 border-purple-500 p-2 rounded-r-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-purple-800 leading-relaxed">
                      <strong>What's measured:</strong> Visit frequency to urban centers, marketplaces, family, hospitals, community meetings, and overnight travel. 
                      <strong className="block mt-1">Impact:</strong> Lower values (more mobile) = better access to financial services. Highly mobile people (1-2) encounter more financial service points. National average is 3.8.
                    </p>
                  </div>
                </div>
              </div>
            </div> */}
          </FeatureCard>

          {/* Savings Behavior - Combined */}
          <div className="md:col-span-2 lg:col-span-1">
            <FeatureCard icon={PiggyBank} title="Savings Behavior" color="from-purple-500 to-pink-500">
              {/* Informal Savings Notice */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-blue-900 mb-1">About Savings Behavior</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      "Savings" in this model includes <strong>only informal methods</strong> (saving at home, esusu/ajo/adashi groups, family/friends, physical assets). 
                      Formal savings (bank accounts) are <strong>not</strong> included.
                      <strong className="block mt-1">Result:</strong> These variables have near-zero coefficients because informal savings don't strongly predict formal financial inclusion. However, they still indicate some financial discipline.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Master Toggle */}
              <ToggleInput
                label="Saves Money"
                value={inputs.Saves_Money}
                onChange={(val) => updateInput('Saves_Money', val)}
                help="Saved any money in past 12 months (any method)"
              />
              
              {/* Conditional Savings Details */}
              {inputs.Saves_Money === 1 ? (
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
                    help="Uses informal methods (esusu, ajo, adashi, or saving at home)"
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
                    help="Weighted composite of savings frequency"
                  />
                  
                  <SliderInput
                    label="Savings Behavior Score"
                    value={inputs.Savings_Behavior_Score}
                    onChange={(val) => updateInput('Savings_Behavior_Score', val)}
                    min={0}
                    max={5}
                    step={0.1}
                    help="Overall savings behavior composite (0-5)"
                  />
                </>
              ) : (
                <>
                </>
              )}
              
              {/* Old Age Planning - Independent */}
              <div className="pt-4 border-t border-border-light">
                <ToggleInput
                  label="Old Age Planning"
                  value={inputs.Old_Age_Planning}
                  onChange={(val) => updateInput('Old_Age_Planning', val)}
                  help="Has any plan for old age/retirement (formal pension, savings, assets, family support)"
                />
              </div>
            </FeatureCard>
          </div>

          {/* Employment & Income Sources */}
          <FeatureCard icon={Wallet} title="Employment & Income Sources" color="from-amber-500 to-orange-500">
            {/* Income Source Explanation */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg mb-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-900 mb-1">About Income Sources</p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Each toggle represents a <strong>type</strong> of income, not the number of jobs. A person can have multiple businesses but it's still one "Business Income" type. 
                    <strong className="block mt-1">Agricultural Income Effect:</strong> Base effect is negative (-0.30) due to irregular, cash-based income and limited access to financial infrastructure.
                    {/* <strong className="block mt-1">• Agricultural + Formal Employment:</strong> Small positive boost (+0.01) - formal job helps
                    <br/>• <strong>Agricultural + Business:</strong> Negative interaction (-0.06) - likely subsistence farmers
                    <br/>• <strong>Agricultural + Urban location:</strong> Negative (-0.05) - signals lower socioeconomic status
                    <br/>• <strong>Income Diversity Score</strong> (+0.25) also helps offset the penalty when multiple income types exist. */}
                  </p>
                </div>
              </div>
            </div>
            <ToggleInput
              label="Formally Employed"
              value={inputs.Formal_Employment}
              onChange={(val) => updateInput('Formal_Employment', val)}
              disabled={inputs.income_numeric === 0}
              disabledMessage="Set Monthly Income > 0 to adjust employment status"
              help="Earns salary/wages from government or company"
            />

            <ToggleInput
              label="Business Income"
              value={inputs.Business_Income}
              onChange={(val) => updateInput('Business_Income', val)}
              disabled={inputs.income_numeric === 0}
              disabledMessage="Set Monthly Income > 0 to adjust business income"
              help="Owns/operates a business or provides services"
            />

            <ToggleInput
              label="Agricultural Income"
              value={inputs.Agricultural_Income}
              onChange={(val) => updateInput('Agricultural_Income', val)}
              disabled={inputs.income_numeric === 0}
              disabledMessage="Set Monthly Income > 0 to adjust agricultural income"
              help="Income from farming/produce/livestock or agricultural inputs"
            />

            <ToggleInput
              label="Passive Income"
              value={inputs.Passive_Income}
              onChange={(val) => updateInput('Passive_Income', val)}
              disabled={inputs.income_numeric === 0}
              disabledMessage="Set Monthly Income > 0 to adjust passive income"
              help="Income from rent, pension, interest, or investments"
            />

            <SliderInput
              label="Income Diversity"
              value={inputs.Income_Diversity_Score}
              onChange={(val) => updateInput('Income_Diversity_Score', val)}
              min={inputs.income_numeric > 0 ? 1 : 0}
              max={5}
              step={1}
              disabled={inputs.income_numeric === 0}
              help={inputs.income_numeric > 0 ? "Number of active income sources (1–5+, minimum 1 when earning income)" : "Number of active income sources (0 when no income)"}
            />
          </FeatureCard>

          {/* Feature Contributions */}
          <div className="md:col-span-2 lg:col-span-1">
            <FeatureCard icon={TrendingUp} title="Top Contributing Factors" color="from-indigo-500 to-purple-500">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-border-light">
                  <span className="text-xs font-semibold text-text-primary">Factor</span>
                  <span className="text-xs font-semibold text-text-primary">% of Score</span>
                </div>
                {featureContributions.slice(0, 8).map((feature, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <feature.icon className="w-4 h-4 flex-shrink-0" style={{ color: feature.color }} />
                        <span className="text-xs font-medium text-text-primary truncate">{feature.name}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="text-xs font-bold text-accent-primary">{feature.displayValue}</span>
                        {feature.percentContribution < 2 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-border-light text-text-tertiary">Low impact</span>
                        )}
                      </div>
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
                <p className="text-xs text-text-tertiary mt-3 pt-3 border-t border-border-light">
                  <Info className="w-3 h-3 inline mr-1" />
                  Values show each factor's percentage contribution to your overall inclusion score. Higher percentages indicate stronger influence.
                </p>
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
            Reset
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
