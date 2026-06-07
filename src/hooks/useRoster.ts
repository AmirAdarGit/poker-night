import { useCallback, useEffect, useState } from 'react';
import { addRosterPlayer, fetchRoster, type RosterPlayer } from '../lib/roster';

export interface UseRoster {
  roster: RosterPlayer[];
  loading: boolean;
  // Adds a name to the shared roster and returns the created row (or null).
  add: (name: string) => Promise<RosterPlayer | null>;
}

// Loads the shared player roster once and keeps it sorted by name (Hebrew
// collation) as new players are added on the fly.
export function useRoster(): UseRoster {
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchRoster().then((r) => {
      if (!cancelled) {
        setRoster(r);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const add = useCallback(async (name: string) => {
    const created = await addRosterPlayer(name);
    if (created) {
      setRoster((cur) =>
        [...cur, created].sort((a, b) => a.name.localeCompare(b.name, 'he')),
      );
    }
    return created;
  }, []);

  return { roster, loading, add };
}
