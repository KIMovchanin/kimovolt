# Руководство разработчика (KIMOVOLT LAB)

## 1. Требования к окружению

- **Node.js:** v22+ / v26 LTS (в Windows PowerShell используйте `npm.cmd` и `npx.cmd`, если политика скриптов ограничивает `.ps1`)
- **Go:** 1.26+ (чистый Go, `CGO_ENABLED=0` — компилятор C не нужен)
- **Git** и опционально **Google Chrome** / Chromium для E2E-тестов Playwright

---

## 2. Локальный запуск в режиме разработки

### Вариант A: Hot-Reload разработка (2 терминала)

Терминал 1 — Go API-сервер (`:8080`):
```powershell
cd backend
$env:PORT="8080"
$env:DB_PATH="./dev-kimovolt.db"
$env:STATIC_DIR=""
go run ./cmd/server
```

Терминал 2 — Vite Dev Server (`:5173`, проксирует `/api` на `:8080`):
```powershell
$env:PATH = "C:\Program Files\nodejs;$env:PATH"
npm.cmd run dev
```

### Вариант B: Полный production-режим локально

```powershell
.\scripts\build-windows.ps1
$env:PORT="8080"
$env:DB_PATH=".\dev-kimovolt.db"
$env:STATIC_DIR=".\frontend\dist"
.\dist\kimovolt-lab.exe
```

---

## 3. Тестирование

```powershell
# Типизация TypeScript во всех workspaces
npm.cmd run typecheck

# Модульные тесты симулятора (MNA, диоды, макетка, логика, осциллограф) и контента (15 уроков, валидаторы, SRS)
npm.cmd test

# Интеграционные тесты Go API + SQLite
cd backend
go test -v ./...
cd ..

# E2E и визуальные тесты в реальном браузере (поднимает dist/kimovolt-lab.exe автоматически)
npx.cmd playwright test
```

---

## 4. Сборка под Linux ARM64 (Oracle Cloud Always Free) с Windows

Благодаря отсутствию CGO (`modernc.org/sqlite`) кросс-сборка выполняется одной командой:

```powershell
.\scripts\build-linux-arm64.ps1
```

Итоговые артефакты для переноса на сервер:
- `dist/kimovolt-lab-linux-arm64`
- `frontend/dist/`
- `deploy/` (`Caddyfile`, `kimovolt-lab.service`, `backup-sqlite.sh`, `update.sh`)
