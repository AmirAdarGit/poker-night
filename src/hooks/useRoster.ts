import { useCallback, useEffect, useState } from 'react';
import {
  addRosterPlayer,
  deleteRosterPlayer,
  fetchRoster,
  renameRosterPlayer,
  type RosterPlayer,
} from '../lib/roster';

export interface UseRoster {
  roster: RosterPlayer[];
  loading: boolean;
  // Adds a name to the active group's roster and returns the created row.
  add: (name: string) => Promise<RosterPlayer | null>;
  // Renames a roster player; returns the updated row (null on dup/failure).
  rename: (id: string, name: string) => Promise<RosterPlayer | null>;
  // Removes a roster player; returns true on success.
  remove: (id: string) => Promise<boolean>;
}

// Loads a group's player roster and keeps it sorted by name (Hebrew collation)
// as players are added on the fly. Re-fetches when the active group changes.
export function useRoster(groupId: string | null): UseRoster {
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRoster(groupId).then((r) => {
      if (!cancelled) {
        setRoster(r);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const sortByName = (list: RosterPlayer[]) =>
    [...list].sort((a, b) => a.name.localeCompare(b.name, 'he'));

  const add = useCallback(
    async (name: string) => {
      const created = await addRosterPlayer(groupId, name);
      if (created) setRoster((cur) => sortByName([...cur, created]));
      return created;
    },
    [groupId],
  );

  const rename = useCallback(async (id: string, name: string) => {
    const updated = await renameRosterPlayer(id, name);
    if (updated) {
      setRoster((cur) =>
        sortByName(cur.map((r) => (r.id === id ? updated : r))),
      );
    }
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    const ok = await deleteRosterPlayer(id);
    if (ok) setRoster((cur) => cur.filter((r) => r.id !== id));
    return ok;
  }, []);

  return { roster, loading, add, rename, remove };
}
