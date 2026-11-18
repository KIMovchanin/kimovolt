# Лицензии сторонних компонентов (Third-Party Licenses)

Все внешние библиотеки, используемые в **KIMOVOLT LAB**, имеют совместимые пермиссивные open-source лицензии.

## Frontend / Shared JS (`package.json`)

| Пакет | Лицензия | Назначение |
| --- | --- | --- |
| `react`, `react-dom` | MIT | Библиотека пользовательского интерфейса |
| `react-router-dom` | MIT | Клиентская маршрутизация SPA |
| `zod` | MIT | Валидация схем цепей и импорта JSON |
| `@fontsource/golos-text` | OFL-1.1 | Основной кириллический шрифт интерфейса |
| `@fontsource/unbounded` | OFL-1.1 | Акцентная редакционная типографика |
| `@fontsource/jetbrains-mono` | OFL-1.1 | Моноширинный шрифт с табличными цифрами |
| `vite`, `@vitejs/plugin-react` | MIT | Сборщик frontend (dev dependency) |
| `vitest`, `typescript` | MIT / Apache-2.0 | Тестирование и проверка типов (dev) |
| `@playwright/test` | Apache-2.0 | E2E и визуальное тестирование (dev) |

## Backend (`backend/go.mod`)

| Модуль | Лицензия | Назначение |
| --- | --- | --- |
| Go Standard Library (`net/http`, `log/slog`) | BSD-3-Clause | HTTP-сервер, маршрутизация, логирование |
| `modernc.org/sqlite` | BSD-3-Clause | Чистый Go-драйвер SQLite (без CGO) |
| `golang.org/x/crypto` (`argon2`) | BSD-3-Clause | Криптографическое хеширование паролей Argon2id |
