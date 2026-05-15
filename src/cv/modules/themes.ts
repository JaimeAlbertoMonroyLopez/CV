interface CvModulesThemesApi {
  parseThemeMode: (theme: string | null | undefined) => ThemeMode;
  bindThemeSelector: (root: HTMLElement, onMutation?: () => void) => (() => void) | null;
}

const THEMES_SELECTOR_THEME_OPTIONS = "[data-cv-theme-option]";
const THEMES_SELECTOR_ROOT = '[data-cv-module="themes"]';

function parseThemeMode(theme: string | null | undefined): ThemeMode {
  if (theme === "medium" || theme === "dark" || theme === "light") {
    return theme;
  }
  return "dark";
}

function bindThemeSelector(root: HTMLElement, onMutation?: () => void): (() => void) | null {
  const moduleRoot = root.querySelector<HTMLElement>(THEMES_SELECTOR_ROOT);
  const host = moduleRoot ?? root;
  const themeButtons = Array.from(host.querySelectorAll<HTMLButtonElement>(THEMES_SELECTOR_THEME_OPTIONS));
  if (themeButtons.length === 0) return null;

  const applyTheme = (theme: ThemeMode): void => {
    root.dataset.cvTheme = theme;
    document.body.dataset.cvTheme = theme;
    themeButtons.forEach((btn) => {
      const isActive = parseThemeMode(btn.dataset.cvThemeOption) === theme;
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    onMutation?.();
  };

  const onThemeButtonClick = (event: MouseEvent): void => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLButtonElement)) return;
    applyTheme(parseThemeMode(target.dataset.cvThemeOption));
  };

  themeButtons.forEach((btn) => btn.addEventListener("click", onThemeButtonClick));
  applyTheme(parseThemeMode(root.dataset.cvTheme));

  return function disposer(): void {
    themeButtons.forEach((btn) => btn.removeEventListener("click", onThemeButtonClick));
  };
}

(window as unknown as { CvModulesThemes?: CvModulesThemesApi }).CvModulesThemes = {
  parseThemeMode,
  bindThemeSelector,
};
