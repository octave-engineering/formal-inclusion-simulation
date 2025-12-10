import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Target, Sparkles, Info } from 'lucide-react';
import efinaLogo from './assets/efina_logo.png';
import PolicyMode from './components/PolicyMode';
import IndividualMode from './components/IndividualMode';
import VariableInfo from './components/VariableInfo';
import AboutModal from './components/AboutModal';

function App() {
  const [mode, setMode] = useState('individual');
  const [population, setPopulation] = useState(null);
  const [loadingPopulation, setLoadingPopulation] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showAbout, setShowAbout] = useState(false);

  // Load population data for policy mode with progress tracking
  useEffect(() => {
    if (mode === 'policy' && !population && !loadingPopulation) {
      setLoadingPopulation(true);
      setLoadingProgress(0);
      
      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      // Use relative path that works with base path configuration
      const dataPath = import.meta.env.BASE_URL + 'population_data.json';
      xhr.open('GET', dataPath, true);
      
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setLoadingProgress(Math.round(percentComplete));
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            // Handle both array format (old) and object format (new)
            const populationData = Array.isArray(data) ? data : data.population;
            setPopulation(populationData);
            setLoadingProgress(100);
          } catch (err) {
            console.error('Failed to parse population data:', err);
          }
        }
        setLoadingPopulation(false);
      };
      
      xhr.onerror = () => {
        console.error('Failed to load population data');
        setLoadingPopulation(false);
      };
      
      xhr.send();
    }
  }, [mode, population, loadingPopulation]);

  return (
    <div className="min-h-screen w-screen bg-bg-primary flex flex-col">
      {/* Modern Header - Responsive */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-card-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            {/* Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-md">
                <img src={efinaLogo} alt="EFInA Logo" className="h-5 sm:h-6 w-auto" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight">EFInA Formal Inclusion Simulator</h1>
                <p className="text-xs text-white/80 mt-0.5 hidden sm:block">Powered by 2023 Survey Data</p>
              </div>
            </div>
            
            {/* Mode Toggle - Responsive */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
                <button
                  onClick={() => setMode('individual')}
                  className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all flex items-center gap-1 sm:gap-2 font-medium text-xs sm:text-sm ${
                    mode === 'individual' 
                      ? 'bg-white text-accent-primary shadow-md' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Users size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">Individual</span>
                </button>
                {/* POLICY MODE - COMMENTED OUT */}
                <button
                  onClick={() => setMode('policy')}
                  className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all flex items-center gap-1 sm:gap-2 font-medium text-xs sm:text-sm ${
                    mode === 'policy' 
                      ? 'bg-white text-accent-primary shadow-md' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Target size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">Policy</span>
                </button>
                {/* INFO MODE - COMMENTED OUT */}
                {/* <button
                  onClick={() => setMode('info')}
                  className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all flex items-center gap-1 sm:gap-2 font-medium text-xs sm:text-sm ${
                    mode === 'info' 
                      ? 'bg-white text-accent-primary shadow-md' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <TrendingUp size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">Info</span>
                </button> */}
              </div>
              <button
                type="button"
                onClick={() => setShowAbout(true)}
                className="inline-flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-3 rounded-lg border border-white/30 text-[11px] sm:text-sm font-medium bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                <span className="hidden xs:inline sm:inline">About</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {mode === 'individual' ? (
        <IndividualMode />
      ) : mode === 'info' ? (
        <VariableInfo />
      ) : (
        loadingPopulation ? (
          <div className="flex-1 flex items-center justify-center bg-bg-primary">
            <div className="text-center w-full max-w-md px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white animate-spin" />
              </div>
              <div className="text-text-primary font-medium mb-2">Loading Population Data</div>
              <div className="text-sm text-text-secondary mb-4">
                Downloading 12 MB • 28,392 survey respondents
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-border-light rounded-full h-2.5 mb-2">
                <div 
                  className="bg-gradient-to-r from-accent-primary to-accent-secondary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <div className="text-xs text-text-tertiary">{loadingProgress}%</div>
            </div>
          </div>
        ) : (
          <PolicyMode population={population} />
        )
      )}
      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}
    </div>
  );
}

export default App;
