
import { useState, useEffect, useCallback } from 'react';
import { AppState, Grind, Session, GrindStats, Strategy, Milestones, Species, MedalStats, Trophy, GrindNoteZone, MapTiles, Medal, ZoneType } from './types';
import { INITIAL_SPECIES } from './constants';

const STORAGE_KEY = 'great_one_grind_data_v1';

const createDefaultStrategy = (): Strategy => ({
  reservesUsed: [],
  zonesFarmed: '',
  zonesSkipped: '',
  drinkTimes: '',
  lakeRotationOrder: '',
  changesBeforeGO: '',
  lessonsLearned: '',
  finalThoughts: ''
});

const createDefaultMilestones = (): Milestones => ({
  m500: false,
  m1000: false,
  m2500: false,
  personalBest: false,
  greatOneSpawned: false
});

const createDefaultStats = (): GrindStats => ({
  totalKills: 0,
  totalSessions: 0,
  daysGrinding: 0,
  averageKillsPerSession: 0,
  averageKillsPerDay: 0,
  longestDryStreakKills: 0,
  personalBestSessionKills: 0,
  intensityScore: 0
});

const createDefaultMedalStats = (): MedalStats => ({
  attemptsSinceLastDiamond: 0,
  killsSinceLastRare: 0,
  totalGrindKills: 0,
  fabled: 0,
  diamond: 0,
  gold: 0
});

