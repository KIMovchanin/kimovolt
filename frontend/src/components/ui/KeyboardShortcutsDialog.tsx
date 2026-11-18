import React, { useEffect, useRef } from 'react';
import { useApp } from '../../state/AppStore';

interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsDialog: React.FC<ShortcutsDialogProps> = ({ open, onClose }) => {
  const { lang, t } = useApp();
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  const rows =
    lang === 'ru'
      ? [
          ['R', 'Повернуть выделенный компонент на 90°'],
          ['Delete / Backspace', 'Удалить выделенный компонент или провод'],
          ['Ctrl + Z', 'Отменить последнее действие (Undo)'],
          ['Ctrl + Shift + Z / Ctrl + Y', 'Повторить действие (Redo)'],
          ['Ctrl + D', 'Дублировать выделенный компонент'],
          ['Tab / Стрелки', 'Навигация и перемещение компонента по сетке'],
          ['Enter (на контакте)', 'Начать/завершить соединение проводом без мыши'],
          ['Escape', 'Сбросить прокладку провода или закрыть окно'],
        ]
      : [
          ['R', 'Rotate selected component by 90°'],
          ['Delete / Backspace', 'Delete selected component or wire'],
          ['Ctrl + Z', 'Undo last edit'],
          ['Ctrl + Shift + Z / Ctrl + Y', 'Redo edit'],
          ['Ctrl + D', 'Duplicate selected component'],
          ['Tab / Arrows', 'Navigate or nudge selected component on grid'],
          ['Enter (on terminal)', 'Start or complete wire connection via keyboard'],
          ['Escape', 'Cancel active wire or close dialog'],
        ];

  return (
    <dialog
      ref={dialogRef}
      className="kv-dialog"
      aria-labelledby="shortcuts-title"
      onClose={() => {
        if (dialogRef.current) dialogRef.current.returnValue = '';
        onClose();
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <h2 id="shortcuts-title" style={{ margin: 0, fontSize: '1.15rem' }}>
          {lang === 'ru' ? 'Клавиатурное управление редактором' : 'Workbench Keyboard Shortcuts'}
        </h2>
        <button type="button" className="kv-btn kv-btn-sm" onClick={onClose} autoFocus>
          {t.common.close}
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-strong)', textAlign: 'left' }}>
            <th scope="col" style={{ padding: '0.45rem' }}>
              {lang === 'ru' ? 'Клавиша' : 'Key'}
            </th>
            <th scope="col" style={{ padding: '0.45rem' }}>
              {lang === 'ru' ? 'Действие' : 'Action'}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, desc]) => (
            <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.45rem' }}>
                <kbd
                  className="kv-mono"
                  style={{
                    padding: '0.15rem 0.45rem',
                    borderRadius: 4,
                    border: '1px solid var(--border-strong)',
                    background: 'var(--bg)',
                    fontSize: '0.82rem',
                  }}
                >
                  {k}
                </kbd>
              </td>
              <td style={{ padding: '0.45rem', color: 'var(--muted)' }}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </dialog>
  );
};
