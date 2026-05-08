import { useCallback, useEffect, useState } from 'react';
import styles from './App.module.scss';
import { useGameSync } from './hooks/useGameSync';
import { generateGameId, isValidGameId } from './lib/gameId';
import {
  buildGameUrl,
  readGameIdFromUrl,
  setGameIdInUrl,
  shareGameLink,
} from './lib/share';
import { upsertGame } from './lib/supabase';
import { clearCachedGame } from './lib/storage';
import { SetupPhase } from './components/SetupPhase/SetupPhase';
import { PlayingPhase } from './components/PlayingPhase/PlayingPhase';
import { SettlementPhase } from './components/SettlementPhase/SettlementPhase';
import { OfflineBanner } from './components/OfflineBanner/OfflineBanner';
import { Toast } from './components/Toast/Toast';
import { ConfirmDialog } from './components/ConfirmDialog/ConfirmDialog';

export default function App() {
  const [gameId, setGameId] = useState<string | null>(() => {
    const fromUrl = readGameIdFromUrl();
    return fromUrl && isValidGameId(fromUrl) ? fromUrl : null;
  });
  const { state, dispatch, syncStatus, lastError } = useGameSync(gameId);

  const [toast, setToast] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  // Keep URL in sync with state.
  useEffect(() => {
    if (state.phase === 'setup' && !gameId) {
      setGameIdInUrl(null);
    } else if (gameId) {
      setGameIdInUrl(gameId);
    }
  }, [gameId, state.phase]);

  useEffect(() => {
    if (lastError) showToast(`שגיאת סנכרון: ${lastError}`);
  }, [lastError, showToast]);

  const handleStartGame = useCallback(async () => {
    if (state.players.length < 2) return;
    const id = generateGameId();
    const next = { ...state, phase: 'playing' as const };
    // Create the row first (best effort) so the share link works immediately.
    const result = await upsertGame(id, next);
    if (!result.ok) {
      showToast(`לא ניתן ליצור משחק: ${result.error}`);
      // We still proceed locally — useGameSync will retry on the next dispatch.
    }
    setGameId(id);
    setGameIdInUrl(id);
    dispatch({ type: 'hydrate', state: next });
  }, [state, dispatch, showToast]);

  const handleShare = useCallback(async () => {
    if (!gameId) return;
    const url = buildGameUrl(gameId);
    const result = await shareGameLink(
      url,
      'פוקר נייט',
      'הצטרפו לצפייה במשחק בזמן אמת',
    );
    if (result.kind === 'copied') showToast('הקישור הועתק');
    else if (result.kind === 'failed') showToast('שיתוף נכשל');
  }, [gameId, showToast]);

  const handleNewGame = useCallback(() => {
    if (gameId) clearCachedGame(gameId);
    setGameId(null);
    setGameIdInUrl(null);
    dispatch({ type: 'reset' });
    setConfirmReset(false);
  }, [gameId, dispatch]);

  return (
    <div className={styles.app}>
      <OfflineBanner status={syncStatus} />

      <header className={styles.header}>
        <h1 className={styles.title}>פוקר נייט</h1>
        {gameId && (
          <button
            type="button"
            className={styles.shareButton}
            onClick={handleShare}
            aria-label="שיתוף קישור למשחק"
          >
            שיתוף קישור
          </button>
        )}
      </header>

      <main className={styles.main}>
        {state.phase === 'setup' && (
          <SetupPhase
            players={state.players}
            dispatch={dispatch}
            onStartGame={handleStartGame}
          />
        )}

        {state.phase === 'playing' && (
          <PlayingPhase
            players={state.players}
            dispatch={dispatch}
            onGoToSettlement={() => dispatch({ type: 'go-to-settlement' })}
            onRequestNewGame={() => setConfirmReset(true)}
          />
        )}

        {state.phase === 'settlement' && (
          <SettlementPhase
            players={state.players}
            onBackToPlaying={() => dispatch({ type: 'back-to-playing' })}
            onRequestNewGame={() => setConfirmReset(true)}
          />
        )}
      </main>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {confirmReset && (
        <ConfirmDialog
          title="משחק חדש?"
          message="הפעולה תנקה את המשחק הנוכחי במכשיר זה ותתחיל מחדש. המשחק הקיים יישאר זמין דרך הקישור."
          confirmLabel="התחל משחק חדש"
          cancelLabel="ביטול"
          onConfirm={handleNewGame}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}
