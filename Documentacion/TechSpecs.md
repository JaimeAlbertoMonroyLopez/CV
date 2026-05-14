# Technical Specifications

## 1) Architecture Proposal

The project follows a lightweight layered architecture designed for Alpine.js reactive UI and Dexie.js persistence over IndexedDB.

Current implementation baseline and technical stack:

- **Language and output**: TypeScript source in `src/` is compiled with `tsc` into browser-ready JavaScript in `dist/` (no Node.js backend runtime).
- **UI/runtime target**: Static browser app (`index.html` + CSS + compiled JS).
- **Reactive state and persistence stack**: Alpine.js (reactive stores/components) + Dexie.js over IndexedDB.
- **Library loading policy**: No CDN references in runtime pages; browser libraries are loaded from local project files under `vendor/`.
- **UI libraries (offline/local)**: Bootstrap and Font Awesome are installed via npm and published to `vendor/` through `vendor:sync`.
- **Code quality tooling**: ESLint (`@eslint/js`, `eslint-plugin-import`, `typescript-eslint`).
- **HTML/CSS architecture controls**:
  - Component naming convention in CSS (`cv-` block/element/modifier naming style).
  - Dedicated control component for external actions: `cv-control-rail` (`aside > ul > li > button`).
  - HTML static validation with `html-validate`.
  - CSS standards validation with `stylelint`.
- **TypeScript quality controls**:
  - ESLint TS rules: no shadow/redeclare, no implicit unused symbols, consistent type imports, controlled `@ts-ignore`, and `any` forbidden as an error (`@typescript-eslint/no-explicit-any`).
  - `tsconfig` strict checks: `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`.
  - Team pattern for uncertain types: use `unknown` plus explicit type guards instead of `any`.
- **Architecture enforcement**: `dependency-cruiser` for layered dependency rules.
- **Cycle detection**: `madge` for circular dependency reporting.
- **Local runtime policy**: Portable local Node.js inside the project at `.tools/node` (no dependency on system-global Node for project commands).
- **Portable scripts**:
  - `scripts/setup-local-node.ps1` installs local Node runtime.
  - `scripts/npm-local.ps1` executes npm using local Node only.

Operational commands (local Node recommended):

- `.\scripts\npm-local.ps1 run build`
- `.\scripts\npm-local.ps1 run vendor:sync`
- `.\scripts\npm-local.ps1 run typecheck`
- `.\scripts\npm-local.ps1 run lint`
- `.\scripts\npm-local.ps1 run lint:html`
- `.\scripts\npm-local.ps1 run lint:css`
- `.\scripts\npm-local.ps1 run arch:check`
- `.\scripts\npm-local.ps1 run arch:cycles`
- `.\scripts\npm-local.ps1 run quality:check`

- **Presentation layer (`ui/`)**: Alpine components (`x-data`, `x-model`, `x-on`) render and collect user input. No direct IndexedDB access from templates or view helpers.
- **Application state layer (`state/`)**: Alpine stores hold reactive state and expose actions (`loadCv`, `updateSection`, `saveCv`).
- **Domain layer (`domain/`)**: Pure business rules, validation, and transformation logic. No browser APIs, no persistence calls.
- **Data layer (`data/`)**: Dexie adapters/repositories encapsulate IndexedDB operations and schema details.
- **Bootstrap/composition (`app/`)**: Wires dependencies once at startup and injects repository instances into state actions.

Dependency direction is strictly one-way:

`ui -> state -> domain -> data`

This prevents circular dependencies and keeps modules replaceable and testable.

## 2) Adverse JavaScript Phenomena to Avoid

The architecture is intentionally designed to reduce common JavaScript failure modes:

- **Callback hell**: Avoid nested callbacks by standardizing on `async/await` in asynchronous flows.
- **Hoisting confusion**: Avoid relying on hoisting behavior for function/variable access order.
- **Temporal Dead Zone (TDZ)**: Prevent access-before-initialization errors by using `const`/`let` with clear declaration order.
- **Circular dependencies**: Enforce one-way module imports and shared contracts in neutral modules.
- **Race conditions in async persistence**: Prevent stale writes by centralizing save actions and using per-entity save queues or version checks.
- **State desynchronization**: Separate transient UI state from persisted state and synchronize through explicit actions.

## 3) Development Best Practices

The codebase must prioritize maintainability and simplicity:

- **SOLID**
  - Single Responsibility: one reason to change per module.
  - Open/Closed: extend behavior via new modules instead of modifying stable core flows.
  - Liskov Substitution: keep repository contracts consistent across implementations.
  - Interface Segregation: use narrow interfaces per feature area.
  - Dependency Inversion: high-level state/actions depend on abstractions, not concrete Dexie implementations.
- **YAGNI**: implement only current requirements; postpone abstractions until real duplication or volatility appears.
- **DRY**: centralize shared validation, mapping, and serialization utilities.
- **KISS**: prefer small functions, explicit data flow, and clear module boundaries over clever patterns.
- **Error handling**: use predictable error boundaries in state actions and return normalized error objects.
- **Testing strategy**:
  - Unit tests for domain rules and validators.
  - Integration tests for repository behavior against IndexedDB.
  - UI behavior tests for critical Alpine interactions.
- **Code conventions**:
  - Prefer `const` by default, `let` only when reassignment is required.
  - Keep side effects at boundaries (`state` and `data` layers).
  - Avoid global mutable state outside controlled stores.
  - Keep strict import direction and fail CI/checks on architecture violations.
