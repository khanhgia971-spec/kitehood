import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'dark' | 'white' | 'milk-white';

interface PrefsState {
  theme: ThemeId;
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  keyboardSound: boolean;
  keyboardVolume: number;
  cursorStyle: 'mac' | 'default';
  showMascot: boolean;
  showWelcome: boolean;
  sidebarWidth: number;
  terminalHeight: number;
  locale: 'vi' | 'en';

  setTheme: (t: ThemeId) => void;
  setFontSize: (n: number) => void;
  setFontFamily: (f: string) => void;
  setTabSize: (n: number) => void;
  setWordWrap: (v: boolean) => void;
  setMinimap: (v: boolean) => void;
  setLineNumbers: (v: boolean) => void;
  setKeyboardSound: (v: boolean) => void;
  setKeyboardVolume: (n: number) => void;
  setCursorStyle: (c: 'mac' | 'default') => void;
  setShowMascot: (v: boolean) => void;
  setShowWelcome: (v: boolean) => void;
  setSidebarWidth: (n: number) => void;
  setTerminalHeight: (n: number) => void;
  setLocale: (l: 'vi' | 'en') => void;
  resetPrefs: () => void;
}

const DEFAULTS: Omit<
  PrefsState,
  | 'setTheme'
  | 'setFontSize'
  | 'setFontFamily'
  | 'setTabSize'
  | 'setWordWrap'
  | 'setMinimap'
  | 'setLineNumbers'
  | 'setKeyboardSound'
  | 'setKeyboardVolume'
  | 'setCursorStyle'
  | 'setShowMascot'
  | 'setShowWelcome'
  | 'setSidebarWidth'
  | 'setTerminalHeight'
  | 'setLocale'
  | 'resetPrefs'
> = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  lineNumbers: true,
  keyboardSound: false,
  keyboardVolume: 0,
  cursorStyle: 'mac',
  showMascot: false,
  showWelcome: true,
  sidebarWidth: 260,
  terminalHeight: 200,
  locale: 'vi',
};

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
      },
      setFontSize: (fontSize) => set({ fontSize: Math.min(24, Math.max(10, fontSize)) }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setTabSize: (tabSize) => set({ tabSize }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
      setMinimap: (minimap) => set({ minimap }),
      setLineNumbers: (lineNumbers) => set({ lineNumbers }),
      setKeyboardSound: (keyboardSound) => set({ keyboardSound }),
      setKeyboardVolume: (keyboardVolume) => set({ keyboardVolume }),
      setCursorStyle: (cursorStyle) => set({ cursorStyle }),
      setShowMascot: (showMascot) => set({ showMascot }),
      setShowWelcome: (showWelcome) => set({ showWelcome }),
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
      setTerminalHeight: (terminalHeight) => set({ terminalHeight }),
      setLocale: (locale) => set({ locale }),
      resetPrefs: () => {
        set({ ...DEFAULTS });
        document.documentElement.setAttribute('data-theme', DEFAULTS.theme);
      },
    }),
    { name: 'moihoccode-prefs-v2' }
  )
);
