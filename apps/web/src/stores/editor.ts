import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useFSStore } from './fs';

export interface Tab {
  id: string;
  fileId: string;
  name: string;
  path: string;
  language: string;
  isDirty: boolean;
}

interface EditorState {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (fileId: string) => void;
  closeTab: (id: string) => void;
  closeOthers: (id: string) => void;
  closeToTheRight: (id: string) => void;
  closeAll: () => void;
  setActive: (id: string) => void;
  markDirty: (id: string, dirty: boolean) => void;
  reorder: (from: number, to: number) => void;
  updateTabLanguage: (id: string, language: string) => void;
  /** Remove tabs whose file was deleted from FS */
  pruneDeleted: (deletedIds: Set<string> | string[]) => void;
  /** Sync tab names/languages from FS */
  syncFromFS: () => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      openTab: (fileId) => {
        const fs = useFSStore.getState();
        const node = fs.nodes[fileId];
        if (!node || node.type !== 'file') return;

        set((s) => {
          const exists = s.tabs.find((t) => t.fileId === fileId);
          if (exists) return { activeTabId: exists.id };
          const tab: Tab = {
            id: fileId,
            fileId,
            name: node.name,
            path: fs.getPath(fileId),
            language: node.language || 'plaintext',
            isDirty: false,
          };
          return { tabs: [...s.tabs, tab], activeTabId: tab.id };
        });
      },

      closeTab: (id) =>
        set((s) => {
          const idx = s.tabs.findIndex((t) => t.id === id);
          if (idx < 0) return s;
          const tabs = s.tabs.filter((t) => t.id !== id);
          let activeTabId = s.activeTabId;
          if (s.activeTabId === id) {
            activeTabId = tabs[Math.min(idx, tabs.length - 1)]?.id || null;
          }
          return { tabs, activeTabId };
        }),

      closeOthers: (id) =>
        set((s) => ({
          tabs: s.tabs.filter((t) => t.id === id),
          activeTabId: id,
        })),

      closeToTheRight: (id) =>
        set((s) => {
          const idx = s.tabs.findIndex((t) => t.id === id);
          if (idx < 0) return s;
          return {
            tabs: s.tabs.slice(0, idx + 1),
            activeTabId: id,
          };
        }),

      closeAll: () => set({ tabs: [], activeTabId: null }),

      setActive: (id) => {
        const { tabs } = get();
        // Only activate if tab still exists
        if (tabs.some((t) => t.id === id)) {
          set({ activeTabId: id });
        }
      },

      markDirty: (id, dirty) =>
        set((s) => ({
          tabs: s.tabs.map((t) => (t.id === id ? { ...t, isDirty: dirty } : t)),
        })),

      reorder: (from, to) =>
        set((s) => {
          const tabs = [...s.tabs];
          const [item] = tabs.splice(from, 1);
          tabs.splice(to, 0, item);
          return { tabs };
        }),

      updateTabLanguage: (id, language) =>
        set((s) => ({
          tabs: s.tabs.map((t) => (t.id === id ? { ...t, language } : t)),
        })),

      pruneDeleted: (deletedIds) => {
        const setIds = deletedIds instanceof Set ? deletedIds : new Set(deletedIds);
        set((s) => {
          const tabs = s.tabs.filter((t) => !setIds.has(t.fileId) && !setIds.has(t.id));
          let activeTabId = s.activeTabId;
          if (activeTabId && setIds.has(activeTabId)) {
            activeTabId = tabs[tabs.length - 1]?.id || null;
          }
          return { tabs, activeTabId };
        });
      },

      syncFromFS: () => {
        const fs = useFSStore.getState();
        set((s) => {
          const tabs = s.tabs
            .filter((t) => fs.nodes[t.fileId]?.type === 'file')
            .map((t) => {
              const n = fs.nodes[t.fileId];
              return {
                ...t,
                name: n.name,
                path: fs.getPath(t.fileId),
                language: n.language || t.language,
              };
            });
          let activeTabId = s.activeTabId;
          if (activeTabId && !tabs.some((t) => t.id === activeTabId)) {
            activeTabId = tabs[tabs.length - 1]?.id || null;
          }
          return { tabs, activeTabId };
        });
      },
    }),
    {
      name: 'kitehood-tabs',
      partialize: (s) => ({ tabs: s.tabs, activeTabId: s.activeTabId }),
    }
  )
);
