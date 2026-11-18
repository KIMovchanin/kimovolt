import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ACHIEVEMENTS,
  getEffectiveSkillMastery,
  isSkillDueForReview,
  LESSONS,
  MISCONCEPTIONS,
  SKILLS,
  type MisconceptionCode,
} from '@kimovolt/content';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useApp } from '../state/AppStore';

export const ProgressPage: React.FC = () => {
  const { lang, progress, addNotebookEntry, deleteNotebookEntry } = useApp();
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteFormula, setNoteFormula] = useState('');
  const [noteFilter, setNoteFilter] = useState<'all' | 'takeaway' | 'note' | 'mistake' | 'circuit'>('all');

  const completedCount = Object.values(progress.lessons).filter((l) => l.status === 'completed').length;
  const dueSkills = SKILLS.filter((sk) => isSkillDueForReview(progress.skills[sk.id]));

  const filteredNotes = progress.notebook.filter((n) => noteFilter === 'all' || n.kind === noteFilter);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteBody.trim()) return;
    addNotebookEntry({
      kind: noteFormula.trim() ? 'formula' : 'note',
      title: noteTitle.trim(),
      body: noteBody.trim(),
      formula: noteFormula.trim() || undefined,
    });
    setNoteTitle('');
    setNoteBody('');
    setNoteFormula('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header>
        <span className="kv-mono" style={{ fontSize: '0.76rem', color: 'var(--copper)', letterSpacing: '0.1em' }}>
          MASTERY TELEMETRY // ENGINEERING NOTEBOOK
        </span>
        <h1 id="main-content" tabIndex={-1} style={{ margin: '0.2rem 0 0.45rem', fontSize: 'clamp(1.4rem, 2.6vw, 2rem)' }}>
          {lang === 'ru' ? 'Прогресс, навыки и инженерный блокнот' : 'Progress, Skill Tree & Engineering Notebook'}
        </h1>
      </header>

      {/* Key Metrics */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: '0.8rem' }}>
        <div className="kv-panel" style={{ padding: '1rem' }}>
          <div className="kv-mono" style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>TOTAL XP</div>
          <div className="kv-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--copper)' }}>{progress.xp} XP</div>
        </div>
        <div className="kv-panel" style={{ padding: '1rem' }}>
          <div className="kv-mono" style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
            {lang === 'ru' ? 'ПРОЙДЕНО УРОКОВ' : 'LESSONS COMPLETED'}
          </div>
          <div className="kv-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--green)' }}>
            {completedCount} / {LESSONS.length}
          </div>
        </div>
        <div className="kv-panel" style={{ padding: '1rem' }}>
          <div className="kv-mono" style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
            {lang === 'ru' ? 'СЕРИЯ ЗАНЯТИЙ' : 'STUDY STREAK'}
          </div>
          <div className="kv-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--cyan)' }}>
            {progress.streakDays} {lang === 'ru' ? 'дн.' : 'd'}
          </div>
        </div>
        <div className="kv-panel" style={{ padding: '1rem' }}>
          <div className="kv-mono" style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
            {lang === 'ru' ? 'К ПОВТОРЕНИЮ (SRS)' : 'DUE FOR REVIEW'}
          </div>
          <div className="kv-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: dueSkills.length > 0 ? 'var(--amber)' : 'var(--text)' }}>
            {dueSkills.length}
          </div>
        </div>
      </section>

      {/* Spaced Repetition Due Queue */}
      {dueSkills.length > 0 && (
        <section className="kv-panel" style={{ padding: '1rem', borderLeft: '3px solid var(--amber)' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>
            {lang === 'ru' ? 'Запланированные повторения навыков' : 'Scheduled Skill Reviews'}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {dueSkills.map((sk) => (
              <Link key={sk.id} to={`/learn/${sk.lessonIds[0] ?? 'm0-first-led'}`} className="kv-btn kv-btn-sm">
                ↻ {sk.name[lang]}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Interactive Competency Skill Tree */}
      <section className="kv-panel" style={{ padding: '1.25rem' }}>
        <div style={{ marginBottom: '0.9rem' }}>
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.25rem' }}>
            {lang === 'ru' ? 'Дерево инженерных компетенций (Mastery)' : 'Skill Competency Tree (Mastery)'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--muted)' }}>
            {lang === 'ru'
              ? 'Mastery рассчитывается отдельно от XP с учётом точности с первой попытки, подсказок, сложности и интервалов повторения.'
              : 'Mastery is tracked independently from XP using first-try accuracy, hint usage, difficulty, and spaced review intervals.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.75rem' }}>
          {SKILLS.map((sk) => {
            const eff = getEffectiveSkillMastery(progress.skills[sk.id]);
            const due = isSkillDueForReview(progress.skills[sk.id]);
            const prereqNames = sk.prerequisites
              .map((pid) => SKILLS.find((x) => x.id === pid)?.name[lang])
              .filter(Boolean);

            return (
              <div key={sk.id} style={{ padding: '0.8rem', borderRadius: 4, background: 'var(--bg)', border: `1px solid ${eff >= 80 ? 'var(--green)' : 'var(--border-strong)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.92rem' }}>{sk.name[lang]}</strong>
                  <span className="kv-mono" style={{ fontSize: '0.84rem', fontWeight: 700, color: eff >= 80 ? 'var(--green)' : eff > 0 ? 'var(--cyan)' : 'var(--muted)' }}>
                    {eff}%
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--surface)', overflow: 'hidden', marginBottom: '0.45rem' }}>
                  <div style={{ width: `${eff}%`, height: '100%', background: due ? 'var(--amber)' : eff >= 80 ? 'var(--green)' : 'var(--copper)' }} />
                </div>
                <p style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', color: 'var(--muted)' }}>{sk.description[lang]}</p>
                {prereqNames.length > 0 && (
                  <div className="kv-mono" style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                    {lang === 'ru' ? 'База:' : 'Requires:'} {prereqNames.join(' → ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Detected Misconceptions */}
      {Object.keys(progress.misconceptionCounts).length > 0 && (
        <section className="kv-panel" style={{ padding: '1.15rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.65rem' }}>
            {lang === 'ru' ? 'Зоны роста (зафиксированные заблуждения)' : 'Diagnostic Patterns & Growth Areas'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.65rem' }}>
            {(Object.entries(progress.misconceptionCounts) as Array<[MisconceptionCode, number]>).map(([code, count]) => {
              const rule = MISCONCEPTIONS[code];
              if (!rule) return null;
              return (
                <div key={code} style={{ padding: '0.75rem', borderRadius: 4, background: 'var(--bg)', borderLeft: '3px solid var(--amber)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <strong style={{ fontSize: '0.88rem' }}>{rule.title[lang]}</strong>
                    <span className="kv-mono" style={{ fontSize: '0.78rem', color: 'var(--amber)' }}>×{count}</span>
                  </div>
                  <p style={{ margin: '0 0 0.45rem', fontSize: '0.82rem', color: 'var(--muted)' }}>{rule.explanation[lang]}</p>
                  <Link to={`/learn/${rule.recommendedLessonId}`} className="kv-btn kv-btn-sm">
                    {lang === 'ru' ? 'Закрепить в уроке →' : 'Practice in lesson →'}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Collector Engineering Achievements */}
      <section className="kv-panel" style={{ padding: '1.25rem' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>
          {lang === 'ru' ? 'Коллекционные инженерные знаки' : 'Engineering Achievement Badges'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.65rem' }}>
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = progress.achievements.includes(ach.id);
            const isMaskedHidden = ach.hidden && !unlocked;
            return (
              <div
                key={ach.id}
                style={{
                  padding: '0.8rem',
                  borderRadius: 4,
                  background: 'var(--bg)',
                  border: `1px solid ${unlocked ? 'var(--copper)' : 'var(--border)'}`,
                  opacity: unlocked ? 1 : 0.65,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span className="kv-mono" style={{ fontSize: '0.74rem', color: unlocked ? 'var(--copper)' : 'var(--muted)' }}>
                    {ach.code}
                  </span>
                  <StatusBadge
                    tone={unlocked ? 'copper' : 'neutral'}
                    shape={unlocked ? 'diamond' : 'ring'}
                    label={unlocked ? `+${ach.xpBonus} XP` : lang === 'ru' ? 'Закрыт' : 'Locked'}
                  />
                </div>
                <div className="kv-mono" style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.25rem' }}>
                  {isMaskedHidden ? '??? // CLASSIFIED' : ach.title[lang]}
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                  {isMaskedHidden
                    ? lang === 'ru'
                      ? 'Скрытый инженерный знак — откроется при исследовании лаборатории.'
                      : 'Hidden engineering badge — discover it through lab experiments.'
                    : ach.description[lang]}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Personal Engineering Notebook */}
      <section className="kv-panel" style={{ padding: '1.25rem' }} aria-labelledby="notebook-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.9rem' }}>
          <h2 id="notebook-heading" style={{ fontSize: '1.2rem', margin: 0 }}>
            {lang === 'ru' ? 'Инженерный блокнот' : 'Engineering Notebook'}
          </h2>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {(['all', 'takeaway', 'note', 'mistake', 'circuit'] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`kv-btn kv-btn-sm ${noteFilter === f ? 'kv-btn-primary' : ''}`}
                onClick={() => setNoteFilter(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleAddNote} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.6rem', marginBottom: '1rem', padding: '0.85rem', borderRadius: 4, background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <input
            type="text"
            className="kv-input"
            placeholder={lang === 'ru' ? 'Заголовок заметки' : 'Note title'}
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            required
          />
          <input
            type="text"
            className="kv-input kv-mono"
            placeholder={lang === 'ru' ? 'Формула (необязательно)' : 'Formula (optional)'}
            value={noteFormula}
            onChange={(e) => setNoteFormula(e.target.value)}
          />
          <input
            type="text"
            className="kv-input"
            placeholder={lang === 'ru' ? 'Наблюдение, замер или вывод…' : 'Observation, reading or takeaway…'}
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            required
          />
          <button type="submit" className="kv-btn kv-btn-primary">
            + {lang === 'ru' ? 'Добавить запись' : 'Add Entry'}
          </button>
        </form>

        {filteredNotes.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>
            {lang === 'ru'
              ? 'Записей пока нет. Пройди первый урок или добавь собственную инженерную заметку выше.'
              : 'No entries yet. Complete Lesson 1 or add a personal engineering note above.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {filteredNotes.map((note) => (
              <article key={note.id} style={{ padding: '0.8rem', borderRadius: 4, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div>
                  <div className="kv-mono" style={{ fontSize: '0.72rem', color: 'var(--cyan)' }}>
                    [{note.kind.toUpperCase()}] · {new Date(note.createdAt).toLocaleDateString()}
                  </div>
                  <strong style={{ display: 'block', margin: '0.15rem 0' }}>{note.title}</strong>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--muted)' }}>{note.body}</p>
                  {note.formula && (
                    <div className="kv-mono" style={{ marginTop: '0.35rem', color: 'var(--copper)', fontSize: '0.84rem' }}>
                      {note.formula}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="kv-btn kv-btn-sm"
                  aria-label={`Remove ${note.title}`}
                  onClick={() => deleteNotebookEntry(note.id)}
                >
                  ×
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
