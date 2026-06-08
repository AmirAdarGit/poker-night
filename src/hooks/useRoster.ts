import { useCallback, useEffect, useState } from 'react';
import { addRosterPlayer, fetchRoster, type RosterPlayer } from '../lib/roster';

export interface UseRoster {
  roster: RosterPlayer[];
  loading: boolean;
  // Adds a name to the active group's roster and returns the created row.
  add: (name: string) => Promise<RosterPlayer | null>;
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

  const add = useCallback(
    async (name: string) => {
      const created = await addRosterPlayer(groupId, name);
      if (created) {
        setRoster((cur) =>
          [...cur, created].sort((a, b) => a.name.localeCompare(b.name, 'he')),
        );
      }
      return created;
    },
    [groupId],
  );

  return { roster, loading, add };
}
