<#
SmartLaw Mietrecht - PowerShell Startscript (lokal)

Dieses Skript ist die PowerShell-Variante von `start_local_test.bat`.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host '========================================================'
Write-Host '  SmartLaw Mietrecht - Local Testing Environment 🧪'
Write-Host '========================================================'

# Pfad zum Repo-Root
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $RepoRoot

# Logging
$LogFile = Join-Path $RepoRoot 'start_local_test.log'
function Rotate-LogIfLarge($Path, $MaxBytes = 5MB, $Keep = 5) {
    if (Test-Path $Path) {
        $size = (Get-Item $Path).Length
        if ($size -gt $MaxBytes) {
            $ts = (Get-Date).ToString('yyyyMMdd-HHmmss')
            $rot = "$Path.$ts"
            Move-Item -Force -Path $Path -Destination $rot
            # cleanup: keep only latest $Keep
            $pattern = "$Path.*"
            $backups = Get-ChildItem -Path (Split-Path $Path) -Filter "$(Split-Path $Path -Leaf).*" -File | Sort-Object LastWriteTime -Descending
            if ($backups.Count -gt $Keep) {
                $backups[$Keep..($backups.Count-1)] | Remove-Item -Force
            }
        }
    }
}

Rotate-LogIfLarge -Path $LogFile
"=======================================================`nStart: $(Get-Date)`n=======================================================" | Out-File -FilePath $LogFile -Encoding utf8

Write-Host 'Prüfe Voraussetzungen: node, npm'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error 'node nicht im PATH gefunden. Bitte Node.js installieren.'
    "[Error] node not found" | Out-File -FilePath $LogFile -Append
    exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error 'npm nicht im PATH gefunden. Bitte Node.js installieren.'
    "[Error] npm not found" | Out-File -FilePath $LogFile -Append
    exit 1
}

# Versionsprüfung Node (grobe)
$nodeVer = (node -v).TrimStart('v')
$nodeParts = $nodeVer.Split('.')
if ([int]$nodeParts[0] -lt 18) {
    Write-Error "Node-Version $nodeVer ist kleiner als die erforderliche 18.0"
    "[Error] Node version $nodeVer < 18" | Out-File -FilePath $LogFile -Append
    exit 1
}

$npmVer = (npm -v).Trim()
try { $npmMajor = [int]($npmVer.Split('.')[0]) } catch { $npmMajor = 0 }
if ($npmMajor -lt 8) { Write-Warning "npm-Version $npmVer ist kleiner als empfohlen 8"; "[Warn] npm $npmVer" | Out-File -FilePath $LogFile -Append }

Write-Host '1/3 - Prisma DB push (services/backend)'
"[1/3] Syncing Database..." | Out-File -FilePath $LogFile -Append

# Prüfe PostgreSQL-Verfügbarkeit
if (-not $env:PGHOST) { $env:PGHOST = 'localhost' }
if (-not $env:PGPORT) { $env:PGPORT = '5432' }
Write-Host "Prüfe PostgreSQL auf $($env:PGHOST):$($env:PGPORT)"
if (-not (Test-NetConnection -ComputerName $env:PGHOST -Port [int]$env:PGPORT -InformationLevel Quiet)) {
    if ($env:SKIP_PG_CHECK -eq '1') {
        Write-Warning "PostgreSQL $($env:PGHOST):$($env:PGPORT) nicht erreichbar, SKIP_PG_CHECK=1 gesetzt - fahre fort"
        "[Warn] Postgres not reachable $($env:PGHOST):$($env:PGPORT)" | Out-File -FilePath $LogFile -Append
    } else {
        Write-Error "PostgreSQL $($env:PGHOST):$($env:PGPORT) nicht erreichbar. Setze SKIP_PG_CHECK=1 um zu überschreiben."
        "[Error] Postgres not reachable $($env:PGHOST):$($env:PGPORT)" | Out-File -FilePath $LogFile -Append
        exit 1
    }
}

Push-Location -Path (Join-Path $RepoRoot 'services\backend')
try {
    & npx prisma db push 2>&1 | Tee-Object -FilePath $LogFile -Append
} catch {
    Write-Error 'prisma db push fehlgeschlagen.'
    "[Error] prisma db push failed" | Out-File -FilePath $LogFile -Append
    Pop-Location
    exit 1
}
Pop-Location

Write-Host '2/3 - Backend starten'
"[2/3] Starting Backend..." | Out-File -FilePath $LogFile -Append
if (-not $env:BACKEND_LOG) { $env:BACKEND_LOG = '1' }
if (-not $env:BACKEND_LOGFILE) { $env:BACKEND_LOGFILE = Join-Path $RepoRoot 'backend.log' }

function Rotate-BackendLogIfLarge() {
    $path = $env:BACKEND_LOGFILE
    if (Test-Path $path) {
        $size = (Get-Item $path).Length
        if ($size -gt 5MB) {
            $ts = (Get-Date).ToString('yyyyMMdd-HHmmss')
            Move-Item -Force -Path $path -Destination "$path.$ts"
            $backs = Get-ChildItem -Path (Split-Path $path) -Filter "$(Split-Path $path -Leaf).*" -File | Sort-Object LastWriteTime -Descending
            if ($backs.Count -gt 5) { $backs[5..($backs.Count-1)] | Remove-Item -Force }
        }
    }
}

Rotate-BackendLogIfLarge

if ($env:BACKEND_LOG -eq '1') {
    Write-Host "Backend-Logging aktiviert -> $($env:BACKEND_LOGFILE)"
    Start-Process -FilePath 'powershell' -ArgumentList "-NoExit","-Command","Set-Location -Path '$RepoRoot\\services\\backend'; npm run dev *> '$($env:BACKEND_LOGFILE)'" -WindowStyle Normal
} else {
    Start-Process -FilePath 'powershell' -ArgumentList "-NoExit","-Command","Set-Location -Path '$RepoRoot\\services\\backend'; npm run dev" -WindowStyle Normal
}

Write-Host '3/3 - Mobile App starten'
"[3/3] Starting Mobile App..." | Out-File -FilePath $LogFile -Append
Push-Location -Path (Join-Path $RepoRoot 'mobile-app')
if (-not (Test-Path 'node_modules\expo\package.json')) {
    Write-Host 'Installiere mobile dependencies (npm install --legacy-peer-deps)'
    "[Info] npm install mobile-app" | Out-File -FilePath $LogFile -Append
    & npm install --legacy-peer-deps 2>&1 | Tee-Object -FilePath $LogFile -Append
}

& npm start

Pop-Location

Write-Host 'Fertig.'
