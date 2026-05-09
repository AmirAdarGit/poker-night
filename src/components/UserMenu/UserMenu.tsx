import { useEffect, useRef, useState } from 'react';
import styles from './UserMenu.module.scss';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  onOpenHistory: () => void;
  onOpenAuth: () => void;
}

export function UserMenu({ onOpenHistory, onOpenAuth }: Props) {
  const { user, profile, signOut } = useAuth();
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

  if (!user) {
    return (
      <button
        type="button"
        className={styles.signInButton}
        onClick={onOpenAuth}
      >
        כניסה
      </button>
    );
  }

  const name = profile?.display_name ?? user.email ?? 'משתמש';
  const initial = name.trim().charAt(0).toUpperCase() || '?';

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
            ההיסטוריה שלי
          </button>
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
          >
            יציאה
          </button>
        </div>
      )}
    </div>
  );
}
