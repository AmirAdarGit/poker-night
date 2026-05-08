import { useEffect } from 'react';
import styles from './Toast.module.scss';

interface Props {
  message: string;
  durationMs?: number;
  onDone: () => void;
}

export function Toast({ message, durationMs = 2400, onDone }: Props) {
  useEffect(() => {
    const id = setTimeout(onDone, durationMs);
    return () => clearTimeout(id);
  }, [message, durationMs, onDone]);

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      {message}
    </div>
  );
}
