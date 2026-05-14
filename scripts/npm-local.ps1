param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$NpmArgs
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$setupScript = Join-Path $projectRoot "scripts/setup-local-node.ps1"
$nodeExe = Join-Path $projectRoot ".tools/node/node.exe"
$npmCli = Join-Path $projectRoot ".tools/node/node_modules/npm/bin/npm-cli.js"

if (-not (Test-Path $setupScript)) {
  throw "Setup script not found: $setupScript"
}

# Ensure required local Node version exists before invoking npm.
& $setupScript
if ($LASTEXITCODE -ne 0) {
  throw "Unable to setup local Node runtime."
}

if (-not (Test-Path $npmCli)) {
  throw "npm-cli.js was not found in local Node distribution."
}

& $nodeExe $npmCli @NpmArgs
exit $LASTEXITCODE
