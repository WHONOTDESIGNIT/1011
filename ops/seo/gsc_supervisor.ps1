# ops/seo/gsc_supervisor.ps1 -- keeps the GSC URL-inspection batch running across
# the daily quota reset.
#
# Exit codes from the runner: 0 = nothing left, 2 = quota exceeded (sleep, retry).
# Configuration comes from .env; nothing is hardcoded.
#
# NOTE: keep this file ASCII-only (Windows PowerShell 5.1 decodes a BOM-less file
# with the ANSI code page, so non-ASCII would become mojibake and can break parsing).
param(
  [int]$QuotaSleepSeconds = 1200,    # 20 minutes between rounds after a quota hit
  [int]$ErrorSleepSeconds = 300,     # 5 minutes after an unexpected exit
  [int]$MaxRounds = 0                # 0 = unlimited
)

$ErrorActionPreference = "Continue"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path

try {
  [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
  $OutputEncoding = New-Object System.Text.UTF8Encoding($false)
} catch { }

function Fail([string]$msg) { Write-Host "[gsc_supervisor] $msg"; exit 2 }

$EnvFile = Join-Path $Here ".env"
if (Test-Path $EnvFile) {
  foreach ($line in (Get-Content -LiteralPath $EnvFile -Encoding UTF8)) {
    $t = $line.Trim()
    if ($t -eq "" -or $t.StartsWith("#")) { continue }
    $i = $t.IndexOf("=")
    if ($i -lt 1) { continue }
    $k = $t.Substring(0, $i).Trim()
    $v = $t.Substring($i + 1).Trim().Trim('"')
    if ($v -ne "" -and -not [Environment]::GetEnvironmentVariable($k)) {
      Set-Item -Path "Env:$k" -Value $v
    }
  }
}

$WS = [Environment]::GetEnvironmentVariable("DSH_WORKSPACE")
if ([string]::IsNullOrWhiteSpace($WS)) { Fail "missing required setting DSH_WORKSPACE -- the .wx-bridge directory" }
$DATA = if ([Environment]::GetEnvironmentVariable("DSH_DATA_DIR")) { [Environment]::GetEnvironmentVariable("DSH_DATA_DIR") } else { $WS }
$NODE = [Environment]::GetEnvironmentVariable("DSH_NODE")
if ([string]::IsNullOrWhiteSpace($NODE)) { Fail "missing required setting DSH_NODE -- Node interpreter path" }
if (-not (Test-Path $NODE)) { Fail "interpreter not found: $NODE" }

$Runner = Join-Path $Here "gsc_run.mjs"
if (-not (Test-Path $Runner)) { Fail "missing component: $Runner" }
$ResultFile = Join-Path $DATA "_gsc_results.jsonl"
$LogPath    = Join-Path $WS "_gsc_supervisor.log"

function Say($m) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $m
  Write-Output $line
  try { [System.IO.File]::AppendAllText($LogPath, $line + [Environment]::NewLine, [System.Text.Encoding]::UTF8) }
  catch { try { Add-Content -LiteralPath $LogPath -Value $line } catch { } }
}

Set-Location $Here
$env:WORKERS = "3"
$env:WAIT_MS = "90000"
Remove-Item Env:GSC_RESULT -ErrorAction SilentlyContinue

$round = 0
while ($true) {
  $round++
  Say "round $round starting"
  & $NODE $Runner 2>&1 | ForEach-Object { Say "$_" }
  $code = $LASTEXITCODE
  $done = 0
  if (Test-Path $ResultFile) {
    $done = (Get-Content -LiteralPath $ResultFile -Encoding UTF8 -ErrorAction SilentlyContinue |
             Where-Object { $_ -match '"status":"(indexed|not_indexed)"' }).Count
  }
  Say "round $round exit=$code done=$done"
  if ($code -eq 0) { Say "all URLs processed"; break }
  if ($MaxRounds -gt 0 -and $round -ge $MaxRounds) { Say "reached MaxRounds=$MaxRounds"; break }
  if ($code -eq 2) {
    Say "quota exceeded - sleeping $QuotaSleepSeconds seconds"
    Start-Sleep -Seconds $QuotaSleepSeconds
  } else {
    Say "unexpected exit - sleeping $ErrorSleepSeconds seconds"
    Start-Sleep -Seconds $ErrorSleepSeconds
  }
}
Say "supervisor finished"