export function useHunterStore() {
  const [state, setState] = useState<AppState & { isSyncing: boolean }>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let baseState: AppState;

    if (saved) {
      baseState = JSON.parse(saved);
      // Migration/Safety check for missing state fields
      if (!baseState.grinds) baseState.grinds = [];
      if (!baseState.species) baseState.species = INITIAL_SPECIES;
      if (!baseState.medals) {
        baseState.medals = {};
        INITIAL_SPECIES.forEach(s => { baseState.medals[s.id] = createDefaultMedalStats(); });
      }
      if (!baseState.trophies) baseState.trophies = [];
      if (!baseState.grindNotes) baseState.grindNotes = {};
      if (!baseState.greatOnes) baseState.greatOnes = {};
    } else {
      const initialMedals: Record<string, MedalStats> = {};
      INITIAL_SPECIES.forEach(s => { initialMedals[s.id] = createDefaultMedalStats(); });

      baseState = {
        grinds: [],
        species: INITIAL_SPECIES,
        medals: initialMedals,
        trophies: [],
        grindNotes: {},
        greatOnes: {},
        hardcoreMode: true,
        comparisonEnabled: false,
        isPremium: false,
        lastUpdated: Date.now(),
        activeReserveId: 'layton',
        customMapTiles: {}
      };
    }
    return { ...baseState, isSyncing: false };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const getToday = () => new Date().toISOString().split('T')[0];

  const calculateStats = (grind: Grind): GrindStats => {
    const totalKills = grind.sessions.reduce((sum, s) => sum + s.kills, 0);
    const totalSessions = grind.sessions.length;
    
    const start = new Date(grind.createdAt);
    const end = grind.obtainedAt ? new Date(grind.obtainedAt) : new Date();
    const daysGrinding = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const averageKillsPerSession = Math.round(totalKills / Math.max(totalSessions, 1));
    const averageKillsPerDay = Math.round(totalKills / Math.max(daysGrinding, 1));
    const personalBestSessionKills = grind.sessions.reduce((max, s) => Math.max(max, s.kills), 0);
    
    // Calculate dry streak based on milestone gaps
    let dryStreak = totalKills;
    const thresholds = [500, 1000, 2500].filter(t => totalKills >= t);
    if (thresholds.length > 0) {
      const segments = [thresholds[0]];
      for (let i = 1; i < thresholds.length; i++) {
        segments.push(thresholds[i] - thresholds[i-1]);
      }
      segments.push(totalKills - thresholds[thresholds.length - 1]);
      dryStreak = Math.max(...segments);
    }

    return {
      totalKills,
      totalSessions,
      daysGrinding,
      averageKillsPerSession,
      averageKillsPerDay,
      longestDryStreakKills: dryStreak,
      personalBestSessionKills,
      intensityScore: averageKillsPerDay
    };
  };

  const updateGrind = (grindId: string, updater: (g: Grind) => Grind) => {
    setState(prev => {
      const newGrinds = prev.grinds.map(g => {
        if (g.grindId !== grindId) return g;
        if (g.obtained) return g; // Grind is locked once obtained
        const updated = updater(g);
        updated.stats = calculateStats(updated);
        // Automatically check off milestones
        updated.milestones.m500 = updated.stats.totalKills >= 500;
        updated.milestones.m1000 = updated.stats.totalKills >= 1000;
        updated.milestones.m2500 = updated.stats.totalKills >= 2500;
        if (updated.stats.personalBestSessionKills > g.stats.personalBestSessionKills) {
          updated.milestones.personalBest = true;
        }
        return updated;
      });
      return { ...prev, grinds: newGrinds, lastUpdated: Date.now(), isSyncing: true };
    });
    setTimeout(() => setState(p => ({ ...p, isSyncing: false })), 300);
  };

  const createGrind = (speciesId: string, reserve: string) => {
    const activeGrinds = state.grinds.filter(g => g.active && !g.obtained);
    if (!state.isPremium && activeGrinds.length >= 1) {
      return { error: 'FREE_LIMIT_REACHED' };
    }

    const newGrind: Grind = {
      grindId: Math.random().toString(36).substr(2, 9),
      speciesId,
      active: true,
      obtained: false,
      createdAt: getToday(),
      obtainedAt: null,
      reservePrimary: reserve,
      sessions: [],
      stats: createDefaultStats(),
      strategy: createDefaultStrategy(),
      milestones: createDefaultMilestones()
    };

    setState(prev => ({
      ...prev,
      grinds: [newGrind, ...prev.grinds],
      lastUpdated: Date.now()
    }));
    return { success: true, grindId: newGrind.grindId };
  };

  const logKills = (grindId: string, amount: number) => {
    if ('vibrate' in navigator) navigator.vibrate(15);
    const today = getToday();
    updateGrind(grindId, g => {
      const sessions = [...g.sessions];
      let currentSession = sessions.find(s => s.date === today);
      
      if (!currentSession) {
        currentSession = {
          sessionId: Math.random().toString(36).substr(2, 9),
          date: today,
          kills: 0,
          notes: ''
        };
        sessions.unshift(currentSession);
      }
      
      currentSession.kills += amount;
      return { ...g, sessions };
    });
  };

  const undoKills = (grindId: string) => {
    const grind = state.grinds.find(g => g.grindId === grindId);
    if (!grind || grind.obtained) return;
    const lastSession = grind.sessions[0];
    if (!lastSession) return;

    updateGrind(grindId, g => {
      const sessions = [...g.sessions];
      const target = sessions[0];
      target.kills = Math.max(0, target.kills - 10); // Standard revert value
      return { ...g, sessions };
    });
  };

  const markObtained = (grindId: string) => {
    setState(prev => ({
      ...prev,
      grinds: prev.grinds.map(g => {
        if (g.grindId !== grindId) return g;
        return {
          ...g,
          obtained: true,
          obtainedAt: getToday(),
          active: false,
          milestones: { ...g.milestones, greatOneSpawned: true }
        };
      }),
      lastUpdated: Date.now()
    }));
  };

  const updateStrategy = (grindId: string, strategy: Partial<Strategy>) => {
    updateGrind(grindId, g => ({
      ...g,
      strategy: { ...g.strategy, ...strategy }
    }));
  };

  const logTrophy = (trophyData: Omit<Trophy, 'id'>) => {
    const newTrophy: Trophy = {
      ...trophyData,
      id: Math.random().toString(36).substr(2, 9)
    };
    setState(prev => ({
      ...prev,
      trophies: [newTrophy, ...prev.trophies],
      lastUpdated: Date.now()
    }));
  };

  const deleteTrophy = (trophyId: string) => {
    setState(prev => ({
      ...prev,
      trophies: prev.trophies.filter(t => t.id !== trophyId),
      lastUpdated: Date.now()
    }));
  };

  const updateMedalCount = (speciesId: string, field: string, value: number) => {
    setState(prev => ({
      ...prev,
      medals: {
        ...prev.medals,
        [speciesId]: {
          ...prev.medals[speciesId],
          [field]: value
        }
      },
      lastUpdated: Date.now()
    }));
  };

  const resetMedalHistory = (speciesId: string) => {
    setState(prev => ({
      ...prev,
      medals: {
        ...prev.medals,
        [speciesId]: createDefaultMedalStats()
      },
      lastUpdated: Date.now()
    }));
  };

  const updateGreatOneStats = (speciesId: string, updates: any) => {
    setState(prev => ({
      ...prev,
      greatOnes: {
        ...prev.greatOnes,
        [speciesId]: {
          ...(prev.greatOnes[speciesId] || { obtained: false, kills: 0, fursFound: [] }),
          ...updates
        }
      },
      lastUpdated: Date.now()
    }));
  };

  const addGrindZone = (speciesId: string, zone: Omit<GrindNoteZone, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setState(prev => {
      const current = prev.grindNotes[speciesId] || { defaultReserveId: 'layton', zones: [], sessions: [] };
      return {
        ...prev,
        grindNotes: {
          ...prev.grindNotes,
          [speciesId]: {
            ...current,
            zones: [...current.zones, { ...zone, id }]
          }
        },
        lastUpdated: Date.now()
      };
    });
  };

  const updateGrindZone = (speciesId: string, zone: GrindNoteZone) => {
    setState(prev => {
      const current = prev.grindNotes[speciesId];
      if (!current) return prev;
      return {
        ...prev,
        grindNotes: {
          ...prev.grindNotes,
          [speciesId]: {
            ...current,
            zones: current.zones.map(z => z.id === zone.id ? zone : z)
          }
        },
        lastUpdated: Date.now()
      };
    });
  };

  const deleteGrindZone = (speciesId: string, zoneId: string) => {
    setState(prev => {
      const current = prev.grindNotes[speciesId];
      if (!current) return prev;
      return {
        ...prev,
        grindNotes: {
          ...prev.grindNotes,
          [speciesId]: {
            ...current,
            zones: current.zones.filter(z => z.id !== zoneId)
          }
        },
        lastUpdated: Date.now()
      };
    });
  };

  const reorderGrindZone = (speciesId: string, zoneId: string, direction: 'up' | 'down') => {
    setState(prev => {
      const current = prev.grindNotes[speciesId];
      if (!current) return prev;
      const zones = [...current.zones];
      const index = zones.findIndex(z => z.id === zoneId);
      if (index === -1) return prev;
      if (direction === 'up' && index > 0) {
        [zones[index], zones[index - 1]] = [zones[index - 1], zones[index]];
      } else if (direction === 'down' && index < zones.length - 1) {
        [zones[index], zones[index + 1]] = [zones[index + 1], zones[index]];
      }
      return {
        ...prev,
        grindNotes: {
          ...prev.grindNotes,
          [speciesId]: { ...current, zones }
        },
        lastUpdated: Date.now()
      };
    });
  };

  const addGrindSession = (speciesId: string, kills: number, notes: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setState(prev => {
      const current = prev.grindNotes[speciesId] || { defaultReserveId: 'layton', zones: [], sessions: [] };
      return {
        ...prev,
        grindNotes: {
          ...prev.grindNotes,
          [speciesId]: {
            ...current,
            sessions: [{ id, date: new Date().toISOString(), killsAdded: kills, notes }, ...current.sessions]
          }
        },
        lastUpdated: Date.now()
      };
    });
  };

  const setSpeciesDefaultReserve = (speciesId: string, reserveId: string) => {
    setState(prev => {
      const current = prev.grindNotes[speciesId] || { defaultReserveId: 'layton', zones: [], sessions: [] };
      return {
        ...prev,
        grindNotes: {
          ...prev.grindNotes,
          [speciesId]: { ...current, defaultReserveId: reserveId }
        },
        lastUpdated: Date.now()
      };
    });
  };

  const getShareableLink = () => btoa(JSON.stringify(state));

  return {
    state,
    createGrind,
    logKills,
    undoKills,
    undoLast: undoKills, // Alias for QuickLog component
    markObtained,
    updateStrategy,
    logTrophy,
    deleteTrophy,
    updateMedalCount,
    resetMedalHistory,
    updateGreatOneStats,
    addGrindZone,
    updateGrindZone,
    deleteGrindZone,
    reorderGrindZone,
    addGrindSession,
    setSpeciesDefaultReserve,
    getShareableLink,
    toggleHardcore: () => setState(p => ({ ...p, hardcoreMode: !p.hardcoreMode })),
    toggleComparison: () => setState(p => ({ ...p, comparisonEnabled: !p.comparisonEnabled })),
    exportData: () => btoa(JSON.stringify(state)),
    importData: (data: string) => {
      try {
        const parsed = JSON.parse(atob(data));
        setState(parsed);
        return true;
      } catch (e) { return false; }
    }
  };
}
