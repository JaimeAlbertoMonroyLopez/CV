Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$vendorRoot = Join-Path $projectRoot "vendor"

New-Item -ItemType Directory -Path $vendorRoot -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $vendorRoot "bootstrap/css") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $vendorRoot "bootstrap/js") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $vendorRoot "fontawesome/css") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $vendorRoot "fontawesome/webfonts") -Force | Out-Null

Copy-Item (Join-Path $projectRoot "node_modules/alpinejs/dist/cdn.min.js") (Join-Path $vendorRoot "alpine.min.js") -Force
Copy-Item (Join-Path $projectRoot "node_modules/dexie/dist/dexie.min.js") (Join-Path $vendorRoot "dexie.min.js") -Force
Copy-Item (Join-Path $projectRoot "node_modules/bootstrap/dist/css/bootstrap.min.css") (Join-Path $vendorRoot "bootstrap/css/bootstrap.min.css") -Force
Copy-Item (Join-Path $projectRoot "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js") (Join-Path $vendorRoot "bootstrap/js/bootstrap.bundle.min.js") -Force
Copy-Item (Join-Path $projectRoot "node_modules/@fortawesome/fontawesome-free/css/all.min.css") (Join-Path $vendorRoot "fontawesome/css/all.min.css") -Force
Copy-Item (Join-Path $projectRoot "node_modules/@fortawesome/fontawesome-free/webfonts/*") (Join-Path $vendorRoot "fontawesome/webfonts/") -Recurse -Force
