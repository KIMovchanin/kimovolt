$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$env:PATH = "C:\Program Files\nodejs;$env:PATH"

Set-Location $Root
Write-Host "==> 1. Running TypeScript checks & unit tests..."
npm.cmd run typecheck
npm.cmd test

Write-Host "==> 2. Building Frontend bundle..."
npm.cmd run build --workspace=frontend

Write-Host "==> 3. Running Go tests & building Windows binary..."
Set-Location "$Root\backend"
go test -v ./...
$env:CGO_ENABLED = "0"
$env:GOOS = "windows"
$env:GOARCH = "amd64"
go build -o "$Root\dist\kimovolt-lab.exe" ./cmd/server

Write-Host "Done! Binary ready at $Root\dist\kimovolt-lab.exe"
