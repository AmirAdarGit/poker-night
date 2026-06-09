import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SettlementPhase.module.scss';
import type { Player, Settlement } from '../../types';
import { getNet, sumBuyIns, totalCashedOut, totalPot } from '../../types';
import type { Action } from '../../reducer/gameReducer';
import { calculateSettlements } from '../../lib/settlement';
import {
  buildDebtReminder,
  buildSettlementSummary,
  normalizeIsraeliPhone,
  whatsappDirectUrl,
  whatsappShareUrl,
} from '../../lib/payShare';
import { getRememberedPhone, rememberPhone } from '../../lib/phoneBook';
import { BitPayDialog } from '../BitPayDialog/BitPayDialog';

interface Props {
  players: Player[];
  dispatch: (a: Action) => void;
  onBackToPlaying: () => void;
  onCloseGame: () => void;
  onRequestNewGame: () => void;
}

export function SettlementPhase({
  players,
  dispatch,
  onBackToPlaying,
  onCloseGame,
  onRequestNewGame,
}: Props) {
  const { t } = useTranslation();
  const ranked = useMemo(
    () =>
      [...players].sort((a, b) => {
        const aActive = a.cashedOut === null;
        const bActive = b.cashedOut === null;
        if (aActive && !bActive) return 1;
        if (!aActive && bActive) return -1;
        return getNet(b) - getNet(a);
      }),
    [players],
  );

  const transfers = useMemo(() => calculateSettlements(players), [players]);
  const stillIn = players.filter((p) => p.cashedOut === null);
  const pot = totalPot(players);
  const out = totalCashedOut(players);
  const diff = out - pot;
  const balanced = stillIn.length === 0 && diff === 0;
  const anyResults = players.some((p) => p.cashedOut !== null);

  // Local phone map is the UI source of truth: it lights up the action buttons
  // immediately, while `dispatch` keeps the synced game state in step.
  const [phones, setPhones] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const p of players) {
      init[p.id] = p.phone ?? getRememberedPhone(p.name) ?? '';
    }
    return init;
  });
  const [phonesOpen, setPhonesOpen] = useState(false);
  const [bitTarget, setBitTarget] = useState<Settlement | null>(null);

  // Only the people involved in a transfer need a phone number.
  const participants = useMemo(() => {
    const ids = new Set<string>();
    for (const t of transfers) {
      ids.add(t.fromId);
      ids.add(t.toId);
    }
    return players.filter((p) => ids.has(p.id));
  }, [transfers, players]);

  const commitPhone = (id: string, name: string, value: string) => {
    setPhones((m) => ({ ...m, [id]: value }));
    dispatch({ type: 'set-player-phone', id, phone: value });
    if (normalizeIsraeliPhone(value)) rememberPhone(name, value);
  };

  const handleShareSummary = () => {
    const text = buildSettlementSummary(players, transfers);
    window.open(whatsappShareUrl(text), '_blank', 'noopener');
  };

  const handleRemind = (t: Settlement) => {
    const phone = normalizeIsraeliPhone(phones[t.fromId] ?? '');
    if (!phone) {
      // No number yet — open the panel so the host can add one.
      setPhonesOpen(true);
      return;
    }
    window.open(
      whatsappDirectUrl(phone, buildDebtReminder(t)),
      '_blank',
      'noopener',
    );
  };

  return (
    <section className={styles.phase}>
      <h2 className={styles.heading}>{t('settlement.heading')}</h2>

      {!balanced && (
        <div className={styles.warning}>
          {stillIn.length > 0 ? (
            <>
              <strong>{t('settlement.stillInLabel')}</strong>{' '}
              {stillIn.map((p) => p.name).join(', ')}
            </>
          ) : (
            <>
              <strong>{t('settlement.unbalancedLabel')}</strong>{' '}
              {t('settlement.unbalancedDetail', {
                pot,
                out,
                diff: `${diff > 0 ? '+' : ''}${diff}`,
              })}
            </>
          )}
        </div>
      )}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('settlement.results')}</h3>
        <ul className={styles.results}>
          {ranked.map((p) => {
            const invested = sumBuyIns(p);
            const isOut = p.cashedOut !== null;
            const net = getNet(p);
            return (
              <li key={p.id} className={styles.resultRow}>
                <div className={styles.resultIdentity}>
                  <span className={styles.resultName}>{p.name}</span>
                  <span className={styles.resultMeta}>
                    {isOut
                      ? t('settlement.cashedOutMeta', {
                          cashedOut: p.cashedOut,
                          invested,
                        })
                      : t('settlement.stillInMeta', { invested })}
                  </span>
                </div>
                {isOut ? (
                  <span
                    className={`${styles.resultNet} ${
                      net >= 0 ? styles.resultNetPos : styles.resultNetNeg
                    }`}
                  >
                    {net >= 0 ? '+' : ''}
                    {net} {t('common.currency')}
                  </span>
                ) : (
                  <span className={styles.resultActive}>{t('settlement.active')}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('settlement.transfersTitle')}</h3>
        {transfers.length === 0 ? (
          <div className={styles.empty}>
            {stillIn.length > 0
              ? t('settlement.transfersAfterCashOut')
              : t('settlement.noTransfersBalanced')}
          </div>
        ) : (
          <>
            {participants.length > 0 && (
              <div className={styles.phonePanel}>
                <button
                  type="button"
                  className={styles.phoneToggle}
                  onClick={() => setPhonesOpen((o) => !o)}
                  aria-expanded={phonesOpen}
                >
                  <span>{t('settlement.phonesToggle')}</span>
                  <span aria-hidden="true">{phonesOpen ? '▲' : '▼'}</span>
                </button>
                {phonesOpen && (
                  <ul className={styles.phoneList}>
                    {participants.map((p) => (
                      <li key={p.id} className={styles.phoneItem}>
                        <span className={styles.phoneName}>{p.name}</span>
                        <input
                          type="tel"
                          inputMode="tel"
                          dir="ltr"
                          className={styles.phoneInput}
                          placeholder={t('settlement.phonePlaceholder')}
                          defaultValue={phones[p.id] ?? ''}
                          onBlur={(e) =>
                            commitPhone(p.id, p.name, e.target.value)
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <ul className={styles.transfers}>
              {transfers.map((tr, i) => (
                <li
                  key={`${tr.fromId}-${tr.toId}-${i}`}
                  className={styles.transferRow}
                >
                  <div className={styles.transferMain}>
                    <span className={styles.transferFrom}>{tr.from}</span>
                    <span className={styles.transferArrow}>←</span>
                    <span className={styles.transferAmount}>
                      {tr.amount} {t('common.currency')}
                    </span>
                    <span className={styles.transferArrow}>←</span>
                    <span className={styles.transferTo}>{tr.to}</span>
                  </div>
                  <div className={styles.transferActions}>
                    <button
                      type="button"
                      className={styles.bitButton}
                      onClick={() => setBitTarget(tr)}
                    >
                      {t('settlement.payWithBit')}
                    </button>
                    <button
                      type="button"
                      className={styles.remindButton}
                      onClick={() => handleRemind(tr)}
                    >
                      {t('settlement.remindWhatsapp')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {anyResults && (
          <button
            type="button"
            className={styles.shareSummaryButton}
            onClick={handleShareSummary}
          >
            {t('settlement.shareSummary')}
          </button>
        )}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBackToPlaying}
        >
          {t('settlement.backToGame')}
        </button>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onCloseGame}
        >
          {t('settlement.closeGame')}
        </button>
        <button
          type="button"
          className={styles.newGameButton}
          onClick={onRequestNewGame}
        >
          {t('settlement.newGame')}
        </button>
      </div>

      {bitTarget && (
        <BitPayDialog
          transfer={bitTarget}
          creditorPhone={phones[bitTarget.toId] ?? ''}
          onSetCreditorPhone={(phone) =>
            commitPhone(bitTarget.toId, bitTarget.to, phone)
          }
          onClose={() => setBitTarget(null)}
        />
      )}
    </section>
  );
}
