
import React, { useState, useEffect } from 'react';
import { useHunterStore } from './store';
import QuickLog from './components/QuickLog';
import GrindScreen from './components/GrindScreen';
import MapScreen from './components/MapScreen';
import TrophyRoom from './components/TrophyRoom';
import SettingsModal from './components/SettingsModal';

enum Tab { QUICK_LOG = 'quick-log', GRIND = 'grind', MAP = 'map', TROPHIES = 'trophies' }

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.QUICK_LOG);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const store = useHunterStore();
  const { state, toggleHardcore, importState, setCustomMapTile, clearCustomMap } = store;
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS'>('IDLE');

  // Handle Deep Linking / Shareable Links
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#data=')) {
      const code = hash.replace('#data=', '');
      const confirmImport = confirm("Tactical Data Detected: Import shared session data? (This will overwrite your current local logs)");
      if (confirmImport) {
        try {
          importState(code);
          // Clear hash after import to prevent re-import on refresh
          window.history.replaceState(null, '', window.location.pathname);
          alert("Import Successful! Logs and Maps updated.");
        } catch (e) {
          alert("Import Failed: Data corrupted or invalid.");
        }
      } else {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [importState]);

  useEffect(() => {
    if (state.isSyncing) {
      setSaveStatus('SAVING');
    } else {
      setSaveStatus('SUCCESS');
      const timer = setTimeout(() => setSaveStatus('IDLE'), 2000);
      return () => clearTimeout(timer);
    }
  }, [state.isSyncing, state.lastUpdated]);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.QUICK_LOG: return <QuickLog store={store} />;
      case Tab.GRIND: return <GrindScreen store={store} />;
      case Tab.MAP: return <MapScreen store={store} />;
      case Tab.TROPHIES: return <TrophyRoom store={store} />;
    }
  };

  return (
    <div className={`flex flex-col h-screen max-w-md mx-auto ${state.hardcoreMode ? 'bg-black' : 'bg-[#0F172A]'} text-slate-100 overflow-hidden border-x border-slate-800 shadow-2xl relative transition-colors duration-500`}>
      <header className="px-4 pt-6 pb-2 flex justify-between items-center z-50">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <button onClick={toggleHardcore} className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter border transition-all ${state.hardcoreMode ? 'bg-red-950 border-red-500 text-red-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              {state.hardcoreMode ? 'HARDCORE' : 'NORMAL'}
            </button>
            <div className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'SAVING' ? 'bg-amber-400 animate-pulse' : saveStatus === 'SUCCESS' ? 'bg-emerald-400' : 'bg-slate-700'}`}></div>
          </div>
          <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">{saveStatus === 'SAVING' ? 'Cloud Syncing...' : 'Local Persistence Active'}</span>
        </div>
        <h1 className="oswald text-xl font-bold tracking-tight text-white uppercase italic">{activeTab.replace('-', ' ').toUpperCase()}</h1>
        <button onClick={() => setIsSettingsOpen(true)} className="w-8 h-8 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-[10px] active:scale-90 transition-transform">👤</button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 custom-scrollbar">{renderContent()}</main>

      <nav className="fixed bottom-0 w-full max-w-md bg-[#1E293B]/95 backdrop-blur-lg border-t border-white/5 flex justify-around items-center p-2 pb-safe z-50">
        <NavButton active={activeTab === Tab.QUICK_LOG} onClick={() => setActiveTab(Tab.QUICK_LOG)} icon="⚡" label="Log" />
        <NavButton active={activeTab === Tab.GRIND} onClick={() => setActiveTab(Tab.GRIND)} icon="📊" label="Grind" />
        <NavButton active={activeTab === Tab.MAP} onClick={() => setActiveTab(Tab.MAP)} icon="📍" label="Map" />
        <NavButton active={activeTab === Tab.TROPHIES} onClick={() => setActiveTab(Tab.TROPHIES)} icon="🏆" label="Room" />
      </nav>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} store={store} />
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-2 tap-target transition-all ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
    <span className="text-lg mb-1">{icon}</span>
    <span className="text-[9px] uppercase font-bold tracking-widest">{label}</span>
  </button>
);

export default App;
