import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './UserMenu.module.scss';
import { useAuth } from '../../contexts/AuthContext';
import { setLocale, TIP_JAR_URL } from '../../lib/locale';
import { SUPPORTED_LANGS } from '../../i18n';

interface Props {
  onOpenHistory: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
}

// Native language names for the switcher — never translated.
const LANG_NAMES: Record<string, string> = {
  he: 'עברית',
  en: 'English',
  es: 'Español',
  pt: 'Português',
  ru: 'Русский',
  de: 'Deutsch',
};

export function UserMenu({ onOpenHistory, onOpenAuth, onOpenAdmin }: Props) {
  const { t, i18n } = useTranslation();
  const { user, profile, signOut, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const changeLanguage = (code: string) => {
    void i18n.changeLanguage(code);
    if (user) void setLocale(user.id, code);
  };

  if (!user) {
    return (
      <button
        type="button"
        className={styles.signInButton}
        onClick={onOpenAuth}
      >
        {t('userMenu.signIn')}
      </button>
    );
  }

  const name = profile?.display_name ?? user.email ?? t('userMenu.fallbackName');
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const current = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.avatar}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initial}
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHeader}>
            <span className={styles.menuName}>{name}</span>
            {user.email && (
              <span className={styles.menuEmail}>{user.email}</span>
            )}
          </div>
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => {
              setOpen(false);
              onOpenHistory();
            }}
          >
            {t('userMenu.history')}
          </button>
          {isAdmin && (
            <button
              type="button"
              className={styles.menuItem}
              onClick={() => {
                setOpen(false);
                onOpenAdmin();
              }}
            >
              {t('userMenu.admin')}
            </button>
          )}
          {TIP_JAR_URL && (
            <a
              className={styles.menuItem}
              href={TIP_JAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {t('userMenu.tipJar')}
            </a>
          )}

          <div className={styles.menuSection}>
            <span className={styles.menuSectionLabel}>
              {t('userMenu.language')}
            </span>
            <div className={styles.langGrid}>
              {SUPPORTED_LANGS.map((code) => (
                <button
                  key={code}
                  type="button"
                  className={`${styles.langOption} ${
                    code === current ? styles.langActive : ''
                  }`}
                  onClick={() => changeLanguage(code)}
                  aria-pressed={code === current}
                >
                  {LANG_NAMES[code]}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className={styles.menuItem}
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
          >
            {t('userMenu.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
