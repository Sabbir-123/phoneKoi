import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_URL, authFetch } from '@/utils/api';
import { createClient } from '@/utils/supabase/client';

export type Language = 'english' | 'banglish';
export type AiMode = 'simple' | 'detailed' | 'technical';

export interface UserProfile {
  id?: string;
  email: string;
  displayName?: string;
  phone?: string;
  whatsapp?: string;
  telegramChatId?: string;
  address?: string;
  avatar?: string;
  avatarUrl?: string;
  role: 'ADMIN' | 'USER';
  plan?: string;
  isPro?: boolean;
  searchLimit?: number;
  searchesLeft?: number;
  reportLimit?: number;
  reportsLeft?: number;
  hasClaimedPromo?: boolean;
  isProfileComplete?: boolean;
}

interface DashboardState {
  language: Language;
  hasSelectedLanguage: boolean;
  aiMode: AiMode;
  sidebarOpen: boolean;
  profile: UserProfile | null;
  profileLoading: boolean;
  profileLastFetched: number | null;
  setLanguage: (lang: Language) => void;
  setHasSelectedLanguage: (selected: boolean) => void;
  setAiMode: (mode: AiMode) => void;
  toggleSidebar: () => void;
  setProfile: (profile: UserProfile | null) => void;
  fetchProfile: (force?: boolean) => Promise<UserProfile | null>;
}

// In-flight promise tracker to deduplicate simultaneous requests
let inFlightFetch: Promise<UserProfile | null> | null = null;

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      language: 'english',
      hasSelectedLanguage: false,
      aiMode: 'simple',
      sidebarOpen: false,
      profile: null,
      profileLoading: false,
      profileLastFetched: null,

      setLanguage: (lang) => set({ language: lang }),
      setHasSelectedLanguage: (selected) => set({ hasSelectedLanguage: selected }),
      setAiMode: (mode) => set({ aiMode: mode }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setProfile: (profile) => set({ profile, profileLastFetched: Date.now() }),

      fetchProfile: async (force = false) => {
        const { profile, profileLastFetched } = get();
        const now = Date.now();

        // If cached within the last 15 seconds and not forced, return immediately
        if (!force && profile && profileLastFetched && now - profileLastFetched < 15000) {
          return profile;
        }

        // If there is already an in-flight request, reuse it instead of creating another one
        if (inFlightFetch) {
          return inFlightFetch;
        }

        inFlightFetch = (async () => {
          try {
            set({ profileLoading: true });
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const email = session?.user?.email;

            if (!email) {
              set({ profile: null, profileLoading: false });
              return null;
            }

            const res = await authFetch(`${API_URL}/users/profile?email=${encodeURIComponent(email)}`);
            if (res.ok) {
              const data = await res.json();
              set({ profile: data, profileLoading: false, profileLastFetched: Date.now() });
              return data;
            }
          } catch (err) {
            console.error('Error in fetchProfile store action:', err);
          } finally {
            set({ profileLoading: false });
            inFlightFetch = null;
          }
          return get().profile;
        })();

        return inFlightFetch;
      },
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        language: state.language,
        hasSelectedLanguage: state.hasSelectedLanguage,
        aiMode: state.aiMode,
      }),
    }
  )
);
