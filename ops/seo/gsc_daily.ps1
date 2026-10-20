# ops/seo/gsc_daily.ps1 -- daily GSC URL-inspection task.
#
# Runs the Playwright batch until Google's browser-UI inspection quota stops it,
# then merges the results into the Coverage workbook. Registered at 07:25 daily.
#
# Configuration comes from .env (read as UTF-8 by the caller or by this script),
# never from hardcoded paths. Set -DryRun to validate the wiring without driving a
# browser or writing anything: for a script whose normal operation is "drive a real
# browser", any attempt to check the wiring IS a real run unless there is a dry-run.
#
# NOTE: keep this file ASCII-only. Windows PowerShell 5.1 decodes a BOM-less file
# using the ANSI code page, so non-ASCII text here becomes mojibake and can break
# parsing.
param([switch]$DryRun)

$ErrorActionPreference = "Continue"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path

try {
  [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
  $OutputEncoding = New-Object System.Text.UTF8Encoding($false)
} catch { }

function Fail([string]$msg) { Write-Host "[gsc_daily] $msg"; exit 2 }

# ---- configuration: .env if the launcher has not already loaded it ----------
$EnvFile = Join-Path $Here ".env"
if (Test-Path $EnvFile) {
  $loaded = 0
  foreach ($line in (Get-Content -LiteralPath $EnvFile -Encoding UTF8)) {
    $t = $line.Trim()
    if ($t -eq "" -or $t.StartsWith("#")) { continue }
    $i = $t.IndexOf("=")
    if ($i -lt 1) { continue }
    $k = $t.Substring(0, $i).Trim()
    $v = $t.Substring($i + 1).Trim().Trim('"')
    if ($v -ne "" -and -not [Environment]::GetEnvironmentVariable($k)) {
      Set-Item -Path "Env:$k" -Value $v
      $loaded++
    }
  }
}

function Need([string]$name, [string]$purpose) {
  $v = [Environment]::GetEnvironmentVariable($name)
  if ([string]::IsNullOrWhiteSpace($v)) { Fail "missing required setting $name -- $purpose" }
  return $v
}

$WS   = Need "DSH_WORKSPACE" "the .wx-bridge directory"
$DATA = if ([Environment]::GetEnvironmentVariable("DSH_DATA_DIR")) { [Environment]::GetEnvironmentVariable("DSH_DATA_DIR") } else { $WS }
$NODE = Need "DSH_NODE" "Node interpreter path"
$PY   = Need "DSH_PYTHON" "Python interpreter path"
$LOG  = Join-Path $WS "_gsc_daily.log"
$FLAG = Join-Path $DATA "_gsc_needs_login.flag"

foreach ($p in @($NODE, $PY)) {
  if (-not (Test-Path $p)) { Fail "interpreter not found: $p" }
}
$Runner   = Join-Path $Here "gsc_run.mjs"
$Merger   = Join-Path $Here "gsc_daily_merge.py"
foreach ($p in @($Runner, $Merger)) {
  if (-not (Test-Path $p)) { Fail "missing component: $p" }
}

function Write-Log([string]$m) {
  Write-Output $m
  try { [System.IO.File]::AppendAllText($LOG, $m + [Environment]::NewLine, [System.Text.Encoding]::UTF8) }
  catch { try { Add-Content -Path $LOG -Value $m } catch { } }
}
function Say([string]$m) { Write-Log ("[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $m) }

Set-Location $Here

if ($DryRun) {
  # Validate every path and the interpreter without launching a browser.
  Say "=== dry-run: configuration check only ==="
  Say ("  WS   = {0}" -f $WS)
  Say ("  DATA = {0}" -f $DATA)
  Say ("  NODE = {0} (exists: {1})" -f $NODE, (Test-Path $NODE))
  Say ("  PY   = {0} (exists: {1})" -f $PY, (Test-Path $PY))
  Say ("  runner = {0} (exists: {1})" -f $Runner, (Test-Path $Runner))
  Say ("  merger = {0} (exists: {1})" -f $Merger, (Test-Path $Merger))
  Say ("  browser profile = {0} (exists: {1})" -f $env:DSH_BROWSER_PROFILE, (Test-Path $env:DSH_BROWSER_PROFILE))
  Say "  no browser launched, nothing written"
  Say "=== dry-run end ==="
  exit 0
}

Say "=== daily GSC inspection run start (pid $PID) ==="
if (Test-Path $FLAG) { Say "NOTE: _gsc_needs_login.flag present - Google re-login required before results can grow" }

$env:WORKERS = "3"
$env:WAIT_MS = "90000"
$out = & $NODE $Runner 2>&1
$code = $LASTEXITCODE
foreach ($l in $out) { Write-Log "$l" }
Say "runner exit=$code"

if ("$out" -match "SESSION_EXPIRED") {
  New-Item -ItemType File -Force -Path $FLAG | Out-Null
  Say "SESSION EXPIRED - Google login in the automation profile is gone; re-login needed"
} elseif (Test-Path $FLAG) {
  Remove-Item $FLAG -Force -ErrorAction SilentlyContinue
}

$mout = & $PY $Merger 2>&1
$mcode = $LASTEXITCODE
foreach ($l in $mout) { Write-Log "$l" }
Say "merge exit=$mcode"
Say "=== daily GSC inspection run end ==="
exit $mcode
