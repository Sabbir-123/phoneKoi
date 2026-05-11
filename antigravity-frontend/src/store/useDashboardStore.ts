import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'english' | 'banglish';
type AiMode = 'simple' | 'detailed' | 'technical';

interface DashboardState {
  language: Language;
  hasSelectedLanguage: boolean;
  aiMode: AiMode;
  sidebarOpen: boolean;
  setLanguage: (lang: Language) => void;
  setHasSelectedLanguage: (selected: boolean) => void;
  setAiMode: (mode: AiMode) => void;
  toggleSidebar: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      language: 'english',
      hasSelectedLanguage: false,
      aiMode: 'simple',
      sidebarOpen: false,
      setLanguage: (lang) => set({ language: lang }),
      setHasSelectedLanguage: (selected) => set({ hasSelectedLanguage: selected }),
      setAiMode: (mode) => set({ aiMode: mode }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'dashboard-storage',
    }
  )
);
