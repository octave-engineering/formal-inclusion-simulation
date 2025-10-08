import React from 'react';

export default function VariableInfo() {
  return (
    <div className="flex-1 bg-bg-primary overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 text-text-primary">
        {/* Page Header */}
        <header className="space-y-6">
          <h1 className="text-5xl font-bold text-text-primary">Variable Reference Guide</h1>
          <div className="text-lg text-text-secondary leading-relaxed space-y-3">
            <p>
              This comprehensive guide provides in-depth documentation for every variable used in the EFInA Formal Inclusion Simulator.
              Understanding these variables is critical for interpreting model predictions and policy simulations.
            </p>
            <p>
              The simulator is built on data from the <strong>EFInA Access to Financial Services in Nigeria 2023 Survey</strong>,
              which interviewed 28,392 respondents across Nigeria. Each variable represents a key dimension of financial inclusion,
              capturing demographic characteristics, economic activity, digital readiness, and access to formal financial services.
            </p>
            <p>
              Variables are organized into thematic groups for easier navigation. Each entry includes the variable name, data type,
              interpretation guidelines, policy implications, and technical details about normalization and usage in the predictive model.
            </p>
          </div>
        </header>

        {/* 1. Demographics */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-text-primary border-b-2 border-brand-purple pb-3">1. Demographics</h2>
          <p className="text-base text-text-secondary leading-relaxed">
            Demographic variables capture fundamental characteristics of survey respondents that research has shown to be
            strongly correlated with financial inclusion. These variables form the socioeconomic foundation upon which
            other inclusion factors build.
          </p>

          <div className="space-y-8">
            {/* Education */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border-light">
              <h3 className="text-xl font-semibold text-brand-purple mb-3">Education_Ordinal</h3>
              <p className="text-text-secondary mb-4">
                <strong>Data Type:</strong> Ordinal (0-3) | <strong>Column Name:</strong> <code className="bg-bg-secondary px-2 py-0.5 rounded">Education_Ordinal</code>
              </p>
              
              <div className="space-y-3 text-sm leading-relaxed">
                <div>
                  <p className="font-semibold text-text-primary mb-1">Definition:</p>
                  <p>This variable measures the highest level of formal education attained by the respondent. Education is one of the strongest
                  predictors of financial inclusion, as it correlates with financial literacy, income potential, employment opportunities,
                  and the ability to navigate formal financial systems.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-text-primary mb-1">Categories:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>0 = No formal education:</strong> The respondent has never attended school or received formal education</li>
                    <li><strong>1 = Primary education:</strong> Completed primary school (typically 6 years of schooling)</li>
                    <li><strong>2 = Secondary education:</strong> Completed secondary school (typically 12 years total)</li>
                    <li><strong>3 = Tertiary education:</strong> Attended university, polytechnic, or other higher education institutions</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Policy Implications:</p>
                  <p>Educational attainment directly impacts employability, income stability, and understanding of financial products.
                  Policy interventions targeting education expansion—particularly secondary and tertiary levels—have multiplier effects
                  on financial inclusion. Financial literacy programs can complement formal education for adults.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Model Usage:</p>
                  <p>The model normalizes this value by dividing by 3 (max value), converting it to a 0-1 scale. This allows the
                  logistic regression to appropriately weight education relative to other continuous variables. The feature weight
                  of 0.14851 indicates education is among the top 3 most important predictors in the model.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Dashboard Implementation:</p>
                  <p>In Individual mode, users adjust education via a slider with labeled categories. In Policy mode, the "Tertiary Education"
                  slider represents the percentage of the population with tertiary education (baseline: 8.7% for Nigeria).</p>
                </div>
              </div>
            </div>

            {/* Gender */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border-light">
              <h3 className="text-xl font-semibold text-brand-purple mb-3">Gender_Male</h3>
              <p className="text-text-secondary mb-4">
                <strong>Data Type:</strong> Binary (0/1) | <strong>Column Name:</strong> <code className="bg-bg-secondary px-2 py-0.5 rounded">Gender_Male</code>
              </p>
              
              <div className="space-y-3 text-sm leading-relaxed">
                <div>
                  <p className="font-semibold text-text-primary mb-1">Definition:</p>
                  <p>A binary indicator of the respondent's gender. 1 indicates male, 0 indicates female. This variable captures
                  gender-based disparities in financial inclusion that persist across many African economies.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-text-primary mb-1">Research Context:</p>
                  <p>Gender gaps in financial inclusion are well-documented. In Nigeria, men historically have higher rates of formal
                  account ownership, access to credit, and usage of digital financial services. This gap stems from differences in
                  labor force participation, income levels, asset ownership, and cultural norms around financial decision-making.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Policy Implications:</p>
                  <p>Targeted interventions for women—such as women-focused savings groups, microfinance programs, and gender-sensitive
                  product design—can narrow the gender gap. Mobile money and digital banking have shown promise in reducing barriers
                  for women who may face mobility constraints or lack formal employment.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Model Weight:</p>
                  <p>Feature importance: 0.06512. While significant, gender is less predictive than education or ID ownership, suggesting
                  that economic and structural factors mediate gender's direct effect on inclusion.</p>
                </div>
              </div>
            </div>

            {/* Age */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border-light">
              <h3 className="text-xl font-semibold text-brand-purple mb-3">Age_18_Plus</h3>
              <p className="text-text-secondary mb-4">
                <strong>Data Type:</strong> Binary (0/1) | <strong>Column Name:</strong> <code className="bg-bg-secondary px-2 py-0.5 rounded">Age_18_Plus</code>
              </p>
              
              <div className="space-y-3 text-sm leading-relaxed">
                <div>
                  <p className="font-semibold text-text-primary mb-1">Definition:</p>
                  <p>Binary flag indicating whether the respondent is 18 years of age or older. This threshold represents legal adulthood
                  in Nigeria and most financial regulations require customers to be at least 18 to open formal accounts independently.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-text-primary mb-1">Regulatory Context:</p>
                  <p>Nigerian banking regulations, like those in most countries, require account holders to be adults. Minors can only
                  access certain products (like savings accounts) with parental/guardian oversight. This creates a structural barrier
                  for financial inclusion among youth under 18.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Policy Implications:</p>
                  <p>Youth financial inclusion programs, student banking products, and digital wallets designed for minors can help prepare
                  younger populations for formal financial participation. Financial education in secondary schools is another key intervention.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Model Weight:</p>
                  <p>Feature importance: 0.06887, indicating moderate predictive power. The effect captures both legal requirements and
                  the life-cycle dimension of financial inclusion (adults are more likely to have stable income and need financial services).</p>
                </div>
              </div>
            </div>

            {/* Sector */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border-light">
              <h3 className="text-xl font-semibold text-brand-purple mb-3">Sector_Urban</h3>
              <p className="text-text-secondary mb-4">
                <strong>Data Type:</strong> Binary (0/1) | <strong>Column Name:</strong> <code className="bg-bg-secondary px-2 py-0.5 rounded">Sector_Urban</code>
              </p>
              
              <div className="space-y-3 text-sm leading-relaxed">
                <div>
                  <p className="font-semibold text-text-primary mb-1">Definition:</p>
                  <p>Binary variable indicating whether the respondent resides in an urban area (1) or rural area (0). This captures
                  the urban-rural divide in access to financial infrastructure, which is one of the most persistent challenges
                  in African financial inclusion.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-text-primary mb-1">Infrastructure Context:</p>
                  <p>Urban areas in Nigeria have significantly higher density of bank branches, ATMs, agent banking points, and mobile
                  money agents. Rural areas often face infrastructure gaps including poor road networks, limited electricity, weak
                  internet connectivity, and lower population density that makes formal financial service provision less commercially viable.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Policy Implications:</p>
                  <p>Closing the urban-rural gap requires targeted interventions: agent banking networks in rural areas, mobile money
                  infrastructure, postal banking, and digital-first products that don't require physical branches. Government
                  subsidies or mandates for rural service provision may be necessary to overcome market failures.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Model Weight:</p>
                  <p>Feature importance: 0.05631. The moderate weight suggests that while location matters, individual characteristics
                  (education, income, IDs) mediate much of the urban-rural effect.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Formal Identification & Banking */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-text-primary border-b-2 border-brand-purple pb-3">2. Formal Identification & Banking</h2>
          <p className="text-base text-text-secondary leading-relaxed">
            Formal identification and bank account ownership are critical enablers of financial inclusion. Without proper IDs,
            individuals cannot comply with Know Your Customer (KYC) requirements mandated by financial regulations.
          </p>

          <div className="space-y-8">
            {/* Formal_ID_Count */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border-light">
              <h3 className="text-xl font-semibold text-brand-purple mb-3">Formal_ID_Count</h3>
              <p className="text-text-secondary mb-4">
                <strong>Data Type:</strong> Count (0-2) | <strong>Column Name:</strong> <code className="bg-bg-secondary px-2 py-0.5 rounded">Formal_ID_Count</code>
              </p>
              
              <div className="space-y-3 text-sm leading-relaxed">
                <div>
                  <p className="font-semibold text-text-primary mb-1">Definition:</p>
                  <p>This variable counts how many formal identification documents the respondent possesses. In Nigeria, the two primary
                  forms of formal ID relevant for financial services are the National Identification Number (NIN) and Bank Verification Number (BVN).
                  The range is 0 (no formal IDs) to 2 (has both NIN and BVN).</p>
                </div>
                
                <div>
                  <p className="font-semibold text-text-primary mb-1">Regulatory Importance:</p>
                  <p>Nigerian banking regulations (and global anti-money laundering standards) require financial institutions to verify
                  customer identities before opening accounts or providing services. NIN is the government-issued national ID tied to
                  biometric data, while BVN is a banking sector initiative that creates a unique identifier across all bank accounts.
                  Having at least one of these IDs is virtually mandatory for formal financial inclusion.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Policy Implications:</p>
                  <p>ID coverage is a foundational policy area. The Nigerian government's push to enroll all citizens in the NIN database,
                  and the Central Bank's BVN registration drive, are critical infrastructure for inclusion. Simplifying ID registration
                  processes, expanding enrollment centers to rural areas, and integrating digital ID systems can accelerate inclusion.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Model Weight:</p>
                  <p>Feature importance: 0.16307 (highest in the model). This indicates that formal ID ownership is the single strongest
                  predictor of formal financial inclusion, reflecting its status as a prerequisite for most formal financial services.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Dashboard Implementation:</p>
                  <p>The Individual dashboard has a dropdown for 0, 1, or 2 IDs. Policy mode tracks NIN/BVN coverage as a percentage
                  of the population (baseline: 80.1% have at least one formal ID based on the 2023 survey data).</p>
                </div>
              </div>
            </div>

            {/* Bank_Account */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border-light">
              <h3 className="text-xl font-semibold text-brand-purple mb-3">Bank_Account</h3>
              <p className="text-text-secondary mb-4">
                <strong>Data Type:</strong> Binary (0/1) | <strong>Column Name:</strong> <code className="bg-bg-secondary px-2 py-0.5 rounded">Bank_Account</code>
              </p>
              
              <div className="space-y-3 text-sm leading-relaxed">
                <div>
                  <p className="font-semibold text-text-primary mb-1">Definition:</p>
                  <p>Binary indicator of whether the respondent has a formal bank account (including current accounts, savings accounts,
                  or basic banking accounts). This is a direct measure of formal financial inclusion and is often used as the primary
                  metric by organizations like the World Bank.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-text-primary mb-1">Context:</p>
                  <p>Bank account ownership enables savings, credit access, digital payments, and protection of funds. However, account
                  ownership alone doesn't guarantee active usage—many "banked" individuals have dormant accounts. The EFInA survey
                  captures account ownership but doesn't distinguish between active and inactive accounts in this binary variable.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Policy Implications:</p>
                  <p>Increasing bank account ownership requires addressing supply-side barriers (branch proximity, account fees, minimum
                  balances) and demand-side barriers (financial literacy, trust in formal institutions, perceived relevance). Agent
                  banking, digital-only banks, and basic/no-frills accounts have proven effective in expanding account ownership.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Model Weight:</p>
                  <p>Feature importance: 0.06597. Moderate importance reflects that having an account is correlated with inclusion,
                  but isn't deterministic—many account holders may not be fully included if they lack other services like credit or insurance.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Baseline Statistics:</p>
                  <p>According to the 2023 EFInA survey, 55.4% of Nigerian adults have a bank account, up from historical lows but still
                  below the regional average for Sub-Saharan Africa.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Financial Access */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-text-primary border-b-2 border-brand-purple pb-3">3. Financial Access</h2>
          <p className="text-base text-text-secondary leading-relaxed">
            Financial access variables measure the breadth and depth of an individual's engagement with formal financial services.
            These metrics go beyond simple account ownership to capture service diversity and usage intensity.
          </p>

          <div className="space-y-8">
            {/* Financial_Access_Index */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border-light">
              <h3 className="text-xl font-semibold text-brand-purple mb-3">Financial_Access_Index</h3>
              <p className="text-text-secondary mb-4">
                <strong>Data Type:</strong> Continuous (0-1) | <strong>Column Name:</strong> <code className="bg-bg-secondary px-2 py-0.5 rounded">Financial_Access_Index</code>
              </p>
              
              <div className="space-y-3 text-sm leading-relaxed">
                <div>
                  <p className="font-semibold text-text-primary mb-1">Definition:</p>
                  <p>A composite index ranging from 0 to 1 that measures overall access to and usage of formal financial services.
                  This index aggregates multiple dimensions including account ownership, savings behavior, credit access, insurance
                  coverage, and mobile money usage. A value of 0 indicates no formal financial access, while 1 represents full
                  engagement across all financial service categories.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-text-primary mb-1">Calculation Methodology:</p>
                  <p>The index is calculated using principal component analysis (PCA) or weighted averaging of binary indicators
                  for different financial services. Components typically include: (1) transactional accounts, (2) savings products,
                  (3) credit facilities, (4) insurance products, (5) mobile money accounts, and (6) investment products.
                  Higher weights are given to services indicating deeper financial engagement.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Policy Implications:</p>
                  <p>This index is a key performance indicator for financial inclusion strategies. Policies that increase this index
                  include: expanding product diversity (beyond basic accounts), promoting savings culture, improving credit access
                  for MSMEs, expanding insurance penetration, and supporting fintech innovation. Multi-dimensional approaches
                  are more effective than single-service interventions.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Model Weight:</p>
                  <p>Feature importance: 0.05609. Moderate-high importance reflects that comprehensive financial engagement
                  (not just having an account) is crucial for formal inclusion. This validates the "beyond access" approach
                  in financial inclusion strategy.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Baseline Statistics:</p>
                  <p>Mean value: 0.14 (14% of maximum engagement). This low average indicates most Nigerians have limited
                  financial service diversity even when they have accounts, highlighting the "usage gap" in financial inclusion.</p>
                </div>
              </div>
            </div>

            {/* Access_Diversity_Score */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border-light">
              <h3 className="text-xl font-semibold text-brand-purple mb-3">Access_Diversity_Score</h3>
              <p className="text-text-secondary mb-4">
                <strong>Data Type:</strong> Count (0-5) | <strong>Column Name:</strong> <code className="bg-bg-secondary px-2 py-0.5 rounded">Access_Diversity_Score</code>
              </p>
              
              <div className="space-y-3 text-sm leading-relaxed">
                <div>
                  <p className="font-semibold text-text-primary mb-1">Definition:</p>
                  <p>This variable counts the number of distinct formal financial access channels the respondent uses. Channels
                  typically include: (1) bank branches, (2) ATMs, (3) mobile money agents, (4) internet/mobile banking,
                  (5) POS terminals. The score ranges from 0 (no formal financial access points) to 5 (uses all channels).</p>
                </div>
                
                <div>
                  <p className="font-semibold text-text-primary mb-1">Why Channel Diversity Matters:</p>
                  <p>Access channel diversity indicates both availability of options and user sophistication. People with diverse
                  access channels are more resilient to service disruptions, can optimize for convenience and cost, and are
                  more likely to use financial services regularly. Research shows that multi-channel users have higher transaction
                  volumes and better financial outcomes than single-channel users.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Policy Implications:</p>
                  <p>Policies should promote channel diversity through: interoperability standards (allowing cross-channel transactions),
                  agent banking expansion in underserved areas, digital literacy programs for mobile/internet banking adoption,
                  and infrastructure investment (reliable electricity and internet for digital channels).</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Model Weight:</p>
                  <p>Feature importance: 0.05609. This indicates that having multiple access channels is a significant predictor
                  of formal inclusion, as it reflects both capability and opportunity to engage with financial services.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Dashboard Normalization:</p>
                  <p>In the model, this value is normalized by dividing by 5 (maximum channels) to create a 0-1 scale for
                  compatibility with other continuous variables in the logistic regression.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Digital Access */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-text-primary border-b-2 border-brand-purple pb-3">4. Digital Access</h2>
          <p className="text-base text-text-secondary leading-relaxed">
            Digital access measures the technological infrastructure and capabilities that enable digital financial services.
            In an increasingly digital financial ecosystem, mobile and internet readiness are critical inclusion factors.
          </p>

          <div className="space-y-8">
            {/* Mobile_Digital_Readiness */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border-light">
              <h3 className="text-xl font-semibold text-brand-purple mb-3">Mobile_Digital_Readiness</h3>
              <p className="text-text-secondary mb-4">
                <strong>Data Type:</strong> Binary (0/1) | <strong>Column Name:</strong> <code className="bg-bg-secondary px-2 py-0.5 rounded">Mobile_Digital_Readiness</code>
              </p>
              
              <div className="space-y-3 text-sm leading-relaxed">
                <div>
                  <p className="font-semibold text-text-primary mb-1">Definition:</p>
                  <p>A binary composite indicator that equals 1 if the respondent has both: (1) a mobile phone (feature phone or smartphone),
                  AND (2) reliable access to cellular network or internet connectivity. This captures the minimum technological
                  requirements for participating in digital financial services like mobile money, USSD banking, or mobile apps.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-text-primary mb-1">Digital Financial Services Context:</p>
                  <p>Nigeria has seen explosive growth in digital financial services. Mobile money platforms (like Opay, PalmPay, Moniepoint),
                  USSD banking codes, and bank mobile apps have become primary channels for payments, transfers, and savings.
                  However, these services require basic digital infrastructure. Without a phone and network access, individuals
                  are excluded from this digital financial revolution.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Infrastructure Challenges:</p>
                  <p>While mobile phone ownership is widespread in Nigeria (estimated 80%+ penetration), network quality varies significantly.
                  Rural areas often lack reliable 3G/4G coverage. Electricity shortages make phone charging difficult. These infrastructure
                  gaps create a digital divide that maps onto financial inclusion gaps.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Policy Implications:</p>
                  <p>Digital readiness interventions include: telecommunications infrastructure investment (cell towers in rural areas),
                  electricity grid expansion or off-grid solutions, affordable smartphone programs, digital literacy training,
                  and promoting low-data or offline-capable financial apps (like USSD banking that works on feature phones).</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Model Weight:</p>
                  <p>Feature importance: 0.11246 (third highest). This high weight reflects that digital readiness is increasingly
                  essential for financial inclusion in Nigeria's digital-first financial ecosystem. It ranks behind only ID ownership
                  and education in predictive power.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Future Trends:</p>
                  <p>As traditional bank branches decline and digital services expand, this variable will become even more critical.
                  The COVID-19 pandemic accelerated digital adoption, making mobile/digital readiness not just an advantage but
                  increasingly a necessity for financial inclusion.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Employment & Income */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-text-primary border-b-2 border-brand-purple pb-3">5. Employment & Income</h2>
          <p className="text-base text-text-secondary leading-relaxed">
            Employment and income variables capture the economic foundation for financial inclusion. Stable, diverse income
            streams enable savings, credit repayment, and sustained engagement with financial services.
          </p>

          <div className="space-y-8">
            {/* Formal_Employment_Binary */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border-light">
              <h3 className="text-xl font-semibold text-brand-purple mb-3">Formal_Employment_Binary</h3>
              <p className="text-text-secondary mb-4">
                <strong>Data Type:</strong> Binary (0/1) | <strong>Column Name:</strong> <code className="bg-bg-secondary px-2 py-0.5 rounded">Formal_Employment_Binary</code>
              </p>
              
              <div className="space-y-3 text-sm leading-relaxed">
                <div>
                  <p className="font-semibold text-text-primary mb-1">Definition:</p>
                  <p>Binary indicator where 1 means the respondent is formally employed (salaried job with a registered organization,
                  receiving regular wages) and 0 means they are not formally employed. Formal employment typically includes government
                  jobs, corporate sector positions, and registered NGO/international organization roles.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-text-primary mb-1">Why Formal Employment Matters:</p>
                  <p>Formal employment provides: (1) Regular, predictable income for financial planning, (2) Documentation (pay slips,
                  employment letters) for credit applications, (3) Often includes employer-sponsored benefits (pension, insurance),
                  (4) Higher likelihood of salary bank accounts and direct deposit. Financial institutions strongly prefer lending
                  to formally employed individuals due to verifiable income and lower default risk.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Nigerian Labor Market Context:</p>
                  <p>Nigeria has a large informal economy—estimates suggest 60-80% of employment is informal. Most Nigerians are
                  self-employed (trading, artisans, agriculture) or work in unregistered micro-businesses. The small formal sector
                  employment rate (roughly 20-25%) creates a structural barrier to financial inclusion, as many financial products
                  are designed assuming formal employment.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Policy Implications:</p>
                  <p>Strategies include: (1) Products designed for informal workers (alternative credit scoring using mobile data,
                  savings groups), (2) Formalization incentives (simplified business registration), (3) Social protection extension
                  to informal workers, (4) Digital identity and transaction history as alternatives to employment proof.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Model Weight:</p>
                  <p>Feature importance: 0.07810. Moderately high importance indicates formal employment significantly predicts inclusion,
                  but isn't deterministic—many informally employed individuals still achieve financial inclusion through alternative means.</p>
                </div>
              </div>
            </div>

            {/* Business_Income_Binary */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border-light">
              <h3 className="text-xl font-semibold text-brand-purple mb-3">Business_Income_Binary</h3>
              <p className="text-text-secondary mb-4">
                <strong>Data Type:</strong> Binary (0/1) | <strong>Column Name:</strong> <code className="bg-bg-secondary px-2 py-0.5 rounded">Business_Income_Binary</code>
              </p>
              
              <div className="space-y-3 text-sm leading-relaxed">
                <div>
                  <p className="font-semibold text-text-primary mb-1">Definition:</p>
                  <p>Binary flag indicating whether the respondent earns income from operating a registered business. This typically
                  means formal business registration (with Corporate Affairs Commission), business bank account, and tax identification.
                  Distinguished from informal trading or unregistered micro-enterprises.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-text-primary mb-1">Business Banking Connection:</p>
                  <p>Registered business owners often need formal financial services for: business accounts (separate from personal),
                  merchant payment solutions, working capital loans, invoice financing, and business insurance. This necessity
                  drives financial inclusion among business owners at higher rates than general population.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">MSME Sector Context:</p>
                  <p>Micro, Small, and Medium Enterprises (MSMEs) are the backbone of Nigerian economy but face severe financial
                  access challenges. While there are millions of MSMEs, most are informal/unregistered. Registered businesses
                  represent a minority but have significantly higher financial inclusion rates due to both need and eligibility.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Policy Implications:</p>
                  <p>Supporting business formalization through: simplified registration processes, tax incentives for registration,
                  MSME-focused financial products (tailored business loans, digital payment acceptance), business development
                  services, and linking registration to financial services access.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Model Weight:</p>
                  <p>Feature importance: 0.05915. Moderate importance suggests business income is a meaningful predictor, though
                  less impactful than formal employment. This may reflect that many businesses remain informal despite generating income.</p>
                </div>
              </div>
            </div>

            {/* Agricultural_Income_Binary */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border-light">
              <h3 className="text-xl font-semibold text-brand-purple mb-3">Agricultural_Income_Binary</h3>
              <p className="text-text-secondary mb-4">
                <strong>Data Type:</strong> Binary (0/1) | <strong>Column Name:</strong> <code className="bg-bg-secondary px-2 py-0.5 rounded">Agricultural_Income_Binary</code>
              </p>
              
              <div className="space-y-3 text-sm leading-relaxed">
                <div>
                  <p className="font-semibold text-text-primary mb-1">Definition:</p>
                  <p>Binary indicator showing whether the respondent earns income from agricultural activities (farming, livestock,
                  fishing, forestry). This captures both subsistence farmers and commercial agricultural producers. In Nigeria's
                  largely agrarian economy, a significant portion of the population derives at least some income from agriculture.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-text-primary mb-1">Agricultural Finance Challenges:</p>
                  <p>Farmers face unique financial access barriers: (1) Seasonal, unpredictable income (dependent on harvests),
                  (2) Lack of traditional collateral (land tenure issues), (3) Geographic remoteness from bank branches,
                  (4) Lower education/literacy levels, (5) Climate risks affecting repayment capacity. These factors make
                  financial institutions hesitant to serve agricultural clients.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Economic Importance:</p>
                  <p>Agriculture employs about 35-40% of Nigeria's workforce and contributes ~25% of GDP. Yet agricultural credit
                  represents only 4-5% of total bank lending. This massive gap represents both a challenge and opportunity for
                  financial inclusion. Smallholder farmers particularly struggle to access formal financial services.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Policy Implications:</p>
                  <p>Agricultural finance interventions include: specialized agricultural banks, government-backed loan guarantee schemes,
                  warehouse receipt systems (inventory as collateral), index-based crop insurance, mobile money for rural areas,
                  agent banking in farming communities, and value chain financing (linking farmers to processors/buyers).</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Model Weight:</p>
                  <p>Feature importance: 0.01204 (relatively low). This suggests agricultural income alone doesn't strongly predict
                  inclusion, likely reflecting the barriers mentioned above. However, when combined with other factors (education,
                  formal IDs), agricultural income can support inclusion.</p>
                </div>
              </div>
            </div>

            {/* Passive_Income_Binary */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border-light">
              <h3 className="text-xl font-semibold text-brand-purple mb-3">Passive_Income_Binary</h3>
              <p className="text-text-secondary mb-4">
                <strong>Data Type:</strong> Binary (0/1) | <strong>Column Name:</strong> <code className="bg-bg-secondary px-2 py-0.5 rounded">Passive_Income_Binary</code>
              </p>
              
              <div className="space-y-3 text-sm leading-relaxed">
                <div>
                  <p className="font-semibold text-text-primary mb-1">Definition:</p>
                  <p>Binary flag indicating whether the respondent receives passive income from sources not requiring active labor.
                  This includes: rental income (property or equipment), investment returns (stocks, bonds, mutual funds), dividends
                  from business ownership without active management, pension/retirement benefits, interest on savings, and remittances.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-text-primary mb-1">Passive Income as Inclusion Indicator:</p>
                  <p>Having passive income sources is both a cause and consequence of financial inclusion. It's a cause because passive
                  income requires financial sophistication (knowing how to invest, having surplus to invest). It's a consequence
                  because generating passive income requires engaging with formal financial system (bank accounts for rent deposits,
                  investment accounts for stocks/funds, pension accounts for retirement benefits).</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Wealth and Asset Indicators:</p>
                  <p>Passive income is often a proxy for wealth accumulation and financial maturity. People with passive income streams
                  have typically progressed beyond subsistence to asset building. In Nigeria's context, this might indicate middle/upper
                  class status, as passive income is relatively rare among lower-income populations who lack surplus for investment.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Policy Implications:</p>
                  <p>Promoting passive income generation requires: financial literacy education (basics of investing, retirement planning),
                  accessible investment products (low-minimum mutual funds, government bonds for retail investors), property formalization
                  (secure land titles for rental markets), pension system expansion, and promoting remittance financial services.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Model Weight:</p>
                  <p>Feature importance: 0.03390. Moderate-low importance suggests passive income positively correlates with inclusion
                  but isn't a major driver. This makes sense as passive income is relatively uncommon in the sample and is more
                  of an outcome than a cause of financial capability.</p>
                </div>
              </div>
            </div>

            {/* Income_Level_Ordinal */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border-light">
              <h3 className="text-xl font-semibold text-brand-purple mb-3">Income_Level_Ordinal</h3>
              <p className="text-text-secondary mb-4">
                <strong>Data Type:</strong> Ordinal (0-19) | <strong>Column Name:</strong> <code className="bg-bg-secondary px-2 py-0.5 rounded">Income_Level_Ordinal</code>
              </p>
              
              <div className="space-y-3 text-sm leading-relaxed">
                <div>
                  <p className="font-semibold text-text-primary mb-1">Definition:</p>
                  <p>An ordinal variable representing the respondent's average monthly income level, categorized into 20 bands (0-19)
                  from lowest to highest. While the exact income ranges per band vary, 0 typically represents no/minimal income,
                  and 19 represents very high income (top earners). This ordinal encoding preserves income ranking while avoiding
                  issues with exact income reporting (which respondents often find sensitive or difficult to specify precisely).</p>
                </div>
                
                <div>
                  <p className="font-semibold text-text-primary mb-1">Income and Financial Inclusion Relationship:</p>
                  <p>Income level is intuitively linked to financial inclusion—higher income provides: (1) Surplus for savings beyond
                  subsistence needs, (2) Ability to meet minimum balance requirements, (3) Collateral or credit history for loans,
                  (4) Affordability of bank fees/transaction costs, (5) Value that makes formal financial services economically
                  viable for providers. However, the relationship isn't perfectly linear—some high-income individuals remain
                  unbanked by choice, while some low-income individuals achieve inclusion through mobile money or microfinance.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Income Inequality Context:</p>
                  <p>Nigeria has significant income inequality (Gini coefficient ~35-40). Most of the population clusters in lower
                  income bands, while a small elite occupies high bands. This skewed distribution means financial services often
                  target the high-income minority, leaving low-income majority underserved. Pro-poor financial inclusion requires
                  products viable at low income levels.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Policy Implications:</p>
                  <p>Income-related policies include: (1) Economic growth strategies to raise incomes generally, (2) Low/no-fee
                  basic banking accounts for low-income users, (3) Microfinance and savings groups for low-income savers,
                  (4) Social protection programs that channel payments through formal accounts (financial inclusion + poverty reduction),
                  (5) Agent banking to reduce transaction costs for low-balance accounts.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Model Weight:</p>
                  <p>Feature importance: 0.00989 (lowest among all variables). This surprisingly low weight suggests that once other
                  factors (education, IDs, employment type) are controlled, absolute income level adds little additional predictive
                  power. This challenges assumptions that income is the main barrier—structural factors (IDs, education, digital
                  access) appear more critical.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Dashboard Normalization:</p>
                  <p>The model normalizes this by dividing by 19 (max level) to create a 0-1 scale. Users can set income level
                  via slider in Individual mode. In Policy mode, it represents target average income level for population.</p>
                </div>
              </div>
            </div>

            {/* Income_Diversity_Score */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border-light">
              <h3 className="text-xl font-semibold text-brand-purple mb-3">Income_Diversity_Score</h3>
              <p className="text-text-secondary mb-4">
                <strong>Data Type:</strong> Count (0-10) | <strong>Column Name:</strong> <code className="bg-bg-secondary px-2 py-0.5 rounded">Income_Diversity_Score</code>
              </p>
              
              <div className="space-y-3 text-sm leading-relaxed">
                <div>
                  <p className="font-semibold text-text-primary mb-1">Definition:</p>
                  <p>This variable counts the number of distinct income sources the respondent has. Income sources can include:
                  formal employment salary, business profits, agricultural sales, casual labor, remittances, rental income,
                  investment returns, pension, government transfers, and other sources. The score ranges from 0 (no income) to
                  10 (highly diversified income portfolio).</p>
                </div>
                
                <div>
                  <p className="font-semibold text-text-primary mb-1">Why Income Diversity Matters:</p>
                  <p>Income diversification is a risk management strategy—when one income source fails (business slow month, crop failure,
                  job loss), others can compensate. Research shows income diversification correlates with: (1) More stable overall
                  income (reducing volatility), (2) Higher total income (multiple streams compound), (3) Better financial resilience
                  during shocks, (4) Greater financial planning capacity. Financial institutions view diversified income favorably
                  for credit assessment as it reduces repayment risk.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Livelihoods Context:</p>
                  <p>In Nigeria's economic context, income diversification is common—many households combine farming with trading,
                  formal jobs with side businesses, or multiple family members contributing different income types. This reflects
                  both opportunity (diverse economic activities available) and necessity (single income sources often insufficient
                  or unreliable). Rural households especially practice diversification as agricultural risk management.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Policy Implications:</p>
                  <p>Supporting income diversification through: skills development programs (enabling multiple income-generating activities),
                  entrepreneurship support for side businesses, microfinance for income-generating investments, facilitating remittances
                  (diaspora income), social protection programs (guaranteed minimum income stream), and financial products that
                  accommodate irregular, multi-source income patterns.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Model Weight:</p>
                  <p>Feature importance: 0.01444. Low-moderate importance suggests income diversity has a positive but modest effect
                  on inclusion prediction. While diversity improves financial stability, it doesn't overcome barriers like lack
                  of IDs or education.</p>
                </div>

                <div>
                  <p className="font-semibold text-text-primary mb-1">Dashboard Normalization:</p>
                  <p>Normalized by dividing by 10 to create 0-1 scale. Note that having more income sources isn't always better—
                  very high scores might indicate income insecurity requiring multiple sources to survive, rather than prosperity.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border-light pt-8 mt-12">
          <p className="text-sm text-text-secondary">
            All column names and definitions are taken from the EFInA 2023 survey documentation. 
            For questions or clarifications, refer to the official EFInA data dictionary or contact the research team.
          </p>
          <p className="text-xs text-text-tertiary mt-2">
            Last updated: 2025. Model coefficients based on logistic regression trained on 28,392 survey responses.
          </p>
        </footer>
      </div>
    </div>
  );
}
