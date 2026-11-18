import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../state/AppStore';
import { labSound } from '../utils/sound';

export const NotFoundPage: React.FC = () => {
  const { lang } = useApp();
  const [closed, setClosed] = useState(false);

  return (
    <section
      className="kv-panel-elevated"
      style={{
        maxInlineSize: 640,
        marginInline: 'auto',
        marginBlock: '2rem',
        padding: '2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <span className="kv-mono" style={{ fontSize: '0.84rem', color: 'var(--coral)' }}>
        ERROR 404 // OPEN CIRCUIT DETECTED
      </span>
      <h1 id="main-content" tabIndex={-1} style={{ margin: 0, fontSize: '2.1rem' }}>
        {lang === 'ru' ? 'Цепь маршрута разомкнута' : 'Route Circuit Is Open'}
      </h1>
      <p style={{ margin: 0, color: 'var(--muted)' }}>
        {lang === 'ru'
          ? 'Такой страницы не существует. Замкни выключатель 404 на схеме ниже, чтобы восстановить контакт с главной лабораторией.'
          : 'This route does not exist. Flip the 404 switch below to restore continuity back to the main lab.'}
      </p>

      <svg
        viewBox="0 0 360 110"
        style={{ width: '100%', maxInlineSize: 340, cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        aria-label={lang === 'ru' ? 'Замкнуть цепь 404' : 'Close 404 circuit switch'}
        onClick={() => {
          setClosed((v) => !v);
          labSound.playSwitchClick();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setClosed((v) => !v);
            labSound.playSwitchClick();
          }
        }}
      >
        <line x1="20" y1="55" x2="120" y2="55" stroke="var(--copper)" strokeWidth="3" />
        <line x1="200" y1="55" x2="290" y2="55" stroke={closed ? 'var(--green)' : 'var(--muted)'} strokeWidth="3" />
        <circle cx="120" cy="55" r="5" fill="var(--bg)" stroke="var(--copper)" strokeWidth="2.5" />
        <circle cx="200" cy="55" r="5" fill="var(--bg)" stroke="var(--copper)" strokeWidth="2.5" />
        <line
          x1="120"
          y1="55"
          x2="200"
          y2={closed ? 55 : 22}
          stroke={closed ? 'var(--green)' : 'var(--coral)'}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle
          cx="315"
          cy="55"
          r="16"
          fill={closed ? 'var(--green)' : 'var(--surface)'}
          stroke={closed ? 'var(--green)' : 'var(--border-strong)'}
          strokeWidth="2.5"
        />
        <text x="160" y="96" textAnchor="middle" fill="var(--muted)" fontSize="11" className="kv-mono">
          {closed ? 'CONTINUITY OK (0.1 Ω)' : '404 OPEN LOOP — CLICK TO CLOSE'}
        </text>
      </svg>

      <Link to="/" className={`kv-btn ${closed ? 'kv-btn-primary' : ''}`}>
        {lang === 'ru' ? 'Вернуться в KIMOVOLT LAB →' : 'Return to KIMOVOLT LAB →'}
      </Link>
    </section>
  );
};
