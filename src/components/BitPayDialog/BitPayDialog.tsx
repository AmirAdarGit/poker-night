import { useEffect, useState } from 'react';
import styles from './BitPayDialog.module.scss';
import type { Settlement } from '../../types';
import {
  bitInstallUrl,
  bitLaunchUrl,
  displayPhone,
  isAndroid,
  normalizeIsraeliPhone,
} from '../../lib/payShare';

interface Props {
  /** The debt being paid: `from` (debtor) → `to` (creditor). */
  transfer: Settlement;
  /** The creditor's current phone (raw text), possibly empty. */
  creditorPhone: string;
  /** Persists an edited creditor phone back to the game / phone book. */
  onSetCreditorPhone: (phone: string) => void;
  onClose: () => void;
}

/**
 * The honest "Pay with Bit" popup. Bit allows no auto-filled payment from an
 * external site, so this surfaces the amount and recipient number (with copy
 * buttons), then launches the Bit app — the user completes the transfer there.
 */
export function BitPayDialog({
  transfer,
  creditorPhone,
  onSetCreditorPhone,
  onClose,
}: Props) {
  const [draft, setDraft] = useState(creditorPhone);
  const [copied, setCopied] = useState<'amount' | 'phone' | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const normalized = normalizeIsraeliPhone(draft);

  const copy = async (value: string, which: 'amount' | 'phone') => {
    try {
      await navigator.clipboard?.writeText(value);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard unavailable — the value is still visible on screen.
    }
  };

  const openBit = () => {
    if (normalized) onSetCreditorPhone(draft);
    const url = bitLaunchUrl();
    if (isAndroid()) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener');
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bit-title"
    >
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h2 id="bit-title" className={styles.title}>
          תשלום ב-bit
        </h2>
        <p className={styles.line}>
          <strong>{transfer.from}</strong> מעביר ל<strong>{transfer.to}</strong>
        </p>

        <div className={styles.dataRow}>
          <span className={styles.amount}>{transfer.amount} ₪</span>
          <button
            type="button"
            className={styles.copyButton}
            onClick={() => copy(String(transfer.amount), 'amount')}
          >
            {copied === 'amount' ? 'הועתק ✓' : 'העתק סכום'}
          </button>
        </div>

        {normalized ? (
          <div className={styles.dataRow}>
            <span className={styles.phoneValue} dir="ltr">
              {displayPhone(normalized)}
            </span>
            <button
              type="button"
              className={styles.copyButton}
              onClick={() => copy(displayPhone(normalized), 'phone')}
            >
              {copied === 'phone' ? 'הועתק ✓' : 'העתק מספר'}
            </button>
          </div>
        ) : (
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              מספר הטלפון של {transfer.to} ב-bit
            </span>
            <input
              type="tel"
              inputMode="tel"
              dir="ltr"
              className={styles.input}
              placeholder="050-000-0000"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
          </label>
        )}

        <p className={styles.note}>
          ב-bit אי אפשר למלא סכום אוטומטית מאתר חיצוני — העתיקו את הסכום, פתחו
          את האפליקציה והעבירו למספר שמופיע כאן.
        </p>

        <button type="button" className={styles.openButton} onClick={openBit}>
          פתח את bit
        </button>
        <a
          className={styles.installLink}
          href={bitInstallUrl()}
          target="_blank"
          rel="noopener noreferrer"
        >
          אין לך את האפליקציה? להתקנת bit ›
        </a>
        <button type="button" className={styles.closeButton} onClick={onClose}>
          סגירה
        </button>
      </div>
    </div>
  );
}
