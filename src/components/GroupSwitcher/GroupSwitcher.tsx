import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './GroupSwitcher.module.scss';
import { useGroup } from '../../contexts/GroupContext';
import { buildInviteUrl, shareGameLink } from '../../lib/share';
import { CreateGroup } from '../GroupForms/CreateGroup';
import { JoinGroup } from '../GroupForms/JoinGroup';

interface Props {
  onToast: (msg: string) => void;
}

type Panel = 'none' | 'create' | 'join';

export function GroupSwitcher({ onToast }: Props) {
  const { t } = useTranslation();
  const { groups, activeGroup, activeGroupId, setActiveGroupId } = useGroup();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>('none');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setPanel('none');
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!activeGroup) return null;

  const shareInvite = async () => {
    const url = buildInviteUrl(activeGroup.inviteCode);
    const res = await shareGameLink(
      url,
      t('groupSwitcher.shareInviteTitle', { name: activeGroup.name }),
      t('groupSwitcher.shareInviteText', { code: activeGroup.inviteCode }),
    );
    if (res.kind === 'copied') onToast(t('toast.inviteLinkCopied'));
    else if (res.kind === 'failed') onToast(t('toast.shareFailed'));
    setOpen(false);
  };

  return (
    <div className={styles.container} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.triggerIcon} aria-hidden="true">
          ♣
        </span>
        <span className={styles.triggerName}>{activeGroup.name}</span>
        <span aria-hidden="true" className={styles.chevron}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          {groups.length > 1 && (
            <div className={styles.groupList}>
              {groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`${styles.groupItem} ${
                    g.id === activeGroupId ? styles.groupActive : ''
                  }`}
                  onClick={() => {
                    setActiveGroupId(g.id);
                    setOpen(false);
                  }}
                >
                  {g.name}
                  {g.id === activeGroupId && (
                    <span className={styles.check} aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              ))}
              <div className={styles.sep} />
            </div>
          )}

          <div className={styles.inviteRow}>
            <span className={styles.inviteLabel}>{t('groupSwitcher.inviteCode')}</span>
            <code className={styles.inviteCode}>{activeGroup.inviteCode}</code>
          </div>
          <button
            type="button"
            className={styles.action}
            onClick={() => void shareInvite()}
          >
            {t('groupSwitcher.shareInvite')}
          </button>

          <div className={styles.sep} />

          {panel === 'create' ? (
            <CreateGroup bare onDone={() => setOpen(false)} />
          ) : panel === 'join' ? (
            <JoinGroup bare onDone={() => setOpen(false)} />
          ) : (
            <>
              <button
                type="button"
                className={styles.action}
                onClick={() => setPanel('create')}
              >
                {t('groupSwitcher.createGroup')}
              </button>
              <button
                type="button"
                className={styles.action}
                onClick={() => setPanel('join')}
              >
                {t('groupSwitcher.joinWithCode')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
