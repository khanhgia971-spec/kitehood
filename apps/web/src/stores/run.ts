import { create } from 'zustand';

/** Any language id used in IDE / Piston */
export type Lang = string;

interface RunState {
  language: Lang;
  stdin: string;
  stdout: string;
  stderr: string;
  status: 'idle' | 'running' | 'success' | 'error';
  exitCode: number | null;
  timeMs: number | null;
  memoryKb: number | null;
  userPinnedLang: boolean;
  setLanguage: (l: Lang, pinned?: boolean) => void;
  setStdin: (s: string) => void;
  setResult: (r: Partial<RunState>) => void;
  reset: () => void;
  clearPin: () => void;
}

export const useRunStore = create<RunState>((set) => ({
  language: 'javascript',
  stdin: '',
  stdout: '',
  stderr: '',
  status: 'idle',
  exitCode: null,
  timeMs: null,
  memoryKb: null,
  userPinnedLang: false,
  setLanguage: (language, pinned) =>
    set({
      language,
      userPinnedLang: pinned === true,
    }),
  setStdin: (stdin) => set({ stdin }),
  setResult: (r) => set(r),
  reset: () =>
    set({
      stdout: '',
      stderr: '',
      status: 'idle',
      exitCode: null,
      timeMs: null,
      memoryKb: null,
    }),
  clearPin: () => set({ userPinnedLang: false }),
}));
