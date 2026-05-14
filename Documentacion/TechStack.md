# Technology Stack and Concepts

## Core Runtime Stack

### TypeScript
Primary source language for application logic in `src/`. Code is compiled with `tsc` into browser-ready JavaScript in `dist/`.

### Alpine.js
Lightweight JavaScript framework used for reactive behavior in HTML-first interfaces without a full SPA runtime.

### Dexie.js
IndexedDB wrapper that provides a cleaner async API for schema definition and CRUD operations in the browser.

### Bootstrap
UI utility and component framework used as a local dependency. Runtime assets are loaded from `vendor/` (no CDN dependency).

### Font Awesome
Icon library used as a local dependency. Runtime assets are loaded from `vendor/` (including `webfonts`) for offline reliability.

## Build and Local Tooling

### Portable Local Node.js
Project-local Node runtime installed under `.tools/node`, used to avoid reliance on a system-wide Node installation.

### npm-local Wrapper
`scripts/npm-local.ps1` runs npm commands through the local Node runtime.

### Vendor Sync Script
`scripts/sync-vendor.ps1` copies runtime assets from `node_modules` into `vendor/` for offline/static delivery.

## Quality and Architecture Controls

### TypeScript and JavaScript
- **ESLint** with `@eslint/js`, `typescript-eslint`, and `eslint-plugin-import`
- Rules include architecture-related checks such as cycle prevention (`import/no-cycle`) and strict TypeScript conventions.

### HTML and CSS
- **html-validate** for HTML policy validation
- **stylelint** for CSS policy validation and naming consistency (`cv-` component naming pattern)

### Dependency Architecture
- **dependency-cruiser** for layered architecture rules
- **madge** for circular dependency detection

## Web Persistence Concepts (Reference)

### IndexedDB
Browser-native NoSQL database for durable structured data, suitable for larger datasets and frequent async updates.

### localStorage
Persistent key-value browser storage scoped by origin. Best for small string-based settings, not high-volume structured data.

### sessionStorage
Key-value storage scoped to the current tab/window session and cleared when the tab/window closes.

### Cookie
Small browser-stored data sent with HTTP requests according to cookie policy and attributes. Commonly used for session-related concerns.

### Cache API
Browser API for storing and retrieving HTTP `Request`/`Response` pairs, typically used with Service Workers for offline support and performance.

### OPFS (Origin Private File System)
Origin-scoped private file storage from the File System Access API, designed for efficient file read/write workflows in web applications.

