import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MusicState {
  developerToken: string;
  enabled: boolean;
  setDeveloperToken: (t: string) => void;
  setEnabled: (v: boolean) => void;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set) => ({
      developerToken: '',
      enabled: false,
      setDeveloperToken: (developerToken) => set({ developerToken }),
      setEnabled: (enabled) => set({ enabled }),
    }),
    { name: 'kitehood-music-v1' }
  )
);
