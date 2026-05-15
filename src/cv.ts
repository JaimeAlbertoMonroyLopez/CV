/**
 * CV shell - independent widths (--cv-sidebar-left, --cv-sidebar-right).
 *
 * HTML contract (no inline handlers):
 * - Root: [data-cv-app]
 * - Controls: input[type="range"][data-cv-css-var="<css-custom-prop>"]
 *   Example: data-cv-css-var="--cv-sidebar-left"
 * - Optional: data-cv-auto-init="false" on root to skip listener registration
 *
 * CSS vars are written as percentages on the root node style.
 *
 * Explicit invocation:
 *   CvApp.mount(document.querySelector("[data-cv-app]"));
 *   CvApp.mountAll();
 */

const SELECTOR_ROOT = "[data-cv-app]";
const ATTR_AUTO = "data-cv-auto-init";

const mounted = new WeakMap<Element, MountedRecord>();

function mount(rootEl: Element | null): boolean {
  if (!(rootEl instanceof HTMLElement)) return false;

  teardown(rootEl);

  const persistence = new CvRealtimePersistence(rootEl);
  const hydrationPromise = persistence.loadHydrationModel();
  const disposers = getAppShellMountModule().bindShell(rootEl, persistence, hydrationPromise);

  if (disposers.length === 0) {
    persistence.dispose();
    return false;
  }

  const disposeAll = (): void => {
    disposers.forEach((fn) => fn());
    disposers.length = 0;
    persistence.dispose();
  };

  mounted.set(rootEl, { root: rootEl, disposer: disposeAll });
  rootEl.dataset.cvShellMounted = "true";
  return true;
}

function teardown(rootEl: HTMLElement): void {
  getAppShellMountModule().teardownShell(rootEl, mounted);
}

function mountAll(): void {
  getAppShellMountModule().mountAllShell(mount, SELECTOR_ROOT, ATTR_AUTO);
}

getAppBootstrapModule().attachCvApp({ mount, mountAll, teardown });
