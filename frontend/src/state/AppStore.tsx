import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createEmptyProgressState,
  createLessonNotebookTakeaway,
  EN_STRINGS,
  evaluateAchievements,
  getLessonById,
  recordSkillAttempt,
  RU_STRINGS,
  updateStreakAndXp,
  type MisconceptionCode,
  type NotebookEntry,
  type UIStrings,
  type UserProgressState,
} from '@kimovolt/content';
import type { CircuitDocument } from '@kimovolt/simulation';
import { apiClient, type AuthUser, type SavedCircuitRecord } from '../api/client';
import { labSound } from '../utils/sound';

export type Language = 'ru' | 'en';
export type ColorSchemePref = 'dark' | 'light' | 'system';

const STORAGE_PROGRESS_KEY = 'kimovolt-guest-progress-v1';
const STORAGE_CIRCUITS_KEY = 'kimovolt-guest-circuits-v1';
const STORAGE_LANG_KEY = 'kimovolt-lang-v1';
const STORAGE_THEME_KEY = 'kimovolt-color-scheme';
const STORAGE_SOUND_KEY = 'kimovolt-sound-v1';

interface AppContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: UIStrings;
  colorScheme: ColorSchemePref;
  setColorScheme: (pref: ColorSchemePref) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  progress: UserProgressState;
  savedCircuits: SavedCircuitRecord[];
  user: AuthUser | null;
  serverOffline: boolean;
  announce: (message: string) => void;
  recordStepAttempt: (params: {
    lessonId: string;
    stepId: string;
    skillIds: string[];
    passed: boolean;
    firstTry: boolean;
    hintsUsed: number;
    difficulty: 1 | 2 | 3;
    misconceptionCode?: MisconceptionCode;
  }) => void;
  completeLesson: (lessonId: string, stats: { hintsUsed: number; mistakes: number }) => string[];
  addNotebookEntry: (entry: Omit<NotebookEntry, 'id' | 'createdAt'>) => void;
  deleteNotebookEntry: (id: string) => void;
  markComponentInspected: (type: string) => void;
  unlockEasterEgg: (eggId: string) => void;
  saveCircuit: (name: string, doc: CircuitDocument, id?: string) => Promise<SavedCircuitRecord>;
  deleteSavedCircuit: (id: string) => Promise<void>;
  registerAccount: (email: string, password: string, displayName: string) => Promise<void>;
  loginAccount: (email: string, password: string) => Promise<void>;
  logoutAccount: () => Promise<void>;
  resetGuestData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function applyMetaColorScheme(pref: ColorSchemePref) {
  const meta = document.querySelector('meta[name="color-scheme"]');
  const content = pref === 'system' ? 'light dark' : pref;
  if (meta) {
    meta.setAttribute('content', content);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_LANG_KEY) : null;
    return stored === 'en' ? 'en' : 'ru';
  });

  const [colorScheme, setColorSchemeState] = useState<ColorSchemePref>(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_THEME_KEY) : null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return 'dark';
  });

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_SOUND_KEY) : null;
    return stored === 'true';
  });

  const [progress, setProgress] = useState<UserProgressState>(() =>
    loadStoredJson<UserProgressState>(STORAGE_PROGRESS_KEY, createEmptyProgressState())
  );

  const [savedCircuits, setSavedCircuits] = useState<SavedCircuitRecord[]>(() =>
    loadStoredJson<SavedCircuitRecord[]>(STORAGE_CIRCUITS_KEY, [])
  );

  const [user, setUser] = useState<AuthUser | null>(null);
  const [serverOffline, setServerOffline] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const announceTimerRef = useRef<number | null>(null);

  const announce = useCallback((message: string) => {
    if (announceTimerRef.current) {
      window.clearTimeout(announceTimerRef.current);
    }
    setAnnouncement('');
    announceTimerRef.current = window.setTimeout(() => {
      setAnnouncement(message);
    }, 60);
  }, []);

  // Sync <html lang>, <meta name="color-scheme">, storage across tabs, and hidden-tab motion pause
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    applyMetaColorScheme(colorScheme);
    try {
      localStorage.setItem(STORAGE_THEME_KEY, colorScheme);
    } catch {
      // ignore
    }
  }, [colorScheme]);

  useEffect(() => {
    labSound.setEnabled(soundEnabled);
    try {
      localStorage.setItem(STORAGE_SOUND_KEY, soundEnabled ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_THEME_KEY) {
        const val = e.newValue;
        const next: ColorSchemePref = val === 'light' || val === 'dark' || val === 'system' ? val : 'dark';
        setColorSchemeState(next);
        applyMetaColorScheme(next);
      }
    };
    const onVis = () => {
      document.documentElement.classList.toggle('kv-tab-hidden', document.hidden);
    };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Persist local guest snapshot
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      // ignore
    }
  }, [progress]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CIRCUITS_KEY, JSON.stringify(savedCircuits));
    } catch {
      // ignore
    }
  }, [savedCircuits]);

  // Initial backend probe (never blocks guest usage if offline)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.me();
        if (!mounted) return;
        setServerOffline(false);
        if (res.user) {
          setUser(res.user);
          const [pRes, cRes] = await Promise.all([apiClient.fetchProgress(), apiClient.listCircuits()]);
          if (!mounted) return;
          setProgress(pRes.progress);
          setSavedCircuits(cRes.circuits);
        }
      } catch {
        if (!mounted) return;
        setServerOffline(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const syncProgressToServer = useCallback(
    async (next: UserProgressState) => {
      if (!user) return;
      try {
        await apiClient.saveProgress(next);
        setServerOffline(false);
      } catch {
        setServerOffline(true);
      }
    },
    [user]
  );

  const recordStepAttempt = useCallback(
    (params: {
      lessonId: string;
      stepId: string;
      skillIds: string[];
      passed: boolean;
      firstTry: boolean;
      hintsUsed: number;
      difficulty: 1 | 2 | 3;
      misconceptionCode?: MisconceptionCode;
    }) => {
      setProgress((prev) => {
        let next = recordSkillAttempt(prev, params.skillIds, {
          passed: params.passed,
          firstTry: params.firstTry,
          hintsUsed: params.hintsUsed,
          difficulty: params.difficulty,
          misconceptionCode: params.misconceptionCode,
        });

        const prevLesson = next.lessons[params.lessonId] ?? {
          lessonId: params.lessonId,
          version: getLessonById(params.lessonId)?.version ?? 1,
          status: 'in_progress' as const,
          currentStepIndex: 0,
          completedStepIds: [],
          attempts: 0,
          hintsUsed: 0,
          mistakes: 0,
          bestScore: 0,
          completedAt: null,
        };

        const completedStepIds =
          params.passed && !prevLesson.completedStepIds.includes(params.stepId)
            ? [...prevLesson.completedStepIds, params.stepId]
            : prevLesson.completedStepIds;

        next = {
          ...next,
          lessons: {
            ...next.lessons,
            [params.lessonId]: {
              ...prevLesson,
              status: prevLesson.status === 'completed' ? 'completed' : 'in_progress',
              attempts: prevLesson.attempts + 1,
              hintsUsed: prevLesson.hintsUsed + (params.passed ? params.hintsUsed : 0),
              mistakes: prevLesson.mistakes + (params.passed ? 0 : 1),
              completedStepIds,
            },
          },
        };

        if (!params.passed && params.misconceptionCode) {
          const noteId = `mistake-${params.lessonId}-${params.stepId}`;
          if (!next.notebook.some((n) => n.id === noteId)) {
            next.notebook = [
              {
                id: noteId,
                kind: 'mistake',
                title: lang === 'ru' ? `Разбор ошибки (${params.lessonId})` : `Mistake Review (${params.lessonId})`,
                body:
                  lang === 'ru'
                    ? `Обнаружено типовое заблуждение: ${params.misconceptionCode}`
                    : `Detected misconception pattern: ${params.misconceptionCode}`,
                lessonId: params.lessonId,
                createdAt: new Date().toISOString(),
              },
              ...next.notebook,
            ];
          }
        }

        next.achievements = evaluateAchievements(next);
        void syncProgressToServer(next);
        return next;
      });
    },
    [lang, syncProgressToServer]
  );

  const completeLesson = useCallback(
    (lessonId: string, stats: { hintsUsed: number; mistakes: number }): string[] => {
      const lesson = getLessonById(lessonId);
      if (!lesson) return [];
      const unlockedNew: string[] = [];

      setProgress((prev) => {
        const alreadyCompleted = prev.lessons[lessonId]?.status === 'completed';
        const score = Math.max(50, Math.min(100, 100 - stats.mistakes * 10 - stats.hintsUsed * 5));
        const prevBest = prev.lessons[lessonId]?.bestScore ?? 0;

        let next: UserProgressState = {
          ...prev,
          lessons: {
            ...prev.lessons,
            [lessonId]: {
              lessonId,
              version: lesson.version,
              status: 'completed',
              currentStepIndex: lesson.steps.length - 1,
              completedStepIds: lesson.steps.map((s) => s.id),
              attempts: (prev.lessons[lessonId]?.attempts ?? 0) + 1,
              hintsUsed: Math.min(prev.lessons[lessonId]?.hintsUsed ?? stats.hintsUsed, stats.hintsUsed),
              mistakes: Math.min(prev.lessons[lessonId]?.mistakes ?? stats.mistakes, stats.mistakes),
              bestScore: Math.max(prevBest, score),
              completedAt: prev.lessons[lessonId]?.completedAt ?? new Date().toISOString(),
            },
          },
        };

        next = updateStreakAndXp(next, alreadyCompleted ? 25 : lesson.xpReward);

        // Add automatic engineering notebook takeaway if not already stored
        const takeawayId = `takeaway-${lessonId}`;
        if (!next.notebook.some((n) => n.id === takeawayId)) {
          next = {
            ...next,
            notebook: [createLessonNotebookTakeaway(lesson, lang), ...next.notebook],
          };
        }

        const beforeSet = new Set(prev.achievements);
        const afterAchievements = evaluateAchievements(next);
        for (const a of afterAchievements) {
          if (!beforeSet.has(a)) unlockedNew.push(a);
        }
        next.achievements = afterAchievements;

        void syncProgressToServer(next);
        return next;
      });

      labSound.playSuccessChime();
      return unlockedNew;
    },
    [lang, syncProgressToServer]
  );

  const addNotebookEntry = useCallback(
    (entry: Omit<NotebookEntry, 'id' | 'createdAt'>) => {
      setProgress((prev) => {
        const next: UserProgressState = {
          ...prev,
          notebook: [
            {
              ...entry,
              id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              createdAt: new Date().toISOString(),
            },
            ...prev.notebook,
          ],
        };
        void syncProgressToServer(next);
        return next;
      });
    },
    [syncProgressToServer]
  );

  const deleteNotebookEntry = useCallback(
    (id: string) => {
      setProgress((prev) => {
        const next: UserProgressState = {
          ...prev,
          notebook: prev.notebook.filter((n) => n.id !== id),
        };
        void syncProgressToServer(next);
        return next;
      });
    },
    [syncProgressToServer]
  );

  const markComponentInspected = useCallback(
    (type: string) => {
      setProgress((prev) => {
        if (prev.inspectedComponentTypes.includes(type)) return prev;
        const next: UserProgressState = {
          ...prev,
          inspectedComponentTypes: [...prev.inspectedComponentTypes, type],
        };
        next.achievements = evaluateAchievements(next);
        void syncProgressToServer(next);
        return next;
      });
    },
    [syncProgressToServer]
  );

  const unlockEasterEgg = useCallback(
    (eggId: string) => {
      setProgress((prev) => {
        if (prev.easterEggsFound.includes(eggId)) return prev;
        const next: UserProgressState = {
          ...prev,
          easterEggsFound: [...prev.easterEggsFound, eggId],
        };
        next.achievements = evaluateAchievements(next);
        void syncProgressToServer(next);
        return next;
      });
    },
    [syncProgressToServer]
  );

  const saveCircuit = useCallback(
    async (name: string, doc: CircuitDocument, id?: string): Promise<SavedCircuitRecord> => {
      const record: SavedCircuitRecord = {
        id: id ?? `circ-${Date.now()}`,
        name: name.trim() || 'Untitled Circuit',
        document: { ...doc, name: name.trim() || doc.name },
        updatedAt: new Date().toISOString(),
      };
      setSavedCircuits((prev) => {
        const filtered = prev.filter((c) => c.id !== record.id);
        return [record, ...filtered];
      });
      if (user) {
        try {
          const res = await apiClient.upsertCircuit(record);
          setServerOffline(false);
          return res.circuit;
        } catch {
          setServerOffline(true);
        }
      }
      return record;
    },
    [user]
  );

  const deleteSavedCircuit = useCallback(
    async (id: string) => {
      setSavedCircuits((prev) => prev.filter((c) => c.id !== id));
      if (user) {
        try {
          await apiClient.deleteCircuit(id);
          setServerOffline(false);
        } catch {
          setServerOffline(true);
        }
      }
    },
    [user]
  );

  const registerAccount = useCallback(
    async (email: string, password: string, displayName: string) => {
      const reg = await apiClient.register(email, password, displayName);
      setUser(reg.user);
      setServerOffline(false);
      // Seamlessly migrate local guest progress & circuits to the newly registered account
      const migrated = await apiClient.migrateGuest(progress, savedCircuits);
      setProgress(migrated.progress);
      setSavedCircuits(migrated.circuits);
    },
    [progress, savedCircuits]
  );

  const loginAccount = useCallback(
    async (email: string, password: string) => {
      const log = await apiClient.login(email, password);
      setUser(log.user);
      setServerOffline(false);
      // Merge any local guest progress earned before login without losing data
      const migrated = await apiClient.migrateGuest(progress, savedCircuits);
      setProgress(migrated.progress);
      setSavedCircuits(migrated.circuits);
    },
    [progress, savedCircuits]
  );

  const logoutAccount = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const resetGuestData = useCallback(() => {
    const empty = createEmptyProgressState();
    setProgress(empty);
    setSavedCircuits([]);
  }, []);

  const t = useMemo(() => (lang === 'en' ? EN_STRINGS : RU_STRINGS), [lang]);

  const value: AppContextValue = {
    lang,
    setLang: setLangState,
    t,
    colorScheme,
    setColorScheme: setColorSchemeState,
    soundEnabled,
    setSoundEnabled: setSoundEnabledState,
    progress,
    savedCircuits,
    user,
    serverOffline,
    announce,
    recordStepAttempt,
    completeLesson,
    addNotebookEntry,
    deleteNotebookEntry,
    markComponentInspected,
    unlockEasterEgg,
    saveCircuit,
    deleteSavedCircuit,
    registerAccount,
    loginAccount,
    logoutAccount,
    resetGuestData,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="visually-hidden">
        {announcement}
      </div>
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
