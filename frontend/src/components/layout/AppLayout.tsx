import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../../state/AppStore';
import { KimovoltLogo } from '../brand/KimovoltLogo';

export const AppLayout: React.FC = () => {
  const { lang, setLang, t, progress, user, serverOffline } = useApp();

  const navItems = [
    { to: '/learn', label: t.nav.learn },
    { to: '/lab', label: t.nav.lab },
    { to: '/projects', label: t.nav.projects },
    { to: '/progress', label: t.nav.progress },
    { to: '/reference', label: t.nav.reference },
    { to: '/profile', label: t.nav.profile },
  ];

  return (
    <div className="kv-shell">
      <a href="#main-content" className="skip-link visually-hidden">
        {t.nav.skipToContent}
      </a>

      <header className="kv-topbar">
        <div className="kv-topbar-inner">
          <NavLink to="/" className="kv-brand-link" aria-label={t.brand.fullName}>
            <KimovoltLogo size={34} decorative />
            <span className="kv-brand-wordmark">
              <span className="kv-brand-name">{t.brand.shortName}</span>
              <span className="kv-brand-tag">LAB // v1.0</span>
            </span>
          </NavLink>

          <nav className="kv-nav kv-desktop-nav" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="kv-nav-link"
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="kv-badge kv-badge-copper" title="Experience Points">
              <span className="kv-mono">{progress.xp} XP</span>
            </span>
            {!user && (
              <span className="kv-badge" style={{ color: 'var(--muted)' }}>
                {t.common.guestBadge}
              </span>
            )}
            <button
              type="button"
              className="kv-btn kv-btn-sm kv-mono"
              aria-label={lang === 'ru' ? 'Switch to English' : 'Переключить на русский'}
              onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
            >
              {lang.toUpperCase()}
            </button>
          </div>
        </div>

        {serverOffline && user && (
          <div
            role="status"
            style={{
              background: 'color-mix(in srgb, var(--amber) 14%, var(--surface))',
              borderTop: '1px solid var(--amber)',
              padding: '0.35rem 1.25rem',
              fontSize: '0.82rem',
              color: 'var(--amber)',
              textAlign: 'center',
            }}
          >
            {t.common.offlineBanner}
          </div>
        )}
      </header>

      <main className="kv-main">
        <Outlet />
      </main>

      <nav className="kv-mobile-nav" aria-label="Mobile Navigation">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to}>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <footer className="kv-footer">
        <div className="kv-footer-inner">
          <div className="kv-footer-meta">
            <div>
              <strong>{t.brand.fullName}</strong> · {t.brand.motto}
            </div>
            <div className="kv-mono kv-footer-sub">
              {lang === 'ru'
                ? 'Линейный DC-решатель (MNA) + учебная модель LED · Безопасные низковольтные проекты'
                : 'Linear MNA DC Solver + Piecewise LED Model · Safe Low-Voltage Lab'}
            </div>
          </div>

          <ul className="kv-footer-links" role="list">
            <li>
              <a
                href="https://www.kimovchanin.work/"
                target="_blank"
                rel="noopener noreferrer"
                className="kv-btn kv-btn-sm kv-footer-link"
                aria-label={lang === 'ru' ? 'Автор — Игорь Кондратюк (KIMovchanin)' : 'Author — Igor Kondratiuk (KIMovchanin)'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M5 20a7 7 0 0 1 14 0" />
                </svg>
                <span>{lang === 'ru' ? 'Автор' : 'Author'}</span>
              </a>
            </li>
            <li>
              <a
                href="https://github.com/KIMovchanin"
                target="_blank"
                rel="noopener noreferrer"
                className="kv-btn kv-btn-sm kv-footer-link"
                aria-label={lang === 'ru' ? 'GitHub профиль KIMovchanin' : 'GitHub profile KIMovchanin'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
                </svg>
                <span>GitHub</span>
              </a>
            </li>
            <li>
              <a
                href="mailto:kondr2004k@gmail.com"
                className="kv-btn kv-btn-sm kv-footer-link kv-mono"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                <span>kondr2004k@gmail.com</span>
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
};
