import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Paywall.module.scss';
import { useAuth } from '../../contexts/AuthContext';
import { activatePro, LS_CHECKOUT_URL } from '../../lib/pro';
import { TRIAL_GAMES } from '../../lib/entitlement';

interface Props {
  onClose: () => void;
  // Called after a successful unlock (profile refreshed → caller can proceed).
  onActivated: () => void;
}

export function Paywall({ onClose, onActivated }: Props) {
  const { t } = useTranslation();
  const { entitlement, refreshProfile } = useAuth();
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const reason = entitlement?.reason;
  const headline =
    reason === 'games'
      ? t('paywall.headlineGames', { count: TRIAL_GAMES })
      : reason === 'days'
        ? t('paywall.headlineDays')
        : t('paywall.headlineDefault');

  const handleActivate = async () => {
    setBusy(true);
    setError(null);
    const res = await activatePro(key);
    if (!res.ok) {
      setError(
        res.error === 'empty-key'
          ? t('paywall.errorEmptyKey')
          : t('paywall.errorInvalidKey'),
      );
      setBusy(false);
      return;
    }
    await refreshProfile();
    setBusy(false);
    onActivated();
  };

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
    >
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <span className={styles.badge}>PRO</span>
        <h2 id="paywall-title" className={styles.title}>
          {headline}
        </h2>
        <p className={styles.message}>{t('paywall.message')}</p>

        <ul className={styles.perks}>
          <li>{t('paywall.perkUnlimited')}</li>
          <li>{t('paywall.perkHistory')}</li>
          <li>{t('paywall.perkSupport')}</li>
        </ul>

        {LS_CHECKOUT_URL ? (
          <a
            className={styles.buyButton}
            href={LS_CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('paywall.buy')}
          </a>
        ) : (
          <p className={styles.message}>{t('paywall.comingSoon')}</p>
        )}

        <div className={styles.divider}>
          <span>{t('paywall.alreadyBought')}</span>
        </div>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>{t('paywall.licenseKeyLabel')}</span>
          <input
            className={styles.input}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={busy}
          >
            {t('paywall.notNow')}
          </button>
          <button
            type="button"
            className={styles.activateButton}
            onClick={handleActivate}
            disabled={busy || !key.trim()}
          >
            {busy ? t('paywall.activating') : t('paywall.activate')}
          </button>
        </div>
      </div>
    </div>
  );
}
