import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './App.module.scss';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GroupProvider, useGroup } from './contexts/GroupContext';
import { useGameSync } from './hooks/useGameSync';
import { generateGameId, isValidGameId } from './lib/gameId';
import {
  buildGameUrl,
  clearInviteCodeFromUrl,
  readGameIdFromUrl,
  readInviteCodeFromUrl,
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
import { GroupSwitcher } from './components/GroupSwitcher/GroupSwitcher';
import { NoGroup } from './components/GroupForms/NoGroup';
import { HistoryView } from './components/HistoryView/HistoryView';
import { AdminDashboard } from './components/AdminDashboard/AdminDashboard';
import { Paywall } from './components/Paywall/Paywall';
import { TrialBanner } from './components/TrialBanner/TrialBanner';

type View = 'game' | 'history' | 'auth' | 'admin';

function AppInner() {
  const { t } = useTranslation();
  const { user, profile, loading, entitlement, isAdmin } = useAuth();
  const {
    activeGroupId,
    groups,
    loading: groupsLoading,
    joinByCode,
  } = useGroup();

  const [gameId, setGameId] = useState<string | null>(() => {
    const fromUrl = readGameIdFromUrl();
    return fromUrl && isValidGameId(fromUrl) ? fromUrl : null;
  });
  const [pendingInvite] = useState<string | null>(() =>
    readInviteCodeFromUrl(),
  );
  const joinAttempted = useRef(false);
  const { state, dispatch, syncStatus, lastError, completedAt, closeGame, reopenGame } =
    useGameSync(gameId);

  const [view, setView] = useState<View>('game');
  const [toast, setToast] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

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
    if (lastError) showToast(t('toast.syncError', { error: lastError }));
  }, [lastError, showToast, t]);

  // Redeem a ?join=<code> invite once the user is signed in.
  useEffect(() => {
    if (!user || !pendingInvite || joinAttempted.current) return;
    joinAttempted.current = true;
    void joinByCode(pendingInvite).then((res) => {
      clearInviteCodeFromUrl();
      showToast(
        res.ok
          ? t('toast.joinedGroup', { name: res.group.name })
          : t('toast.invalidInvite'),
      );
    });
  }, [user, pendingInvite, joinByCode, showToast, t]);

  const handleStartGame = useCallback(async () => {
    if (!user || !profile) {
      setView('auth');
      return;
    }
    if (!activeGroupId) {
      showToast(t('toast.selectOrCreateGroup'));
      return;
    }
    // Free trial used up → must unlock Pro before creating a new game.
    if (entitlement?.locked) {
      setShowPaywall(true);
      return;
    }
    if (state.players.length < 2) return;
    const id = generateGameId();
    const next = { ...state, phase: 'playing' as const };
    const result = await createGame(id, user.id, activeGroupId, next);
    if (!result.ok) {
      showToast(t('toast.createGameFailed', { error: result.error }));
      return;
    }
    setGameId(id);
    setGameIdInUrl(id);
    dispatch({ type: 'hydrate', state: next });
  }, [user, profile, activeGroupId, entitlement, state, dispatch, showToast, t]);

  const handleShare = useCallback(async () => {
    if (!gameId) return;
    const url = buildGameUrl(gameId);
    const result = await shareGameLink(
      url,
      t('app.shareTitle'),
      t('app.shareText'),
    );
    if (result.kind === 'copied') showToast(t('toast.linkCopied'));
    else if (result.kind === 'failed') showToast(t('toast.shareFailed'));
  }, [gameId, showToast, t]);

  const handleCloseGame = useCallback(async () => {
    await closeGame();
    showToast(t('toast.gameClosed'));
  }, [closeGame, showToast, t]);

  const handleReopenGame = useCallback(async () => {
    await reopenGame();
    showToast(t('toast.gameReopened'));
  }, [reopenGame, showToast, t]);

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

  if (loading || (user && groupsLoading)) {
    return <div className={styles.loadingScreen}>{t('app.loading')}</div>;
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

      <div className={styles.appbar}>
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
              onOpenAdmin={() => setView('admin')}
            />
            {user && activeGroupId && <GroupSwitcher onToast={showToast} />}
          </div>
          <button
            type="button"
            className={styles.brand}
            onClick={() => setView('game')}
            aria-label={t('app.backToGame')}
          >
            <span className={styles.suit} aria-hidden="true">
              ♠
            </span>
            <h1 className={styles.title}>{t('app.title')}</h1>
            <span className={`${styles.suit} ${styles.suitRed}`} aria-hidden="true">
              ♦
            </span>
          </button>
          <div className={styles.headerEnd}>
            {gameId && (
              <button
                type="button"
                className={styles.shareButton}
                onClick={handleShare}
                aria-label={t('app.shareGame')}
              >
                <span aria-hidden="true">↗</span>
                {t('app.share')}
              </button>
            )}
          </div>
        </header>
      </div>

      <main className={styles.main}>
        {view === 'admin' && isAdmin ? (
          <AdminDashboard onClose={() => setView('game')} />
        ) : view === 'history' && user ? (
          <HistoryView
            onClose={() => setView('game')}
            onOpenGame={handleOpenGame}
          />
        ) : (
          <>
            {gameId && completedAt && (
              <div className={styles.closedBanner}>
                <span>{t('app.closedBanner')}</span>
                <button
                  type="button"
                  className={styles.reopenButton}
                  onClick={handleReopenGame}
                >
                  {t('app.reopen')}
                </button>
              </div>
            )}

            {state.phase === 'setup' && (
              <>
                {!user ? (
                  <div className={styles.signedOutPanel}>
                    <h2 className={styles.signedOutTitle}>
                      {t('signedOut.title')}
                    </h2>
                    <p className={styles.signedOutBody}>
                      {t('signedOut.body')}
                    </p>
                    <button
                      type="button"
                      className={styles.primaryCta}
                      onClick={() => setView('auth')}
                    >
                      {t('signedOut.cta')}
                    </button>
                  </div>
                ) : groups.length === 0 ? (
                  <NoGroup initialJoinCode={pendingInvite ?? undefined} />
                ) : (
                  <>
                    <TrialBanner
                      entitlement={entitlement}
                      onUpgrade={() => setShowPaywall(true)}
                    />
                    <SetupPhase
                      groupId={activeGroupId}
                      players={state.players}
                      dispatch={dispatch}
                      onStartGame={handleStartGame}
                    />
                  </>
                )}
              </>
            )}

            {state.phase === 'playing' && (
              <PlayingPhase
                players={state.players}
                dispatch={dispatch}
                onGoToSettlement={() => dispatch({ type: 'go-to-settlement' })}
                onCloseGame={handleCloseGame}
                onRequestNewGame={() => setConfirmReset(true)}
              />
            )}

            {state.phase === 'settlement' && (
              <SettlementPhase
                players={state.players}
                dispatch={dispatch}
                onBackToPlaying={() => dispatch({ type: 'back-to-playing' })}
                onCloseGame={handleCloseGame}
                onRequestNewGame={() => setConfirmReset(true)}
              />
            )}
          </>
        )}
      </main>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {confirmReset && (
        <ConfirmDialog
          title={t('confirmNewGame.title')}
          message={t('confirmNewGame.message')}
          confirmLabel={t('confirmNewGame.confirm')}
          cancelLabel={t('common.cancel')}
          onConfirm={handleNewGame}
          onCancel={() => setConfirmReset(false)}
        />
      )}

      {showPaywall && (
        <Paywall
          onClose={() => setShowPaywall(false)}
          onActivated={() => {
            setShowPaywall(false);
            void handleStartGame();
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GroupProvider>
        <AppInner />
      </GroupProvider>
    </AuthProvider>
  );
}
