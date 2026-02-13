import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const SAVE_KEY = 'ugf_save_v1';

export interface SaveData {
  userCharacterId: string | null;
  userTeamId: string | null;
  coach: {
    name: string;
    age: number;
    hometown: string;
    personality: string;
  } | null;
  league: {
    season: number;
    week: number;
    phase: string;
  };
  onboarding: {
    interviewsCompleted: string[];
  };
  staffMeetingCompleted: boolean;
}

interface SaveContextType {
  save: SaveData;
  setSave: (updates: Partial<SaveData> | ((prev: SaveData) => SaveData)) => void;
  clearSave: () => void;
  loadSave: () => SaveData | null;
}

const defaultSave: SaveData = {
  userCharacterId: null,
  userTeamId: null,
  coach: null,
  league: {
    season: 2026,
    week: 1,
    phase: 'preseason',
  },
  onboarding: {
    interviewsCompleted: [],
  },
  staffMeetingCompleted: false,
};

const SaveContext = createContext<SaveContextType | undefined>(undefined);

export function SaveProvider({ children }: { children: ReactNode }) {
  const [save, setSaveState] = useState<SaveData>(defaultSave);

  // Load save from localStorage on mount
  useEffect(() => {
    const loaded = loadSave();
    if (loaded) {
      setSaveState(loaded);
    }
  }, []);

  const loadSave = (): SaveData | null => {
    try {
      const stored = localStorage.getItem(SAVE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load save:', error);
    }
    return null;
  };

  const writeSave = (data: SaveData) => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to write save:', error);
    }
  };

  const setSave = (updates: Partial<SaveData> | ((prev: SaveData) => SaveData)) => {
    setSaveState((prev) => {
      const newSave = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      writeSave(newSave);
      return newSave;
    });
  };

  const clearSave = () => {
    localStorage.removeItem(SAVE_KEY);
    setSaveState(defaultSave);
  };

  return (
    <SaveContext.Provider value={{ save, setSave, clearSave, loadSave }}>
      {children}
    </SaveContext.Provider>
  );
}

export function useSave() {
  const context = useContext(SaveContext);
  if (!context) {
    throw new Error('useSave must be used within SaveProvider');
  }
  return context;
}
