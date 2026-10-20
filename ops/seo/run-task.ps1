# ops/seo/run-task.ps1 -- shared launcher for every scheduled task.
#
# Task Scheduler passes only a TASK NAME (e.g. "bing-coverage"). All hyphenated
# flags live in tasks.json, never on the command line, because passing
# "-ExtraArgs \"--dry-run\"" through "powershell.exe -File" is unreliable: an outer
# PowerShell binds arguments before invoking Windows PowerShell 5.1 and expands a
# hyphenated token with no following whitespace character by character, so
# "--dry-run" arrives as "- - d r y - r u n". Keeping arguments in a file removes
# that failure mode instead of working around it.
#
# Task Scheduler setup:
#   Program:   powershell.exe
#   Arguments: -NoProfile -ExecutionPolicy Bypass -File "<...>\ops\seo\run-task.ps1" -Name bing-coverage
#
# Manual use:
#   .\run-task.ps1 -Name bing-coverage
#   .\run-task.ps1 -Name bing-coverage -ExtraArgs "--dry-run"   # adding flags by hand
#   .\run-task.ps1 -Name bing-coverage -List                    # show what would run
#
# This file is deliberately ASCII-only. Windows PowerShell 5.1 decodes a BOM-less
# file using the ANSI code page, so non-ASCII text here becomes mojibake and can
# break parsing; the Python scripts are the ones that print Chinese. .env and
# tasks.json are read with an explicit UTF-8 encoding, because they DO contain
# non-ASCII paths.
param(
  [Parameter(Mandatory = $true)][string]$Name,
  [string]$ExtraArgs = "",
  [switch]$List
)

$ErrorActionPreference = "Continue"
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path

# Capture native-command output as UTF-8. Without this, Windows PowerShell 5.1
# decodes the child process's stdout using the ANSI code page (936 here), so the
# Chinese the Python scripts print arrives as mojibake and then gets written to the
# log that way. Setting the console output encoding to UTF-8 makes the capture
# correct end to end.
try {
  [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
  $OutputEncoding = New-Object System.Text.UTF8Encoding($false)
} catch { }

function Fail([string]$msg) {
  Write-Host "[run-task] $msg"
  exit 2
}

# ---- .env: single source of configuration, read as UTF-8 -------------------
$EnvFile = Join-Path $Here ".env"
if (-not (Test-Path $EnvFile)) {
  Fail "missing config file: $EnvFile (copy CONFIG.example.env to .env; .env is gitignored)"
}
$cfg = @{}
foreach ($line in (Get-Content -LiteralPath $EnvFile -Encoding UTF8)) {
  $t = $line.Trim()
  if ($t -eq "" -or $t.StartsWith("#")) { continue }
  $i = $t.IndexOf("=")
  if ($i -lt 1) { continue }
  $k = $t.Substring(0, $i).Trim()
  $v = $t.Substring($i + 1).Trim().Trim('"')
  if ($v -ne "") { $cfg[$k] = $v }
}
foreach ($k in $cfg.Keys) { Set-Item -Path "Env:$k" -Value $cfg[$k] }

function Get-Cfg([string]$key, [string]$purpose) {
  if (-not $cfg.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($cfg[$key])) {
    Fail "missing required setting $key -- $purpose (see $EnvFile)"
  }
  return $cfg[$key]
}

# ---- tasks.json: what each task actually runs ------------------------------
$TasksFile = Join-Path $Here "tasks.json"
if (-not (Test-Path $TasksFile)) { Fail "missing task definitions: $TasksFile" }
try {
  $tasks = Get-Content -LiteralPath $TasksFile -Encoding UTF8 -Raw | ConvertFrom-Json
} catch {
  Fail "cannot parse $TasksFile : $($_.Exception.Message)"
}
if (-not $tasks.PSObject.Properties.Match($Name).Count) {
  $known = ($tasks.PSObject.Properties | Where-Object { $_.Name -notlike "_*" } | ForEach-Object { $_.Name }) -join ", "
  Fail "unknown task '$Name'. Known tasks: $known"
}
$def = $tasks.$Name

if ($List) {
  Write-Host "task      : $Name"
  Write-Host "script    : $($def.script)"
  Write-Host "args      : $($def.args -join ' ')"
  Write-Host "log       : $($def.log)"
  Write-Host "desc      : $($def.description)"
  exit 0
}

# ---- resolve the target script --------------------------------------------
$WsDir = Get-Cfg "DSH_WORKSPACE" "the .wx-bridge directory (contains plans/)"
$Target = $def.script
if (-not [System.IO.Path]::IsPathRooted($Target)) {
  foreach ($cand in @((Join-Path $Here $Target), (Join-Path $WsDir $Target))) {
    if (Test-Path $cand) { $Target = $cand; break }
  }
}
if (-not (Test-Path $Target)) { Fail "target script not found: $($def.script)" }

# ---- interpreter -----------------------------------------------------------
$ext = [System.IO.Path]::GetExtension($Target).ToLower()
switch ($ext) {
  ".py"  { $exe = Get-Cfg "DSH_PYTHON" "Python interpreter path" }
  ".mjs" { $exe = Get-Cfg "DSH_NODE"   "Node interpreter path" }
  ".js"  { $exe = Get-Cfg "DSH_NODE"   "Node interpreter path" }
  ".ps1" { $exe = "powershell.exe" }
  default { $exe = Get-Cfg "DSH_PYTHON" "interpreter path" }
}
if ($ext -ne ".ps1" -and -not (Test-Path $exe)) { Fail "interpreter not found: $exe" }

# ---- arguments: from tasks.json, plus anything passed by hand --------------
$argList = @()
if ($def.args) { $argList += @($def.args) }
if ($ExtraArgs -ne "") { $argList += ($ExtraArgs.Split(" ") | Where-Object { $_ -ne "" }) }

# ---- logging ---------------------------------------------------------------
$LogName = if ($def.log) { $def.log } else { [System.IO.Path]::GetFileNameWithoutExtension($Target) }
$LogPath = Join-Path $WsDir ("_{0}.log" -f $LogName)
function Say([string]$m) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $m
  Write-Output $line
  try { [System.IO.File]::AppendAllText($LogPath, $line + [Environment]::NewLine, [System.Text.Encoding]::UTF8) }
  catch { try { Add-Content -LiteralPath $LogPath -Value $line } catch { } }
}

# ---- run -------------------------------------------------------------------
Set-Location $Here
Say ("=== start {0} {1} (pid {2}) ===" -f (Split-Path $Target -Leaf), ($argList -join " "), $PID)

if ($ext -eq ".ps1") {
  $out = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Target @argList 2>&1
} else {
  $out = & $exe $Target @argList 2>&1
}
$code = $LASTEXITCODE
foreach ($l in $out) { Say "$l" }
Say ("=== end exit={0} ===" -f $code)
exit $code
