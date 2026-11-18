export interface UIStrings {
  brand: {
    shortName: string;
    fullName: string;
    motto: string;
  };
  nav: {
    learn: string;
    lab: string;
    projects: string;
    progress: string;
    reference: string;
    profile: string;
    skipToContent: string;
  };
  common: {
    check: string;
    next: string;
    prev: string;
    hint: string;
    reset: string;
    save: string;
    load: string;
    exportJson: string;
    importJson: string;
    close: string;
    shortcuts: string;
    loading: string;
    offlineBanner: string;
    guestBadge: string;
    minutesShort: string;
  };
  home: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    heroPrompt: string;
    heroClosedMsg: string;
    startLearning: string;
    openLab: string;
    voltageLabel: string;
    currentLabel: string;
    powerLabel: string;
    stateOpen: string;
    stateClosed: string;
    demosHeading: string;
  };
  learn: {
    mapView: string;
    listView: string;
    statusLocked: string;
    statusAvailable: string;
    statusInProgress: string;
    statusCompleted: string;
    statusMastered: string;
    statusNeedsReview: string;
    upcomingBadge: string;
    openLesson: string;
    repeatReview: string;
  };
  workbench: {
    schematicMode: string;
    breadboardMode: string;
    xrayMode: string;
    currentOverlay: string;
    voltageOverlay: string;
    powerOverlay: string;
    whatIfMode: string;
    diagnostics: string;
    multimeter: string;
    oscilloscope: string;
    currentDisclaimer: string;
    ledModelNote: string;
    magicSmokeEasterEgg: string;
    answer42EasterEgg: string;
  };
}

export const RU_STRINGS: UIStrings = {
  brand: {
    shortName: 'KIMOVOLT',
    fullName: 'KIMOVOLT LAB',
    motto: 'Не просто изучай электронику. Заставь её работать.',
  },
  nav: {
    learn: 'Учиться',
    lab: 'Лаборатория',
    projects: 'Проекты',
    progress: 'Прогресс',
    reference: 'Справочник',
    profile: 'Профиль',
    skipToContent: 'Перейти к основному содержимому',
  },
  common: {
    check: 'Проверить',
    next: 'Далее',
    prev: 'Назад',
    hint: 'Подсказка',
    reset: 'Сбросить',
    save: 'Сохранить',
    load: 'Загрузить',
    exportJson: 'Экспорт .kimovolt.json',
    importJson: 'Импорт JSON',
    close: 'Закрыть',
    shortcuts: 'Клавиши',
    loading: 'Вычисление...',
    offlineBanner: 'Сервер синхронизации недоступен — локальная лаборатория и уроки продолжают работать автономно.',
    guestBadge: 'Гостевой режим',
    minutesShort: 'мин',
  },
  home: {
    eyebrow: 'ИНТЕРАКТИВНАЯ ЛАБОРАТОРИЯ ЭЛЕКТРОНИКИ',
    headline: 'Не просто изучай электронику. Заставь её работать.',
    subheadline:
      'Настоящий математический симулятор цепей, виртуальные приборы, диагностика неисправностей и путь от первого светодиода до Arduino и ESP32.',
    heroPrompt: 'Нажми на выключатель SW1 прямо в этой схеме:',
    heroClosedMsg: 'Только что ты замкнул свою первую электрическую цепь.',
    startLearning: 'Начать Урок 1',
    openLab: 'Открыть лабораторию',
    voltageLabel: 'Источник',
    currentLabel: 'Ток цепи',
    powerLabel: 'Мощность R1',
    stateOpen: 'Цепь разомкнута',
    stateClosed: 'Ток идёт',
    demosHeading: 'Обучение через физику, измерения и практику',
  },
  learn: {
    mapView: 'Плата-карта',
    listView: 'Список',
    statusLocked: 'Заблокирован',
    statusAvailable: 'Доступен',
    statusInProgress: 'В процессе',
    statusCompleted: 'Завершён',
    statusMastered: 'Освоен',
    statusNeedsReview: 'Требует повторения',
    upcomingBadge: 'Следующий этап (в разработке)',
    openLesson: 'Открыть урок',
    repeatReview: 'Повторить навык',
  },
  workbench: {
    schematicMode: 'Схема',
    breadboardMode: 'Макетная плата',
    xrayMode: 'X-Ray',
    currentOverlay: 'Показать ток',
    voltageOverlay: 'Показать напряжение',
    powerOverlay: 'Показать мощность',
    whatIfMode: 'Что если?',
    diagnostics: 'Консоль',
    multimeter: 'Мультиметр',
    oscilloscope: 'Осциллограф',
    currentDisclaimer: 'Импульсы показывают условное направление тока (+ → −), а не скорость дрейфа электронов.',
    ledModelNote: 'Учебная кусочно-линейная модель LED (порог Vf + 0.5 Ω); у реальных диодов экспоненциальная ВАХ.',
    magicSmokeEasterEgg: 'В реальной лаборатории это могло бы закончиться волшебным дымом.',
    answer42EasterEgg: '42 Ω — найден ответ на главный вопрос электроники и всего остального!',
  },
};
