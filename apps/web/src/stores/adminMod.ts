import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BanRecord = {
  userId: string;
  email?: string;
  reason: string;
  contactEmail: string;
  at: number;
};

export type VipGrant = {
  userId: string;
  email?: string;
  note?: string;
  at: number;
};

interface AdminModState {
  bans: BanRecord[];
  vips: VipGrant[];
  banUser: (r: Omit<BanRecord, 'at'>) => void;
  unbanUser: (userId: string) => void;
  grantVip: (r: Omit<VipGrant, 'at'>) => void;
  revokeVip: (userId: string) => void;
  isBanned: (userId?: string | null, email?: string | null) => BanRecord | null;
  isVip: (userId?: string | null, email?: string | null) => boolean;
}

export const useAdminModStore = create<AdminModState>()(
  persist(
    (set, get) => ({
      bans: [],
      vips: [],
      banUser: (r) =>
        set((s) => ({
          bans: [
            ...s.bans.filter((b) => b.userId !== r.userId),
            { ...r, at: Date.now() },
          ],
        })),
      unbanUser: (userId) => set((s) => ({ bans: s.bans.filter((b) => b.userId !== userId) })),
      grantVip: (r) =>
        set((s) => ({
          vips: [
            ...s.vips.filter((v) => v.userId !== r.userId),
            { ...r, at: Date.now() },
          ],
        })),
      revokeVip: (userId) => set((s) => ({ vips: s.vips.filter((v) => v.userId !== userId) })),
      isBanned: (userId, email) => {
        const b = get().bans.find(
          (x) =>
            (userId && x.userId === userId) ||
            (email && x.email && x.email.toLowerCase() === email.toLowerCase())
        );
        return b || null;
      },
      isVip: (userId, email) =>
        get().vips.some(
          (x) =>
            (userId && x.userId === userId) ||
            (email && x.email && x.email.toLowerCase() === email.toLowerCase())
        ),
    }),
    { name: 'kitehood-admin-mod-v1' }
  )
);
