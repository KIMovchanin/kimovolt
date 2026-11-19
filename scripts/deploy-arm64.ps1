param(
    [Parameter(Mandatory = $true)]
    [string]$ServerIp,
    [Parameter(Mandatory = $true)]
    [string]$KeyPath,
    [string]$User = "ubuntu",
    [string]$RemoteDir = "/opt/kimovolt-lab",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path -LiteralPath $KeyPath)) {
    throw "SSH key not found at path: $KeyPath"
}

if (-not $SkipBuild) {
    Write-Host "==> 1. Building frontend and static Linux ARM64 binary..."
    & "$PSScriptRoot\build-linux-arm64.ps1"
    if ($LASTEXITCODE -ne 0) {
        throw "build-linux-arm64.ps1 failed with exit code $LASTEXITCODE"
    }
}

$BinaryPath = Join-Path $Root "dist\kimovolt-lab-linux-arm64"
$FrontendIndex = Join-Path $Root "frontend\dist\index.html"
if (-not (Test-Path -LiteralPath $BinaryPath)) {
    throw "ARM64 binary not found at $BinaryPath"
}
if (-not (Test-Path -LiteralPath $FrontendIndex)) {
    throw "Frontend build not found at $FrontendIndex"
}

Write-Host "==> 2. Packaging release archive..."
$StageDir = Join-Path $Root "dist\release-stage"
$ArchivePath = Join-Path $Root "dist\kimovolt-release.tar.gz"
if (Test-Path -LiteralPath $StageDir) {
    Remove-Item -LiteralPath $StageDir -Recurse -Force
}
if (Test-Path -LiteralPath $ArchivePath) {
    Remove-Item -LiteralPath $ArchivePath -Force
}

New-Item -ItemType Directory -Path (Join-Path $StageDir "frontend") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $StageDir "deploy") -Force | Out-Null
Copy-Item -LiteralPath $BinaryPath -Destination (Join-Path $StageDir "kimovolt-lab-linux-arm64")
Copy-Item -LiteralPath (Join-Path $Root "frontend\dist") -Destination (Join-Path $StageDir "frontend\dist") -Recurse
Copy-Item -Path (Join-Path $Root "deploy\*") -Destination (Join-Path $StageDir "deploy") -Recurse

# Ensure Unix LF on staged shell scripts
Get-ChildItem -Path (Join-Path $StageDir "deploy") -Filter "*.sh" | ForEach-Object {
    $raw = [System.IO.File]::ReadAllText($_.FullName) -replace "`r`n", "`n"
    [System.IO.File]::WriteAllText($_.FullName, $raw, [System.Text.UTF8Encoding]::new($false))
}

try {
    & tar.exe -czf $ArchivePath -C $StageDir .
    if ($LASTEXITCODE -ne 0) {
        throw "tar.exe failed with exit code $LASTEXITCODE"
    }

    Write-Host "==> 3. Uploading release archive to ${User}@${ServerIp}..."
    & scp.exe -i $KeyPath -o StrictHostKeyChecking=accept-new $ArchivePath "${User}@${ServerIp}:/tmp/kimovolt-release.tar.gz"
    if ($LASTEXITCODE -ne 0) {
        throw "scp.exe failed with exit code $LASTEXITCODE"
    }

    Write-Host "==> 4. Applying atomic deployment on remote server..."
    $RemoteScript = @"
set -euo pipefail
REMOTE_DIR='$RemoteDir'
ARCHIVE='/tmp/kimovolt-release.tar.gz'
STAGE=`$(mktemp -d)
cleanup() {
  rm -rf "`$STAGE" "`$ARCHIVE"
}
trap cleanup EXIT

if [ -f "`$REMOTE_DIR/data/kimovolt.db" ] && [ -x "`$REMOTE_DIR/deploy/backup-sqlite.sh" ]; then
  if id kimovolt >/dev/null 2>&1; then
    sudo -u kimovolt "`$REMOTE_DIR/deploy/backup-sqlite.sh"
  else
    "`$REMOTE_DIR/deploy/backup-sqlite.sh"
  fi
fi

tar -xzf "`$ARCHIVE" -C "`$STAGE"
sudo mkdir -p "`$REMOTE_DIR/data" "`$REMOTE_DIR/backups" "`$REMOTE_DIR/deploy" "`$REMOTE_DIR/frontend"

sudo install -m 0755 "`$STAGE/kimovolt-lab-linux-arm64" "`$REMOTE_DIR/kimovolt-lab-linux-arm64.new"
sudo mv -f "`$REMOTE_DIR/kimovolt-lab-linux-arm64.new" "`$REMOTE_DIR/kimovolt-lab-linux-arm64"

sudo rm -rf "`$REMOTE_DIR/frontend/dist.new" "`$REMOTE_DIR/frontend/dist.old"
sudo cp -r "`$STAGE/frontend/dist" "`$REMOTE_DIR/frontend/dist.new"
if [ -d "`$REMOTE_DIR/frontend/dist" ]; then
  sudo mv "`$REMOTE_DIR/frontend/dist" "`$REMOTE_DIR/frontend/dist.old"
fi
sudo mv "`$REMOTE_DIR/frontend/dist.new" "`$REMOTE_DIR/frontend/dist"
sudo rm -rf "`$REMOTE_DIR/frontend/dist.old"

sudo cp -r "`$STAGE/deploy/." "`$REMOTE_DIR/deploy/"
sudo sed -i 's/\r$//' "`$REMOTE_DIR/deploy/"*.sh
sudo chmod +x "`$REMOTE_DIR/deploy/"*.sh

if id kimovolt >/dev/null 2>&1; then
  sudo chown -R kimovolt:kimovolt "`$REMOTE_DIR"
fi

if [ -f /etc/systemd/system/kimovolt-lab.service ]; then
  if ! sudo cmp -s "`$REMOTE_DIR/deploy/kimovolt-lab.service" /etc/systemd/system/kimovolt-lab.service; then
    sudo cp "`$REMOTE_DIR/deploy/kimovolt-lab.service" /etc/systemd/system/kimovolt-lab.service
    sudo systemctl daemon-reload
  fi
fi

"`$REMOTE_DIR/deploy/update.sh"
"@
    $RemoteScriptLF = $RemoteScript -replace "`r`n", "`n"
    $EncodedScript = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($RemoteScriptLF))
    & ssh.exe -i $KeyPath -o StrictHostKeyChecking=accept-new "${User}@${ServerIp}" "echo $EncodedScript | base64 -d | bash"
    if ($LASTEXITCODE -ne 0) {
        throw "Remote deploy over SSH failed with exit code $LASTEXITCODE"
    }

    Write-Host "Deployment succeeded!"
}
finally {
    if (Test-Path -LiteralPath $StageDir) {
        Remove-Item -LiteralPath $StageDir -Recurse -Force
    }
}
