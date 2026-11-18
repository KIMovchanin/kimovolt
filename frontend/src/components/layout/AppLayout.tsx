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
          <div>
            <strong>{t.brand.fullName}</strong> · {t.brand.motto}
          </div>
          <div className="kv-mono" style={{ fontSize: '0.76rem' }}>
            {lang === 'ru'
              ? 'Линейный DC-решатель (MNA) + учебная модель LED · Безопасные низковольтные проекты'
              : 'Linear MNA DC Solver + Piecewise LED Model · Safe Low-Voltage Lab'}
          </div>
        </div>
      </footer>
    </div>
  );
};
