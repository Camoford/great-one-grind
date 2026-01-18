
import React, { useState } from 'react';
import { useHunterStore } from './store';
import GrindsList from './components/GrindsList';
import GreatOnesArchive from './components/GreatOnesArchive';
import StatsDashboard from './components/StatsDashboard';
import SettingsPanel from './components/SettingsPanel';
import GrindDetail from './components/GrindDetail';

enum Tab { GRINDS = 'grinds', ARCHIVE = 'archive', STATS = 'stats', SETTINGS = 'settings' }

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.GRINDS);
  const [selectedGrindId, setSelectedGrindId] = useState<string | null>(null);
  const store = useHunterStore();
  const { state } = store;

  const renderContent = () => {
    if (selectedGrindId) {
      return <GrindDetail grindId={selectedGrindId} onBack={() => setSelectedGrindId(null)} store={store} />;
    }

    switch (activeTab) {
      case Tab.GRINDS: return <GrindsList onSelect={setSelectedGrindId} store={store} />;
      case Tab.ARCHIVE: return <GreatOnesArchive onSelect={setSelectedGrindId} store={store} />;
      case Tab.STATS: return <StatsDashboard store={store} />;
      case Tab.SETTINGS: return <SettingsPanel store={store} />;
    }
  };

  return (
    <div className={`flex flex-col h-screen max-w-md mx-auto ${state.hardcoreMode ? 'bg-black' : 'bg-[#0F172A]'} text-slate-100 overflow-hidden border-x border-slate-800 shadow-2xl relative transition-colors duration-500`}>
      <header className="px-6 pt-8 pb-4 flex justify-between items-center z-50">
        <div className="flex flex-col">
          <h1 className="oswald text-2xl font-bold tracking-tight text-white uppercase italic leading-none">
            GREAT ONE <span className="text-emerald-500">GRIND</span>
          </h1>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Every kill tells the story.</p>
        </div>
        <div className={`w-2 h-2 rounded-full ${state.isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500/20'}`} />
      </header>

      <main className="flex-1 overflow-y-auto pb-24 custom-scrollbar">
        {renderContent()}
      </main>

      {!selectedGrindId && (
        <nav className="fixed bottom-0 w-full max-w-md bg-[#1E293B]/95 backdrop-blur-xl border-t border-white/5 flex justify-around items-center p-2 pb-safe z-50">
          <NavButton active={activeTab === Tab.GRINDS} onClick={() => setActiveTab(Tab.GRINDS)} icon="🎯" label="Grinds" />
          <NavButton active={activeTab === Tab.ARCHIVE} onClick={() => setActiveTab(Tab.ARCHIVE)} icon="💎" label="Great Ones" />
          <NavButton active={activeTab === Tab.STATS} onClick={() => setActiveTab(Tab.STATS)} icon="📊" label="Stats" />
          <NavButton active={activeTab === Tab.SETTINGS} onClick={() => setActiveTab(Tab.SETTINGS)} icon="⚙️" label="Settings" />
        </nav>
      )}
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-2 transition-all ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
    <span className="text-xl mb-1">{icon}</span>
    <span className="text-[9px] uppercase font-bold tracking-widest">{label}</span>
  </button>
);

export default App;
