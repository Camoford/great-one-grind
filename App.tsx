import React, { useState } from 'react';
import { useHunterStore } from './store';

import GrindScreen from './components/GrindScreen';
import GrindsList from './components/GrindsList';
import QuickLog from './components/QuickLog';
import StatsDashboard from './components/StatsDashboard';
import TrophyRoom from './components/TrophyRoom';
import SettingsPanel from './components/SettingsPanel';

type Screen =
  | 'grinds'
  | 'grind'
  | 'quicklog'
  | 'stats'
  | 'trophy'
  | 'settings';

export default function App() {
  // Initialize Zustand store
  useHunterStore();

  const [screen, setScreen] = useState<Screen>('grinds');

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Nav */}
      <div className="flex justify-around border-b border-slate-700 p-2 text-xs">
        <button onClick={() => setScreen('grinds')}>Grinds</button>
        <button onClick={() => setScreen('quicklog')}>Quick Log</button>
        <button onClick={() => setScreen('stats')}>Stats</button>
        <button onClick={() => setScreen('trophy')}>Trophy</button>
        <button onClick={() => setScreen('settings')}>Settings</button>
      </div>

      {/* Screens */}
      <div className="p-2">
        {screen === 'grinds' && <GrindsList />}
        {screen === 'grind' && <GrindScreen />}
        {screen === 'quicklog' && <QuickLog />}
        {screen === 'stats' && <StatsDashboard />}
        {screen === 'trophy' && <TrophyRoom />}
        {screen === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
}
