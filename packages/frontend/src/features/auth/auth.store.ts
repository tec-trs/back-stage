import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  code: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface OrgOption {
  id: string;
  slug: string;
  name: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  organizationId: string | null;
  organizationName: string | null;
  organizations: OrgOption[];
  setSession: (accessToken: string, user: AuthUser, organizationId: string, organizationName: string) => void;
  setOrganizations: (organizations: OrgOption[]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      organizationId: null,
      organizationName: null,
      organizations: [],
      setSession: (accessToken, user, organizationId, organizationName) =>
        set({ accessToken, user, organizationId, organizationName }),
      setOrganizations: (organizations) => set({ organizations }),
      logout: () =>
        set({ accessToken: null, user: null, organizationId: null, organizationName: null, organizations: [] }),
    }),
    { name: 'back-stage-auth' },
  ),
);
