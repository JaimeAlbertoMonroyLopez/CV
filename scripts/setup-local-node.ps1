param(
  [string]$Version
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$toolsDir = Join-Path $projectRoot ".tools"
$nodeDir = Join-Path $toolsDir "node"
$versionFile = Join-Path $projectRoot ".node-version"
$defaultVersion = "v22.15.1"

if (-not $PSBoundParameters.ContainsKey("Version")) {
  if (Test-Path $versionFile) {
    $Version = Get-Content -Path $versionFile -TotalCount 1
  } else {
    $Version = $defaultVersion
  }
}

$Version = $Version.Trim()
if ([string]::IsNullOrWhiteSpace($Version)) {
  throw "Node version cannot be empty."
}

if (-not $Version.StartsWith("v")) {
  $Version = "v$Version"
}

$nodeExe = Join-Path $nodeDir "node.exe"
if (Test-Path $nodeExe) {
  $installedVersion = (& $nodeExe --version).Trim()
  if ($LASTEXITCODE -eq 0 -and $installedVersion -eq $Version) {
    Write-Host "Local Node $Version already installed at $nodeDir"
    exit 0
  }

  Write-Host "Local Node $installedVersion found, expected $Version. Reinstalling..."
}

New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null

$zipName = "node-$Version-win-x64.zip"
$downloadUrl = "https://nodejs.org/dist/$Version/$zipName"
$zipPath = Join-Path $toolsDir $zipName
$extractRoot = Join-Path $toolsDir "node-extract"

Write-Host "Downloading $downloadUrl"
Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath

if (Test-Path $extractRoot) {
  Remove-Item -Path $extractRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $extractRoot | Out-Null

Expand-Archive -Path $zipPath -DestinationPath $extractRoot -Force

$expandedFolder = Join-Path $extractRoot "node-$Version-win-x64"
if (-not (Test-Path $expandedFolder)) {
  throw "Expected folder not found: $expandedFolder"
}

if (Test-Path $nodeDir) {
  Remove-Item -Path $nodeDir -Recurse -Force
}

Move-Item -Path $expandedFolder -Destination $nodeDir
Remove-Item -Path $extractRoot -Recurse -Force
Remove-Item -Path $zipPath -Force

Write-Host "Local Node $Version installed at $nodeDir"
Write-Host "Use .\\scripts\\npm-local.ps1 <npm-args> to run npm with local Node."
