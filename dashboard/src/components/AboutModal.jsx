import React, { useEffect } from 'react';
import { Info, Users, Target, BarChart2, X } from 'lucide-react';

export default function AboutModal({ onClose }) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const baseDrivers = [
    {
      name: 'National ID',
      influence: 'High driver',
      description:
        'Whether the respondent has a National Identification Number or equivalent government-issued ID, which is often required to open and use formal financial accounts.',
    },
    {
      name: 'Digital access index',
      influence: 'High driver',
      description:
        'Composite index summarising access to a mobile phone, network coverage and basic digital readiness needed to use mobile money, agents and other digital financial services.',
    },
    {
      name: 'Education level',
      influence: 'High driver',
      description:
        'Highest level of formal education completed, from no schooling through primary, secondary and tertiary, capturing financial literacy and capability to navigate formal systems.',
    },
    {
      name: 'Wealth quintile',
      influence: 'Medium driver',
      description:
        'Asset-based wealth position (from poorest to richest quintile) based on ownership of housing, durable goods and productive assets, which reflects long-term economic capacity.',
    },
    {
      name: 'Financial infrastructure access index',
      influence: 'Medium driver',
      description:
        'Availability of nearby financial service points such as bank branches, ATMs and agents, capturing how easy it is for the respondent to physically reach formal services.',
    },
    {
      name: 'Subsistence farming',
      influence: 'Medium driver',
      description:
        'Whether the respondent relies mainly on subsistence agriculture, typically associated with low cash income, rural locations and weaker links to formal finance.',
    },
    {
      name: 'Urban location',
      influence: 'Medium driver',
      description:
        'Whether the respondent lives in an urban rather than rural area, proxying better proximity to jobs, infrastructure and financial service points.',
    },
    {
      name: 'Family and friends support',
      influence: 'Medium driver',
      description:
        'Whether the respondent mainly relies on informal support from family or friends when short of money, which can sometimes substitute for formal financial services.',
    },
    {
      name: 'Income diversity score',
      influence: 'Low driver',
      description:
        'How many distinct sources of income the respondent has (wages, business, farming, remittances, etc.), indicating resilience to shocks and ability to smooth consumption.',
    },
    {
      name: 'Gender (male)',
      influence: 'Low driver',
      description:
        'Gender of the respondent (1 = male, 0 = female), capturing persistent gender gaps in access to jobs, assets and financial services.',
    },
    {
      name: 'Monthly income',
      influence: 'Low driver',
      description:
        'Average monthly income in Nigerian Naira, reflecting the respondent’s cash flow and ability to meet fees, minimum balances and saving thresholds.',
    },
    {
      name: 'Commercial farming',
      influence: 'Low driver',
      description:
        'Whether the respondent engages in market-oriented/commercial farming rather than purely subsistence agriculture.',
    },
    {
      name: 'Passive income',
      influence: 'Low driver',
      description:
        'Whether the respondent earns income from rent, dividends, interest or other passive sources that typically arise from asset ownership.',
    },
    {
      name: 'Subsistence × business interaction',
      influence: 'Low driver',
      description:
        'Interaction term flagging respondents who combine subsistence farming with non-farm business activity, capturing mixed livelihood strategies.',
    },
    {
      name: 'Subsistence × urban interaction',
      influence: 'Low driver',
      description:
        'Interaction term for subsistence farmers living in urban areas, where farming is present but not the only economic activity.',
    },
    {
      name: 'Business income',
      influence: 'Low driver',
      description:
        'Whether the respondent earns income from self-employment or a non-farm business, reflecting entrepreneurship and exposure to formal payments.',
    },
    {
      name: 'Money shortage frequency',
      influence: 'Low driver',
      description:
        'How often the respondent runs out of money before month end, indicating financial stress and volatility that may create demand for savings and credit tools.',
    },
    {
      name: 'Subsistence × formal employment',
      influence: 'Low driver',
      description:
        'Interaction term for respondents who both farm for subsistence and hold a formal wage or salary job.',
    },
    {
      name: 'Formal employment',
      influence: 'Low driver',
      description:
        'Whether the respondent has a formal wage or salary job, typically associated with regular pay, documentation and easier onboarding to formal finance.',
    },
    {
      name: 'Savings behaviour score',
      influence: 'Low driver',
      description:
        'Composite score summarising how often and for what purposes the respondent saves, across both formal and informal channels.',
    },
    {
      name: 'Old-age planning',
      influence: 'Low driver',
      description:
        'Whether the respondent reports any plan or preparation for old age or retirement (pensions, savings, assets, support from children, etc.).',
    },
    {
      name: 'Savings frequency',
      influence: 'Low driver',
      description:
        'How often the respondent reports saving (from never to very frequently), capturing the habit of setting money aside.',
    },
    {
      name: 'Regular saver',
      influence: 'Low driver',
      description:
        'Whether the respondent saves regularly and consistently rather than only when there is extra money available.',
    },
    {
      name: 'Informal savings mode',
      influence: 'Low driver',
      description:
        'Whether the respondent mainly uses informal savings channels such as ROSCAs or savings groups, which can be a stepping stone into formal finance.',
    },
    {
      name: 'Savings frequency score',
      influence: 'Low driver',
      description:
        'Index combining several questions on how frequently and intensely the respondent saves over time.',
    },
    {
      name: 'Diverse savings reasons',
      influence: 'Low driver',
      description:
        'Whether the respondent saves for multiple different goals (e.g. emergencies, education, business, old age), indicating more advanced financial planning.',
    },
    {
      name: 'Saves any money',
      influence: 'Low driver',
      description:
        'Whether the respondent saved any money at all in the past 12 months, through any method (formal accounts, savings groups, at home, etc.).',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm top-0">
      <div className="bg-white max-w-2xl w-full mx-3 rounded-2xl shadow-2xl border border-border-light px-4 md:px-8 py-6 relative max-h-[80vh] flex flex-col space-y-4 sm:space-y-5">
        <div className="flex items-start justify-center gap-4">
          <div className="flex items-center gap-2">
            {/* <div className="p-2 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary"> */}
            {/* <Info className="w-5 h-5 text-white" /> */}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-text-primary text-center mt-2">About the EFInA Formal Inclusion Simulator</h2>
            
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-1 right-3 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-bg-secondary p-1.5"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 overflow-y-auto space-y-6 text-xs sm:text-sm text-text-secondary">
          <p className="text-xs sm:text-sm text-text-secondary mt-4">
              EFInA's Formal Inclusion Simulator turns the 2023 Access to Finance (A2F) survey into an interactive tool for exploring how different people and places engage with formal finance in Nigeria.
              It allows the combination of policy levers with population characteristics to see how formal inclusion rates could change under alternative scenarios.
              The tool is designed to help policymakers, programme teams and researchers quickly translate complex survey evidence into clear, actionable insights for strategy and planning.
          </p>
           <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-text-primary">
              <span>What does it do?</span>
            </div>
            <p className="list-inside space-y-1">
              The simulator uses a logistic regression model trained on EFInA’s 2023 A2F survey to calculate 
              the probability that a given profile is formally included, based on characteristics 
              such as education, ID, income, digital access, employment and savings behaviour.
              Lets users adjust key levers and see how national formal inclusion rates – and the approximate number 
              of adults newly included – could change under different policy scenarios.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-text-primary">
              <span>Who is this for?</span>
            </div>
            <p>
              <b>Policymakers and Regulators: </b> <br />National and state‑level decision‑makers 
              such as central banks and relevant ministries and regulators who 
              set financial inclusion strategies and targets. They might use dashboard to see which levers 
              have the largest modelled impact, test alternative “what if” policy packages, and check whether 
              proposed targets are realistic. 
            </p>

            <p>
              <b>Programme and Implementation Teams: </b> <br />Project managers and technical teams 
              in government units, donor‑funded programmes, NGOs or development partners who are involved in 
              inclusion interventions. They might use the dashboard to explore how different combinations of activities
              might shift inclusion, and to identify which population segments to focus on.  
            </p>

            <p>
              <b>Financial Inclusion Analysts and Researchers: </b> <br />Data analysts, researchers 
              and monitoring & evaluation teams in central banks, think tanks, universities or consultancies. 
              They might the dashboard to understand the relative importance of different drivers, interpret model
              coefficients and feature importance, and generate evidence for reports or policy briefs.  
            </p>

             <p>
              <b>Interested Public, Media and Advocacy Groups: </b> <br />Journalists, civil society 
              organisations, students and other interested users who want to understand who is excluded and why. 
              They might the dashboard to explore typical included/excluded profiles, see how factors like IDs or 
              digital access affect outcomes, and build narratives or advocacy messages around concrete scenarios. 
              While not the primary design audience, they benefit from the plain‑language explanations and visuals 
              to support communication, awareness‑raising and education.  
            </p>


          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-text-primary">
              <span>Model and data</span>
            </div>
            <p>
              The simulator uses a logistic regression model trained on EFInA's nationally representative 2023 A2F survey.
              It focuses on 27 policy-actionable drivers (education, identity, digital access, income, infrastructure, employment and savings behaviour),
              plus age groups and states. The current model predicts <span className="font-semibold">formal financial inclusion</span> only.
            </p>
            <p>
              Model performance: around <span className="font-semibold">80% accuracy</span> (about 4 in 5 classifications are correct)
              and <span className="font-semibold">AUC ≈ 0.88</span>, indicating excellent ability to distinguish included vs. not included individuals.
            </p>
            <p>
              The 27 base drivers below were selected to balance parsimony with policy relevance. Each variable corresponds to a lever
              that policymakers or programme teams can realistically influence, while avoiding "circular" outcomes that simply restate
              existing formal usage. Most of the model&apos;s predictive power comes from a small group of high and medium drivers;
              the remaining variables add finer-grained behavioural and livelihood detail, where additional variables would bring
              diminishing returns in accuracy but increase complexity.
            </p>
            <div className="mt-2 border border-border-light rounded-lg overflow-hidden">
              <div className="max-h-56 overflow-y-auto">
                <table className="min-w-full text-[10px] sm:text-xs">
                  <thead className="bg-bg-secondary">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-text-primary w-1/5">Driver</th>
                      <th className="text-left px-3 py-2 font-semibold text-text-primary w-3/5">What it captures</th>
                      <th className="text-left px-3 py-2 font-semibold text-text-primary w-1/5">Influence level*</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baseDrivers.map((driver) => (
                      <tr key={driver.name} className="odd:bg-white even:bg-bg-secondary/40">
                        <td className="px-3 py-1.5 align-top text-text-primary">{driver.name}</td>
                        <td className="px-3 py-1.5 align-top">{driver.description}</td>
                        <td className="px-3 py-1.5 align-top text-text-secondary">{driver.influence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="px-3 sm:px-4 py-2 bg-bg-secondary text-[10px] sm:text-[11px] text-text-tertiary">
                
              </p>
            </div>
            <p>
              The tool is intended for scenario exploration and high-level planning, not for targeting specific named individuals.
            </p>
          </div>
        </div>

        <div className="border-t border-border-light pt-4 mt-4 text-[11px] sm:text-xs text-text-tertiary flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p>
            Data source: EFInA Access to Financial Services in Nigeria 2023 survey. Adult population extrapolations use public demographic estimates.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="self-stretch sm:self-auto px-8 py-2 rounded-lg bg-accent-primary text-white text-xs font-semibold hover:bg-accent-secondary transition-colors whitespace-nowrap"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
