import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  createGroup as createGroupApi,
  fetchMyGroups,
  joinGroupByCode,
  leaveGroup as leaveGroupApi,
  type Group,
} from '../lib/groups';

interface GroupState {
  groups: Group[];
  activeGroup: Group | null;
  activeGroupId: string | null;
  loading: boolean;
  setActiveGroupId: (id: string) => void;
  createGroup: (
    name: string,
  ) => Promise<{ ok: true; group: Group } | { ok: false; error: string }>;
  joinByCode: (
    code: string,
  ) => Promise<{ ok: true; group: Group } | { ok: false; error: string }>;
  leaveGroup: (groupId: string) => Promise<boolean>;
  refreshGroups: () => Promise<void>;
}

const GroupCtx = createContext<GroupState | null>(null);

const activeKey = (userId: string) => `poker-night:active-group:${userId}`;

export function GroupProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setActiveGroupId = useCallback(
    (id: string) => {
      setActiveGroupIdState(id);
      if (user) {
        try {
          localStorage.setItem(activeKey(user.id), id);
        } catch {
          // private mode / quota — ignore, falls back to first group
        }
      }
    },
    [user],
  );

  const load = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setActiveGroupIdState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const mine = await fetchMyGroups();
    setGroups(mine);
    // Restore the persisted choice when it's still valid, else first group.
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(activeKey(user.id));
    } catch {
      stored = null;
    }
    const valid = stored && mine.some((g) => g.id === stored) ? stored : null;
    setActiveGroupIdState(valid ?? mine[0]?.id ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const createGroup = useCallback(
    async (name: string) => {
      if (!user) return { ok: false as const, error: 'not-signed-in' };
      const res = await createGroupApi(name, user.id);
      if (res.ok) {
        setGroups((cur) => [...cur, res.group]);
        setActiveGroupId(res.group.id);
      }
      return res;
    },
    [user, setActiveGroupId],
  );

  const joinByCode = useCallback(
    async (code: string) => {
      const res = await joinGroupByCode(code);
      if (res.ok) {
        setGroups((cur) =>
          cur.some((g) => g.id === res.group.id) ? cur : [...cur, res.group],
        );
        setActiveGroupId(res.group.id);
      }
      return res;
    },
    [setActiveGroupId],
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      if (!user) return false;
      const ok = await leaveGroupApi(groupId, user.id);
      if (ok) {
        setGroups((cur) => {
          const next = cur.filter((g) => g.id !== groupId);
          if (activeGroupId === groupId) {
            setActiveGroupIdState(next[0]?.id ?? null);
          }
          return next;
        });
      }
      return ok;
    },
    [user, activeGroupId],
  );

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) ?? null,
    [groups, activeGroupId],
  );

  const value = useMemo<GroupState>(
    () => ({
      groups,
      activeGroup,
      activeGroupId,
      loading,
      setActiveGroupId,
      createGroup,
      joinByCode,
      leaveGroup,
      refreshGroups: load,
    }),
    [
      groups,
      activeGroup,
      activeGroupId,
      loading,
      setActiveGroupId,
      createGroup,
      joinByCode,
      leaveGroup,
      load,
    ],
  );

  return <GroupCtx.Provider value={value}>{children}</GroupCtx.Provider>;
}

export function useGroup(): GroupState {
  const ctx = useContext(GroupCtx);
  if (!ctx) throw new Error('useGroup must be used inside <GroupProvider>');
  return ctx;
}
