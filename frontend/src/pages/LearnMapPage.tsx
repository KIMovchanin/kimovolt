import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  computeLessonStatus,
  LESSONS,
  MODULES,
  QUESTS,
  TRACKS,
  type LessonDefinition,
  type LessonNodeStatus,
} from '@kimovolt/content';
import { StatusBadge, type BadgeTone } from '../components/ui/StatusBadge';
import { useApp } from '../state/AppStore';

export const LearnMapPage: React.FC = () => {
  const { lang, t, progress } = useApp();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [hoveredLesson, setHoveredLesson] = useState<LessonDefinition | null>(LESSONS[0] ?? null);
  const [mapZoom, setMapZoom] = useState(1);

  const statusMeta = (status: LessonNodeStatus): { label: string; tone: BadgeTone; shape: 'circle' | 'square' | 'diamond' | 'triangle' | 'ring'; color: string } => {
    switch (status) {
      case 'locked':
        return { label: t.learn.statusLocked, tone: 'neutral', shape: 'square', color: 'var(--border-strong)' };
      case 'available':
        return { label: t.learn.statusAvailable, tone: 'copper', shape: 'ring', color: 'var(--copper)' };
      case 'in_progress':
        return { label: t.learn.statusInProgress, tone: 'info', shape: 'circle', color: 'var(--cyan)' };
      case 'completed':
        return { label: t.learn.statusCompleted, tone: 'ok', shape: 'circle', color: 'var(--green)' };
      case 'mastered':
        return { label: t.learn.statusMastered, tone: 'ok', shape: 'diamond', color: 'var(--green)' };
      case 'needs_review':
        return { label: t.learn.statusNeedsReview, tone: 'warn', shape: 'triangle', color: 'var(--amber)' };
    }
  };

  // PCB connections along prerequisites
  const traces: Array<{ from: LessonDefinition; to: LessonDefinition; energized: boolean }> = [];
  for (const lesson of LESSONS) {
    for (const pid of lesson.prerequisites) {
      const parent = LESSONS.find((l) => l.id === pid);
      if (parent) {
        const pStatus = computeLessonStatus(parent, progress);
        traces.push({
          from: parent,
          to: lesson,
          energized: pStatus === 'completed' || pStatus === 'mastered' || pStatus === 'needs_review',
        });
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="kv-mono" style={{ fontSize: '0.76rem', color: 'var(--copper)', letterSpacing: '0.1em' }}>
            CURRICULUM PCB // 15 INTERACTIVE LESSONS
          </span>
          <h1 id="main-content" tabIndex={-1} style={{ margin: '0.25rem 0 0', fontSize: 'clamp(1.4rem, 2.6vw, 2rem)' }}>
            {lang === 'ru' ? 'Карта обучения электронике' : 'Interactive Electronics Learning Map'}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`kv-btn kv-btn-sm ${viewMode === 'map' ? 'kv-btn-primary' : ''}`}
            onClick={() => setViewMode('map')}
          >
            {t.learn.mapView}
          </button>
          <button
            type="button"
            className={`kv-btn kv-btn-sm ${viewMode === 'list' ? 'kv-btn-primary' : ''}`}
            onClick={() => setViewMode('list')}
          >
            {t.learn.listView}
          </button>
        </div>
      </header>

      {/* Active Quests Banner */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))', gap: '0.75rem' }}>
        {QUESTS.map((q) => (
          <div key={q.id} className="kv-panel" style={{ padding: '0.85rem 1rem', borderLeft: '3px solid var(--amber)' }}>
            <div className="kv-mono" style={{ fontSize: '0.74rem', color: 'var(--amber)', marginBottom: '0.25rem' }}>
              QUEST // MISSION
            </div>
            <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{q.title[lang]}</div>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.84rem', color: 'var(--muted)' }}>{q.briefing[lang]}</p>
            <Link to={`/learn/${q.lessonId}`} className="kv-btn kv-btn-sm">
              {t.learn.openLesson} →
            </Link>
          </div>
        ))}
      </section>

      {viewMode === 'map' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))', gap: '1rem', alignItems: 'start' }}>
          {/* Interactive PCB Board */}
          <div className="kv-panel" style={{ gridColumn: 'span 2', overflow: 'hidden', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.85rem', borderBottom: '1px solid var(--border)' }}>
              <span className="kv-mono" style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                BOARD REV 1.0 · {Object.values(progress.lessons).filter((l) => l.status === 'completed').length}/{LESSONS.length} {lang === 'ru' ? 'пройдено' : 'completed'}
              </span>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button type="button" className="kv-btn kv-btn-sm" onClick={() => setMapZoom((z) => Math.max(0.75, z - 0.15))}>−</button>
                <button type="button" className="kv-btn kv-btn-sm kv-mono" onClick={() => setMapZoom(1)}>{Math.round(mapZoom * 100)}%</button>
                <button type="button" className="kv-btn kv-btn-sm" onClick={() => setMapZoom((z) => Math.min(1.5, z + 0.15))}>+</button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', padding: '0.5rem' }}>
              <svg
                viewBox={`0 0 ${1000 / mapZoom} ${535 / mapZoom}`}
                style={{ display: 'block', width: '100%', minInlineSize: 640, height: 'auto' }}
                role="region"
                aria-label={lang === 'ru' ? 'Интерактивная карта уроков' : 'Interactive lesson PCB map'}
              >
                {/* Module functional zones */}
                <rect x="25" y="30" width="935" height="365" rx="8" fill="none" stroke="var(--border)" strokeDasharray="6 4" />
                <text x="40" y="50" fill="var(--muted)" fontSize="11" className="kv-mono">
                  TRACK A & B // ELECTRICITY & PRACTICAL ELECTRONICS
                </text>

                <rect x="195" y="405" width="365" height="110" rx="8" fill="none" stroke="var(--border)" strokeDasharray="6 4" />
                <text x="210" y="425" fill="var(--cyan)" fontSize="11" className="kv-mono">
                  TRACK C // DIGITAL LOGIC & OSCILLOSCOPE
                </text>

                {/* Copper PCB traces */}
                {traces.map((tr, i) => {
                  const midX = (tr.from.mapNode.x + tr.to.mapNode.x) / 2;
                  const pathD = `M ${tr.from.mapNode.x} ${tr.from.mapNode.y} L ${midX} ${tr.from.mapNode.y} L ${midX} ${tr.to.mapNode.y} L ${tr.to.mapNode.x} ${tr.to.mapNode.y}`;
                  return (
                    <path
                      key={i}
                      d={pathD}
                      fill="none"
                      stroke={tr.energized ? 'var(--copper)' : 'var(--border-strong)'}
                      strokeWidth={tr.energized ? 3 : 2}
                      opacity={tr.energized ? 0.9 : 0.5}
                    />
                  );
                })}

                {/* Interactive Lesson Nodes */}
                {LESSONS.map((lesson) => {
                  const st = computeLessonStatus(lesson, progress);
                  const meta = statusMeta(st);
                  const isActive = hoveredLesson?.id === lesson.id;
                  const r = 21;

                  return (
                    <g
                      key={lesson.id}
                      transform={`translate(${lesson.mapNode.x}, ${lesson.mapNode.y})`}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredLesson(lesson)}
                      onFocus={() => setHoveredLesson(lesson)}
                    >
                      {(st === 'available' || st === 'in_progress') && (
                        <circle
                          cx={0}
                          cy={0}
                          r={r + 7}
                          fill="none"
                          stroke={meta.color}
                          strokeWidth="1.5"
                          className="kv-node-pulse"
                        />
                      )}
                      <Link to={`/learn/${lesson.id}`} aria-label={`${lesson.order}. ${lesson.title[lang]} — ${meta.label}`}>
                        <circle
                          cx={0}
                          cy={0}
                          r={r}
                          fill={isActive ? 'var(--elevated)' : 'var(--surface)'}
                          stroke={meta.color}
                          strokeWidth={isActive ? 3.2 : 2.4}
                        />
                        <text
                          x={0}
                          y={4}
                          textAnchor="middle"
                          fill={st === 'locked' ? 'var(--muted)' : 'var(--text)'}
                          fontSize="12"
                          fontWeight="700"
                          className="kv-mono"
                        >
                          {String(lesson.order).padStart(2, '0')}
                        </text>
                        <text
                          x={0}
                          y={r + 16}
                          textAnchor="middle"
                          fill={st === 'locked' ? 'var(--muted)' : 'var(--text)'}
                          fontSize="10.2"
                          fontWeight="500"
                        >
                          {lesson.title[lang].slice(0, 22)}
                          {lesson.title[lang].length > 22 ? '…' : ''}
                        </text>
                      </Link>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Hovered / Selected Lesson Inspector Card */}
          {hoveredLesson && (() => {
            const st = computeLessonStatus(hoveredLesson, progress);
            const meta = statusMeta(st);
            const rec = progress.lessons[hoveredLesson.id];
            return (
              <aside className="kv-panel-elevated" style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="kv-mono" style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                    NODE {String(hoveredLesson.order).padStart(2, '0')}
                  </span>
                  <StatusBadge tone={meta.tone} shape={meta.shape} label={meta.label} />
                </div>
                <h2 style={{ fontSize: '1.15rem', margin: 0 }}>{hoveredLesson.title[lang]}</h2>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>
                  {hoveredLesson.subtitle[lang]}
                </p>
                <div className="kv-mono" style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'var(--bg)', padding: '0.6rem', borderRadius: 4, border: '1px solid var(--border)' }}>
                  <div>⏱ ~{hoveredLesson.estimatedMinutes} {t.common.minutesShort}</div>
                  <div>⚡ {hoveredLesson.practiceType[lang]}</div>
                  <div>★ +{hoveredLesson.xpReward} XP</div>
                  {rec && rec.bestScore > 0 && (
                    <div style={{ color: 'var(--green)' }}>
                      {lang === 'ru' ? 'Лучший результат:' : 'Best score:'} {rec.bestScore}%
                    </div>
                  )}
                </div>
                <Link to={`/learn/${hoveredLesson.id}`} className="kv-btn kv-btn-primary">
                  {st === 'needs_review' ? t.learn.repeatReview : t.learn.openLesson} →
                </Link>
              </aside>
            );
          })()}
        </div>
      ) : null}

      {/* Accessible Structured List View (always shown below or when List mode selected) */}
      <section aria-label={lang === 'ru' ? 'Структурированный список модулей и уроков' : 'Structured curriculum list'} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {TRACKS.map((track) => {
          const trackModules = MODULES.filter((m) => m.trackId === track.id);
          return (
            <div key={track.id} className="kv-panel" style={{ padding: '1.15rem' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <span className="kv-mono" style={{ fontSize: '0.74rem', color: 'var(--copper)' }}>
                  TRACK {track.code}
                </span>
                <h2 style={{ fontSize: '1.18rem', margin: '0.15rem 0 0.25rem' }}>{track.title[lang]}</h2>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>{track.description[lang]}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {trackModules.map((mod) => {
                  const modLessons = LESSONS.filter((l) => l.moduleId === mod.id);
                  return (
                    <div key={mod.id} style={{ padding: '0.85rem', borderRadius: 4, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <strong style={{ fontSize: '0.96rem' }}>
                          <span className="kv-mono" style={{ color: 'var(--cyan)', marginInlineEnd: '0.5rem' }}>{mod.numberLabel}</span>
                          {mod.title[lang]}
                        </strong>
                        {mod.status === 'upcoming' && (
                          <StatusBadge tone="neutral" shape="square" label={t.learn.upcomingBadge} />
                        )}
                      </div>
                      <p style={{ margin: '0 0 0.65rem', fontSize: '0.84rem', color: 'var(--muted)' }}>
                        {mod.description[lang]}
                      </p>

                      {modLessons.length > 0 ? (
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.5rem' }}>
                          {modLessons.map((lesson) => {
                            const st = computeLessonStatus(lesson, progress);
                            const meta = statusMeta(st);
                            return (
                              <li key={lesson.id}>
                                <Link
                                  to={`/learn/${lesson.id}`}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.55rem 0.7rem',
                                    borderRadius: 4,
                                    background: 'var(--surface)',
                                    border: `1px solid ${st === 'locked' ? 'var(--border)' : 'var(--border-strong)'}`,
                                    textDecoration: 'none',
                                    color: 'var(--text)',
                                  }}
                                >
                                  <span style={{ minInlineSize: 0 }}>
                                    <span className="kv-mono" style={{ color: 'var(--muted)', marginInlineEnd: '0.4rem', fontSize: '0.8rem' }}>
                                      {String(lesson.order).padStart(2, '0')}
                                    </span>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{lesson.title[lang]}</span>
                                  </span>
                                  <StatusBadge tone={meta.tone} shape={meta.shape} label={meta.label} />
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      ) : mod.plannedTopics ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                          {mod.plannedTopics.map((topic, idx) => (
                            <span key={idx} className="kv-mono" style={{ fontSize: '0.76rem', color: 'var(--muted)', padding: '0.2rem 0.5rem', border: '1px solid var(--border)', borderRadius: 4 }}>
                              {topic[lang]}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
