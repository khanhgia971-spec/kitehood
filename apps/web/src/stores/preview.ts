import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreviewState {
  open: boolean;
  device: 'desktop' | 'tablet' | 'phone';
  html: string;
  /** File id mac dinh khi F5 / mo lai web (persist) */
  defaultFileId: string | null;
  /** File dang duoc Preview trong session (doi tab + bam Preview thi doi) */
  previewSourceId: string | null;
  refreshToken: number;
  linkPickMode: boolean;
  setOpen: (v: boolean) => void;
  setDevice: (d: PreviewState['device']) => void;
  setHtml: (h: string) => void;
  setDefaultFileId: (id: string | null) => void;
  setPreviewSourceId: (id: string | null) => void;
  requestRefresh: () => void;
  setLinkPickMode: (v: boolean) => void;
  /** Bam Preview tren tab dang mo */
  previewActiveFile: (fileId: string) => void;
}

export const usePreviewStore = create<PreviewState>()(
  persist(
    (set) => ({
      open: false,
      device: 'desktop',
      html: '',
      defaultFileId: null,
      previewSourceId: null,
      refreshToken: 0,
      linkPickMode: false,
      setOpen: (open) => set({ open }),
      setDevice: (device) => set({ device }),
      setHtml: (html) => set({ html }),
      setDefaultFileId: (defaultFileId) => set({ defaultFileId }),
      setPreviewSourceId: (previewSourceId) => set({ previewSourceId }),
      requestRefresh: () => set((s) => ({ refreshToken: s.refreshToken + 1 })),
      setLinkPickMode: (linkPickMode) => set({ linkPickMode }),
      previewActiveFile: (fileId) =>
        set((s) => ({
          open: false,
          previewSourceId: fileId,
          refreshToken: s.refreshToken + 1,
        })),
    }),
    {
      name: 'mhc-preview-prefs-v2',
      partialize: (s) => ({
        defaultFileId: s.defaultFileId,
        device: s.device,
        // KHONG persist previewSourceId — moi session chi default khi reload
      }),
    }
  )
);
