import { useCallback, useEffect, useState } from 'react';
import styles from './App.module.scss';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useGameSync } from './hooks/useGameSync';
import { generateGameId, isValidGameId } from './lib/gameId';
import {
  buildGameUrl,
  readGameIdFromUrl,
  setGameIdInUrl,
  shareGameLink,
} from './lib/share';
import { createGame } from './lib/supabase';
import { clearCachedGame } from './lib/storage';
import { SetupPhase } from './components/SetupPhase/SetupPhase';
import { PlayingPhase } from './components/PlayingPhase/PlayingPhase';
import { SettlementPhase } from './components/SettlementPhase/SettlementPhase';
import { OfflineBanner } from './components/OfflineBanner/OfflineBanner';
import { Toast } from './components/Toast/Toast';
import { ConfirmDialog } from './components/ConfirmDialog/ConfirmDialog';
import { AuthScreen } from './components/AuthScreen/AuthScreen';
import { CompleteProfile } from './components/CompleteProfile/CompleteProfile';
import { UserMenu } from './components/UserMenu/UserMenu';
import { HistoryView } from './components/HistoryView/HistoryView';

type View = 'game' | 'history' | 'auth';

function AppInner() {
  const { user, profile, loading } = useAuth();

  const [gameId, setGameId] = useState<string | null>(() => {
    const fromUrl = readGameIdFromUrl();
    return fromUrl && isValidGameId(fromUrl) ? fromUrl : null;
  });
  const { state, dispatch, syncStatus, lastError } = useGameSync(gameId);

  const [view, setView] = useState<View>('game');
  const [toast, setToast] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

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
    if (!user || !profile) {
      setView('auth');
      return;
    }
    if (state.players.length < 2) return;
    const id = generateGameId();
    const next = { ...state, phase: 'playing' as const };
    const result = await createGame(id, user.id, next);
    if (!result.ok) {
      showToast(`לא ניתן ליצור משחק: ${result.error}`);
      return;
    }
    setGameId(id);
    setGameIdInUrl(id);
    dispatch({ type: 'hydrate', state: next });
  }, [user, profile, state, dispatch, showToast]);

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
    setView('game');
  }, [gameId, dispatch]);

  const handleOpenGame = useCallback(
    (id: string) => {
      if (gameId) clearCachedGame(gameId);
      setGameId(id);
      setGameIdInUrl(id);
      dispatch({ type: 'reset' });
      setView('game');
    },
    [gameId, dispatch],
  );

  if (loading) {
    return <div className={styles.loadingScreen}>טוען…</div>;
  }

  // Logged in but no profile row (extremely rare — trigger should populate it).
  if (user && !profile) {
    return <CompleteProfile />;
  }

  if (view === 'auth') {
    return <AuthScreen onCancel={() => setView('game')} />;
  }

  return (
    <div className={styles.app}>
      <OfflineBanner status={syncStatus} />

      <header className={styles.header}>
        <div className={styles.headerStart}>
          <UserMenu
            onOpenHistory={() => {
              if (!user) {
                setView('auth');
                return;
              }
              setView('history');
            }}
            onOpenAuth={() => setView('auth')}
          />
        </div>
        <h1 className={styles.title}>פוקר נייט</h1>
        <div className={styles.headerEnd}>
          {gameId && (
            <button
              type="button"
              className={styles.shareButton}
              onClick={handleShare}
              aria-label="שיתוף קישור למשחק"
            >
              שיתוף
            </button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {view === 'history' && user ? (
          <HistoryView
            onClose={() => setView('game')}
            onOpenGame={handleOpenGame}
          />
        ) : (
          <>
            {state.phase === 'setup' && (
              <>
                {!user ? (
                  <div className={styles.signedOutPanel}>
                    <h2 className={styles.signedOutTitle}>
                      צריך להתחבר כדי ליצור משחק
                    </h2>
                    <p className={styles.signedOutBody}>
                      ההתחברות מאפשרת לשמור היסטוריה ולעקוב אחר רווח/הפסד
                      לאורך זמן. כדי רק לצפות במשחק של חבר — פתחו את הקישור
                      ששלח.
                    </p>
                    <button
                      type="button"
                      className={styles.primaryCta}
                      onClick={() => setView('auth')}
                    >
                      התחברות / הרשמה
                    </button>
                  </div>
                ) : (
                  <SetupPhase
                    players={state.players}
                    dispatch={dispatch}
                    onStartGame={handleStartGame}
                  />
                )}
              </>
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
          </>
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

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
