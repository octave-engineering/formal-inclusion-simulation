import React from 'react';
import { BookOpen, TrendingUp, DollarSign, PiggyBank } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FEATURE_WEIGHTS } from '../utils/prediction_new';

export default function VariableInfo() {
  const baseFeatureKeys = [
    'gender_male',
    'education_numeric',
    'income_numeric',
    'wealth_numeric',
    'urban',
    'savings_frequency_numeric',
    'money_shortage_frequency',
    'Saves_Money',
    'Informal_Savings_Mode',
    'Regular_Saver',
    'Diverse_Savings_Reasons',
    'Old_Age_Planning',
    'Savings_Frequency_Score',
    'Savings_Behavior_Score',
    'Has_NIN',
    'Formal_Employment',
    'Business_Income',
    'Subsistence_Farming',
    'Commercial_Farming',
    'Passive_Income',
    'Family_Friends_Support',
    'Income_Diversity_Score',
    'Digital_Access_Index',
    'Infrastructure_Access_Index',
    'Subsist_x_Formal',
    'Subsist_x_Business',
    'Subsist_x_Urban',
  ];

  const baseFeatureImportance = baseFeatureKeys
    .map((key) => {
      const coefficient = FEATURE_WEIGHTS[key] || 0;
      return {
        feature: key,
        label: key,
        coefficient,
        absCoefficient: Math.abs(coefficient),
      };
    })
    .sort((a, b) => b.absCoefficient - a.absCoefficient);

  const VariableCard = ({ name, type, coefficient, range, description, policyRelevance, baseline }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-border-light hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-brand-purple">{name}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          Math.abs(coefficient) > 0.5 ? 'bg-brand-green text-white' : 
          Math.abs(coefficient) > 0.2 ? 'bg-accent-primary text-white' : 
          'bg-border-light text-text-secondary'
        }`}>
          {coefficient > 0 ? '+' : ''}{coefficient.toFixed(3)}
        </span>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-4 py-2 border-b border-border-light">
          <div>
            <span className="text-text-tertiary">Type:</span>
            <span className="ml-2 font-medium text-text-primary">{type}</span>
          </div>
          <div>
            <span className="text-text-tertiary">Range:</span>
            <span className="ml-2 font-medium text-text-primary">{range}</span>
          </div>
        </div>
        
        {baseline && (
          <div className="bg-bg-secondary px-3 py-2 rounded">
            <span className="text-text-tertiary text-xs">Baseline: </span>
            <span className="font-medium text-text-primary text-xs">{baseline}</span>
          </div>
        )}
        
        <div>
          <p className="font-semibold text-text-primary mb-1">Description:</p>
          <p className="text-text-secondary leading-relaxed">{description}</p>
        </div>
        
        <div>
          <p className="font-semibold text-text-primary mb-1">Policy Relevance:</p>
          <p className="text-text-secondary leading-relaxed">{policyRelevance}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-bg-primary overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">Model Variables Reference</h1>
          
        </header>

        {/* 1. Demographics */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-6 h-6 text-brand-purple" />
            <h2 className="text-2xl font-bold text-text-primary">Demographics</h2>
          </div>
          <p className="text-text-secondary mb-6 leading-relaxed">
            Demographic characteristics capture fundamental attributes that influence financial inclusion propensity.
            These variables represent innate or slowly-changing characteristics rather than outcomes of financial service usage.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VariableCard
              name="education_numeric"
              type="Ordinal"
              coefficient={0.779}
              range="0-3"
              baseline="Average: 1.65 (Between Primary and Secondary)"
              description="Highest level of formal education completed. 0 = No formal education, 1 = Primary school, 2 = Secondary school, 3 = Tertiary education (university/polytechnic). Education is the strongest predictor in the model, reflecting its role in enabling financial literacy, higher income potential, and ability to navigate formal financial systems."
              policyRelevance="Education expansion programs, particularly at secondary and tertiary levels, have multiplier effects on financial inclusion. Adult financial literacy programs can complement formal education for those who missed schooling opportunities."
            />
            
            <VariableCard
              name="gender_male"
              type="Binary"
              coefficient={0.200}
              range="0 or 1"
              baseline="50% Male, 50% Female"
              description="Gender of the respondent. 1 = Male, 0 = Female. This captures gender-based disparities in financial inclusion that persist across many African economies, stemming from differences in labor force participation, income levels, asset ownership, and cultural norms around financial decision-making."
              policyRelevance="Targeted interventions for women include women-focused savings groups, microfinance programs, gender-sensitive product design, and mobile money services that reduce mobility barriers for women who may face constraints in accessing physical bank branches."
            />
            
            <VariableCard
              name="urban"
              type="Binary"
              coefficient={0.137}
              range="0 or 1"
              baseline="36.6% Urban, 63.4% Rural"
              description="Geographic location type. 1 = Urban area, 0 = Rural area. This captures the urban-rural divide in access to financial infrastructure. Urban areas have significantly higher density of bank branches, ATMs, agent banking points, and mobile money agents, while rural areas face infrastructure gaps including poor road networks, limited electricity, and weak internet connectivity."
              policyRelevance="Closing the urban-rural gap requires targeted interventions including agent banking networks in rural areas, mobile money infrastructure expansion, postal banking services, and digital-first products that don't require physical branches. Government subsidies or mandates for rural service provision may be necessary to overcome market failures."
            />
            
            <VariableCard
              name="Age_numeric"
              type="Continuous"
              coefficient={0.093}
              range="18-80 years"
              baseline="Average: 37 years"
              description="Age of the respondent in years. Captures the life-cycle dimension of financial inclusion, as financial needs and capabilities evolve with age. Younger adults may lack income history or collateral; middle-aged adults are more likely to have stable employment and family responsibilities; older adults may have accumulated assets but face barriers in digital adoption."
              policyRelevance="Age-tailored financial products can improve inclusion: youth savings accounts and student loans for young adults, mortgage and insurance products for middle-aged households, and pension products plus senior-friendly digital interfaces for older adults."
            />
          </div>
        </section>

        {/* Feature Importance Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Which variables matter most?</h2>
          <p className="text-text-secondary mb-4 leading-relaxed text-sm">
            The chart below shows the relative strength of each of the 27 base drivers used in the model. Bars represent the
            absolute size of the coefficient (after standardisation). Longer bars indicate variables with stronger influence on
            the probability of being formally included.
          </p>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-border-light">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={baseFeatureImportance.slice(0, 12)}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 80, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => v.toFixed(2)} />
                  <YAxis
                    type="category"
                    dataKey="feature"
                    tick={{ fontSize: 10 }}
                    width={120}
                  />
                  <Tooltip
                    formatter={(value, name, props) => {
                      const coef = props.payload.coefficient;
                      return [coef.toFixed(3), 'Coefficient'];
                    }}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="absCoefficient" radius={[4, 4, 4, 4]}>
                    {baseFeatureImportance.slice(0, 12).map((entry, index) => (
                      <Cell
                        key={`cell-${entry.feature}-${index}`}
                        fill={entry.coefficient >= 0 ? '#16a34a' : '#dc2626'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs text-text-tertiary">
              Note: Green bars indicate variables that increase inclusion probability (positive coefficients), while red bars
              indicate variables that reduce it (negative coefficients). Scores are based on the same logistic regression used in
              the simulator.
            </p>
          </div>
        </section>

        {/* 2. Economic Status */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-6 h-6 text-brand-purple" />
            <h2 className="text-2xl font-bold text-text-primary">Economic Status</h2>
          </div>
          <p className="text-text-secondary mb-6 leading-relaxed">
            Economic variables measure financial capacity and stability. These indicators reflect the respondent's ability
            to engage with formal financial services based on wealth accumulation, income levels, and financial resilience.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VariableCard
              name="wealth_numeric"
              type="Ordinal"
              coefficient={0.764}
              range="1-5"
              baseline="Average: 2.69 (Lower-middle quintile)"
              description="Wealth quintile based on asset ownership index from the EFInA survey. 1 = Poorest quintile (bottom 20%), 5 = Richest quintile (top 20%). Calculated from ownership of assets including home, land, vehicles, appliances, and livestock. Wealth is the second-strongest predictor, reflecting that asset accumulation enables financial service engagement and indicates financial capability."
              policyRelevance="Wealth inequality reduction through pro-poor economic policies, social protection programs, and financial products designed for low-wealth segments (no-frills accounts, microfinance, asset-building programs). Linking government transfers to formal accounts can boost inclusion among lower wealth quintiles."
            />
            
            <VariableCard
              name="income_numeric"
              type="Continuous"
              coefficient={0.357}
              range="0-200,000 NGN"
              baseline="Average: 34,360 NGN/month"
              description="Average monthly income in Nigerian Naira. Reflects the respondent's cash flow and ability to save or pay for financial services. Income provides surplus beyond subsistence needs, ability to meet minimum balance requirements, and affordability of transaction costs. However, the relationship isn't perfectly linear—some high-income individuals remain unbanked by choice."
              policyRelevance="Income support programs, economic growth strategies to raise incomes generally, low/no-fee basic banking accounts for low-income users, and social protection programs that channel payments through formal accounts (combining financial inclusion with poverty reduction)."
            />
            
            <VariableCard
              name="runs_out_of_money"
              type="Binary"
              coefficient={0.243}
              range="0 or 1"
              baseline="66.3% run out of money before month end"
              description="Whether the respondent typically runs out of money before the end of the month. 1 = Yes (runs out), 0 = No (does not run out). This indicates financial stress and lack of a financial buffer. Surprisingly, running out of money is positively correlated with inclusion propensity, possibly because it signals need for formal savings tools and credit access to smooth consumption."
              policyRelevance="Financial planning and budgeting education, promotion of emergency savings accounts, access to short-term credit facilities to smooth income volatility, and employer-based savings programs with automatic deductions to build financial buffers."
            />
          </div>
        </section>

        {/* 3. Savings Frequency */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-brand-purple" />
            <h2 className="text-2xl font-bold text-text-primary">Savings Frequency</h2>
          </div>
          <p className="text-text-secondary mb-6 leading-relaxed">
            This variable captures the general habit of saving, regardless of whether savings are kept in formal or informal channels.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VariableCard
              name="savings_frequency_numeric"
              type="Ordinal"
              coefficient={0.205}
              range="0-5"
              baseline="Average: 1.01 (Occasional saver)"
              description="How often the respondent saves money. 0 = Never saves, 1 = Rarely, 2 = Occasionally, 3 = Sometimes, 4 = Frequently, 5 = Very frequently/regularly. This measures savings culture and discipline independent of where savings are held (could be informal savings groups, home, or formal accounts). Regular saving behavior indicates financial planning capability."
              policyRelevance="Savings mobilization campaigns, financial literacy programs emphasizing the importance of regular saving, workplace savings schemes with automatic deductions, and promotional incentives for regular savers (prize-linked savings accounts, matched savings programs)."
            />
          </div>
        </section>

        {/* 4. Savings Behavior */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <PiggyBank className="w-6 h-6 text-brand-purple" />
            <h2 className="text-2xl font-bold text-text-primary">Savings Behavior Indicators</h2>
          </div>
          <p className="text-text-secondary mb-6 leading-relaxed">
            Seven behavioral indicators that capture different dimensions of savings culture and financial planning.
            These variables measure propensity to save and plan financially, which strongly predicts readiness for formal financial inclusion.
            Note: Some negative coefficients suggest complex interactions with other variables or measurement artifacts.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VariableCard
              name="Saves_Money"
              type="Binary"
              coefficient={-0.005}
              range="0 or 1"
              baseline="12.5% saved in past 12 months"
              description="Whether the respondent saved any money in the past 12 months, through any method (formal bank, informal savings group, at home, etc.). This is the most basic savings behavior indicator, showing whether someone has surplus income and chooses to set aside funds rather than spend all income immediately."
              policyRelevance="Broad savings culture promotion, income support to create surplus for savings, and removing barriers to savings (account opening requirements, minimum balances, fees). Financial literacy campaigns emphasizing benefits of saving even small amounts."
            />
            
            <VariableCard
              name="Regular_Saver"
              type="Binary"
              coefficient={-0.004}
              range="0 or 1"
              baseline="10.0% are regular savers"
              description="Whether the respondent saves regularly and consistently (versus saving sporadically when extra money is available). Regular saving indicates financial discipline and planning capability. Regular savers are more likely to accumulate meaningful balances and benefit from formal savings products with features like interest compounding."
              policyRelevance="Automated savings mechanisms (standing orders, salary deductions, mobile money auto-save), commitment savings products that lock funds until a goal is reached, and savings challenges or clubs that create social accountability for regular saving."
            />
            
            <VariableCard
              name="Informal_Savings_Mode"
              type="Binary"
              coefficient={-0.007}
              range="0 or 1"
              baseline="7.4% use informal savings methods"
              description="Whether the respondent uses informal savings methods like rotating savings and credit associations (ROSCAs), known locally as 'esusu', 'ajo', or 'adashi'. These community-based savings groups are common in Nigeria. While informal, participation demonstrates savings discipline and can be a pathway to formal inclusion."
              policyRelevance="Programs to link informal savings groups with formal financial institutions, digital platforms for ROSCA management, microfinance institutions that work with savings groups, and products that formalize the benefits of group savings while adding security and interest earnings."
            />
            
            <VariableCard
              name="Diverse_Savings_Reasons"
              type="Binary"
              coefficient={0.035}
              range="0 or 1"
              baseline="7.2% save for multiple reasons"
              description="Whether the respondent saves for 2 or more different reasons (e.g., emergencies, education, business investment, old age, major purchases). Having diverse savings goals indicates sophisticated financial planning and forward-thinking behavior. It suggests the person thinks systematically about different future needs."
              policyRelevance="Goal-based savings products that allow multiple savings pockets within one account, financial planning education that encourages thinking about various life goals, and family financial planning services that help prioritize and allocate savings across multiple objectives."
            />
            
            <VariableCard
              name="Old_Age_Planning"
              type="Binary"
              coefficient={-0.044}
              range="0 or 1"
              baseline="28.5% have old-age plans"
              description="Whether the respondent has made any plan or preparation for old age/retirement (formal pension, informal savings, investment in assets, planned support from children, etc.). This long-term planning indicator shows future orientation and financial foresight. The negative coefficient may reflect that those with plans already have some formal mechanisms in place."
              policyRelevance="Pension system expansion and awareness campaigns, retirement savings products accessible to informal workers, financial literacy on importance of retirement planning, and micro-pension schemes with flexible contribution schedules for irregular income earners."
            />
            
            <VariableCard
              name="Savings_Frequency_Score"
              type="Continuous"
              coefficient={-0.006}
              range="0-5"
              baseline="Average: 0.36"
              description="A weighted composite score of savings frequency, calculated from multiple survey questions about how often and how much the respondent saves. This goes beyond simple frequency to capture intensity of savings behavior. Higher scores indicate more consistent and substantial saving patterns."
              policyRelevance="Tiered incentives that reward higher savings frequency (better interest rates for more frequent savers), gamification of savings with milestones and rewards, and nudges/reminders that encourage consistent saving behavior through mobile messaging."
            />
            
            <VariableCard
              name="Savings_Behavior_Score"
              type="Continuous"
              coefficient={-0.012}
              range="0-5"
              baseline="Average: 0.66"
              description="Overall composite score combining multiple dimensions of savings behavior including whether they save, how often, how much, for what purposes, and using what methods. This holistic measure captures the full spectrum of savings culture. It synthesizes information from all the individual savings indicators into a single behavioral profile."
              policyRelevance="Comprehensive savings promotion campaigns that address multiple dimensions simultaneously, financial capability assessments to identify gaps in savings behavior, and tailored interventions based on savings behavior profiles (e.g., helping occasional savers become regular savers, helping single-goal savers diversify objectives)."
            />
          </div>
        </section>

        {/* Model Interpretation Guide */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Understanding Model Coefficients</h2>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-border-light space-y-4">
            <div>
              <h3 className="font-semibold text-text-primary mb-2">Coefficient Interpretation</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Coefficients represent the strength and direction of each variable's impact on financial inclusion probability.
                Positive coefficients increase inclusion likelihood; negative coefficients decrease it. Larger absolute values
                indicate stronger effects. All variables are z-score normalized before applying coefficients, ensuring fair comparison.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border-light">
              <div className="text-center">
                <div className="inline-block px-4 py-2 bg-brand-green text-white rounded-full text-sm font-medium mb-2">
                  Strong (|coef| &gt; 0.5)
                </div>
                <p className="text-xs text-text-secondary">High predictive power</p>
              </div>
              <div className="text-center">
                <div className="inline-block px-4 py-2 bg-accent-primary text-white rounded-full text-sm font-medium mb-2">
                  Moderate (0.2-0.5)
                </div>
                <p className="text-xs text-text-secondary">Meaningful impact</p>
              </div>
              <div className="text-center">
                <div className="inline-block px-4 py-2 bg-border-light text-text-secondary rounded-full text-sm font-medium mb-2">
                  Weak (&lt; 0.2)
                </div>
                <p className="text-xs text-text-secondary">Minor influence</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border-light">
              <h3 className="font-semibold text-text-primary mb-2">Why Non-Circular Variables?</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                This model avoids "circular" variables that directly indicate existing formal inclusion (like bank account ownership,
                mobile money usage, or transactional account ownership). Instead, it focuses on characteristics that predict the
                <strong> propensity</strong> for financial inclusion—measuring who <em>would benefit from</em> formal services
                rather than who already has them. This makes the model more useful for policy interventions targeting the unbanked.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border-light pt-8 mt-12">
          <p className="text-sm text-text-secondary mb-2">
            <strong>Data Source:</strong> EFInA Access to Financial Services in Nigeria Survey 2023
          </p>
          <p className="text-sm text-text-secondary mb-2">
            <strong>Model Type:</strong> Logistic Regression with z-score normalization and sigmoid transformation
          </p>
          <p className="text-xs text-text-tertiary">
            Last updated: October 2024. Model trained on 85,341 samples with 15 non-circular predictors.
            For technical details, see model_coefficients.json and IMPLEMENTATION_SUMMARY.md in the project repository.
          </p>
        </footer>
      </div>
    </div>
  );
}