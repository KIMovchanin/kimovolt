import React, { useState } from 'react';
import { KeyboardShortcutsDialog } from '../components/ui/KeyboardShortcutsDialog';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useApp, type ColorSchemePref } from '../state/AppStore';

export const ProfilePage: React.FC = () => {
  const {
    lang,
    setLang,
    colorScheme,
    setColorScheme,
    soundEnabled,
    setSoundEnabled,
    user,
    progress,
    savedCircuits,
    registerAccount,
    loginAccount,
    logoutAccount,
    resetGuestData,
  } = useApp();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthBusy(true);
    try {
      if (authMode === 'register') {
        await registerAccount(email, password, displayName || email.split('@')[0] || 'Maker');
      } else {
        await loginAccount(email, password);
      }
      setPassword('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleExportLocal = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      progress,
      savedCircuits,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kimovolt-lab-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxInlineSize: 960, marginInline: 'auto' }}>
      <header>
        <span className="kv-mono" style={{ fontSize: '0.76rem', color: 'var(--copper)', letterSpacing: '0.1em' }}>
          PROFILE & LAB PREFERENCES
        </span>
        <h1 id="main-content" tabIndex={-1} style={{ margin: '0.2rem 0 0.4rem', fontSize: 'clamp(1.4rem, 2.6vw, 2rem)' }}>
          {lang === 'ru' ? 'Профиль и настройки лаборатории' : 'Profile & Lab Settings'}
        </h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))', gap: '1rem', alignItems: 'start' }}>
        {/* Account / Guest Sync Panel */}
        <section className="kv-panel-elevated" style={{ padding: '1.25rem' }}>
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <StatusBadge tone="ok" shape="circle" label={lang === 'ru' ? 'АККАУНТ СИНХРОНИЗИРОВАН' : 'ACCOUNT SYNCED'} />
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{user.displayName}</h2>
              <div className="kv-mono" style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>
                {user.email}
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--muted)' }}>
                {lang === 'ru'
                  ? 'Прогресс, навыки, блокнот и сохранённые схемы синхронизируются с защищённым Go + SQLite сервером.'
                  : 'Your progress, mastery, notebook, and circuits sync securely with the Go + SQLite backend.'}
              </p>
              <button type="button" className="kv-btn" onClick={() => void logoutAccount()}>
                {lang === 'ru' ? 'Выйти из аккаунта' : 'Sign Out'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <StatusBadge tone="copper" shape="ring" label={lang === 'ru' ? 'ГОСТЕВОЙ РЕЖИМ АКТИВЕН' : 'GUEST MODE ACTIVE'} />
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>
                {lang === 'ru'
                  ? `Ты можешь свободно проходить все уроки без регистрации — прогресс надёжно хранится в браузере. При создании аккаунта весь гостевой прогресс (${progress.xp} XP) перенесётся автоматически без потерь.`
                  : `All lessons and tools work without registration. Creating an account migrates your local guest progress (${progress.xp} XP) and circuits automatically.`}
              </p>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  className={`kv-btn kv-btn-sm ${authMode === 'register' ? 'kv-btn-primary' : ''}`}
                  onClick={() => setAuthMode('register')}
                >
                  {lang === 'ru' ? 'Создать аккаунт' : 'Register'}
                </button>
                <button
                  type="button"
                  className={`kv-btn kv-btn-sm ${authMode === 'login' ? 'kv-btn-primary' : ''}`}
                  onClick={() => setAuthMode('login')}
                >
                  {lang === 'ru' ? 'Войти' : 'Sign In'}
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {authMode === 'register' && (
                  <div className="kv-field">
                    <label htmlFor="auth-name">{lang === 'ru' ? 'Имя в лаборатории' : 'Display Name'}</label>
                    <span id="name-hint" className="kv-field-hint">
                      {lang === 'ru' ? 'Не используется в публичных рейтингах (профиль приватный)' : 'Private profile only, never public'}
                    </span>
                    <input
                      id="auth-name"
                      type="text"
                      className="kv-input"
                      autoComplete="nickname"
                      aria-describedby="name-hint"
                      required
                      minLength={2}
                      maxLength={48}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                    <span className="kv-field-error">
                      {lang === 'ru' ? 'Ошибка: укажи имя от 2 символов.' : 'Error: enter at least 2 characters.'}
                    </span>
                  </div>
                )}

                <div className="kv-field">
                  <label htmlFor="auth-email">Email</label>
                  <span id="email-hint" className="kv-field-hint">
                    {lang === 'ru' ? 'Формат: engineer@example.com' : 'Format: engineer@example.com'}
                  </span>
                  <input
                    id="auth-email"
                    type="email"
                    className="kv-input"
                    autoComplete="email"
                    aria-describedby="email-hint"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <span className="kv-field-error">
                    {lang === 'ru' ? 'Ошибка: введи корректный адрес email.' : 'Error: enter a valid email address.'}
                  </span>
                </div>

                <div className="kv-field">
                  <label htmlFor="auth-password">{lang === 'ru' ? 'Пароль' : 'Password'}</label>
                  <span id="pwd-hint" className="kv-field-hint">
                    {lang === 'ru' ? 'Минимум 8 символов' : 'At least 8 characters'}
                  </span>
                  <input
                    id="auth-password"
                    type="password"
                    className="kv-input"
                    autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                    aria-describedby="pwd-hint"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span className="kv-field-error">
                    {lang === 'ru' ? 'Ошибка: пароль должен содержать минимум 8 символов.' : 'Error: password must be at least 8 characters.'}
                  </span>
                </div>

                {authError && (
                  <div role="alert" style={{ color: 'var(--coral)', fontSize: '0.84rem' }}>
                    ✕ {authError}
                  </div>
                )}

                <button type="submit" className="kv-btn kv-btn-primary" disabled={authBusy}>
                  {authBusy
                    ? '...'
                    : authMode === 'register'
                      ? lang === 'ru'
                        ? 'Создать аккаунт и перенести прогресс'
                        : 'Create Account & Migrate Guest Data'
                      : lang === 'ru'
                        ? 'Войти и синхронизировать'
                        : 'Sign In & Sync'}
                </button>
              </form>
            </div>
          )}
        </section>

        {/* Preferences Panel */}
        <section className="kv-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>
            {lang === 'ru' ? 'Оформление и интерфейс' : 'Appearance & Controls'}
          </h2>

          {/* Color Scheme 3-state control */}
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem' }}>
              {lang === 'ru' ? 'Цветовая тема лаборатории' : 'Laboratory Color Theme'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {(
                [
                  ['dark', lang === 'ru' ? 'Тёмная (Obsidian)' : 'Obsidian Dark'],
                  ['light', lang === 'ru' ? 'Светлый чертёж' : 'Blueprint Light'],
                  ['system', lang === 'ru' ? 'Системная' : 'System Auto'],
                ] as Array<[ColorSchemePref, string]>
              ).map(([pref, label]) => (
                <button
                  key={pref}
                  type="button"
                  data-testid={`theme-${pref}`}
                  className={`kv-btn kv-btn-sm ${colorScheme === pref ? 'kv-btn-primary' : ''}`}
                  aria-pressed={colorScheme === pref}
                  onClick={() => setColorScheme(pref)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Language Toggle */}
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.4rem' }}>
              {lang === 'ru' ? 'Язык платформы' : 'Platform Language'}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                className={`kv-btn kv-btn-sm ${lang === 'ru' ? 'kv-btn-primary' : ''}`}
                onClick={() => setLang('ru')}
              >
                Русский (RU)
              </button>
              <button
                type="button"
                className={`kv-btn kv-btn-sm ${lang === 'en' ? 'kv-btn-primary' : ''}`}
                onClick={() => setLang('en')}
              >
                English (EN)
              </button>
            </div>
          </div>

          {/* Sound Toggle (off by default) */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
            />
            <span>
              {lang === 'ru'
                ? 'Тихие инженерные звуки переключателей и прозвонки (выкл. по умолчанию)'
                : 'Subtle procedural click & continuity sounds (off by default)'}
            </span>
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="kv-btn kv-btn-sm" onClick={() => setShortcutsOpen(true)}>
              {lang === 'ru' ? 'Горячие клавиши' : 'Keyboard Shortcuts'}
            </button>
            <button type="button" className="kv-btn kv-btn-sm" onClick={handleExportLocal}>
              {lang === 'ru' ? 'Экспорт бэкапа (JSON)' : 'Export Local Backup'}
            </button>
            <button
              type="button"
              className="kv-btn kv-btn-sm"
              style={{ borderColor: 'var(--coral)', color: 'var(--coral)' }}
              onClick={resetGuestData}
            >
              {lang === 'ru' ? 'Сбросить гостевой прогресс' : 'Reset Guest Progress'}
            </button>
          </div>
        </section>
      </div>

      <KeyboardShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
};
