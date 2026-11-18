$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$env:PATH = "C:\Program Files\nodejs;$env:PATH"

Set-Location $Root
Write-Host "==> 1. Building Frontend production bundle..."
npm.cmd run build --workspace=frontend

Write-Host "==> 2. Cross-compiling pure-Go static Linux ARM64 binary..."
Set-Location "$Root\backend"
$env:CGO_ENABLED = "0"
$env:GOOS = "linux"
$env:GOARCH = "arm64"
go build -trimpath -ldflags="-s -w" -o "$Root\dist\kimovolt-lab-linux-arm64" ./cmd/server

Write-Host "Done! Linux ARM64 binary ready at $Root\dist\kimovolt-lab-linux-arm64"
