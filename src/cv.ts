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

interface MountedRecord {
  root: HTMLElement;
  disposer: () => void;
}

interface CvAppApi {
  mount: (rootEl: Element | null) => boolean;
  mountAll: () => void;
  teardown: (rootEl: HTMLElement) => void;
}

interface CvGlobal extends Window {
  CvApp?: CvAppApi;
}

const SELECTOR_ROOT = "[data-cv-app]";
const SELECTOR_RANGE_VAR = 'input[type="range"][data-cv-css-var]';
const ATTR_AUTO = "data-cv-auto-init";
const SELECTOR_LEFT_ADD_TRIGGER = '[data-cv-control="left-add-trigger"]';
const SELECTOR_FLOATING_NOTE = "[data-cv-floating-note]";
const SELECTOR_FLOATING_NOTE_CLOSE = "[data-cv-floating-note-close]";
const SELECTOR_FLOATING_NOTE_DRAG = "[data-cv-floating-note-drag]";
const SELECTOR_FLOATING_NOTE_INPUT = "[data-cv-floating-note-input]";
const SELECTOR_FLOATING_NOTE_ADD = "[data-cv-floating-note-add]";
const SELECTOR_LEFT_SECTIONS = "[data-cv-left-sections]";
const SELECTOR_LANGUAGE_SWITCH = "[data-cv-lang-switch]";
const SELECTOR_LANGUAGE_TRIGGER = "[data-cv-language-trigger]";
const SELECTOR_LANGUAGE_MENU = "[data-cv-language-menu]";
const SELECTOR_LANGUAGE_OPTIONS = "[data-cv-language-option]";
const SELECTOR_LANGUAGE_CURRENT_LABEL = "[data-cv-language-current-label]";
const SELECTOR_LANGUAGE_CURRENT_FLAG = "[data-cv-language-current-flag]";
const SELECTOR_THEME_OPTIONS = "[data-cv-theme-option]";
const SELECTOR_I18N_LEFT_WIDTH = '[data-cv-i18n="label-left-width"]';
const SELECTOR_I18N_RIGHT_WIDTH = '[data-cv-i18n="label-right-width"]';
const SELECTOR_I18N_WRITE_HERE = '[data-cv-i18n-placeholder="write-here"]';
const SELECTOR_I18N_ADD_SECTIONS = '[data-cv-i18n="add-sections"]';
const SELECTOR_I18N_THEME_LIGHT = '[data-cv-i18n="theme-light"]';
const SELECTOR_I18N_THEME_MEDIUM = '[data-cv-i18n="theme-medium"]';
const SELECTOR_I18N_THEME_DARK = '[data-cv-i18n="theme-dark"]';

type LocaleCode = "en-US" | "es-ES" | "de-DE" | "fr-FR";
type SectionSide = "left";
type ThemeMode = "light" | "medium" | "dark";

interface LocaleTextBundle {
  leftWidthLabel: string;
  rightWidthLabel: string;
  writeHerePlaceholder: string;
  addSectionsLabel: string;
  themeLightLabel: string;
  themeMediumLabel: string;
  themeDarkLabel: string;
  htmlLang: string;
  triggerLabel: string;
  flagClassName: string;
}

interface CvSectionModel {
  id: string;
  title: string;
  content: string;
  order: number;
  side: SectionSide;
}

const LOCALE_TEXTS: Record<LocaleCode, LocaleTextBundle> = {
  "en-US": {
    leftWidthLabel: "Left gray zone width",
    rightWidthLabel: "Right gray zone width",
    writeHerePlaceholder: "Write here...",
    addSectionsLabel: "Add Sections",
    themeLightLabel: "Light",
    themeMediumLabel: "Medium",
    themeDarkLabel: "Dark",
    htmlLang: "en",
    triggerLabel: "EN (US)",
    flagClassName: "cv-flag--us",
  },
  "es-ES": {
    leftWidthLabel: "Ancho zona gris izquierda",
    rightWidthLabel: "Ancho zona gris derecha",
    writeHerePlaceholder: "Escribe aqui...",
    addSectionsLabel: "Agregar secciones",
    themeLightLabel: "Claro",
    themeMediumLabel: "Medio",
    themeDarkLabel: "Oscuro",
    htmlLang: "es",
    triggerLabel: "ESP",
    flagClassName: "cv-flag--es",
  },
  "de-DE": {
    leftWidthLabel: "Breite der linken Grauzone",
    rightWidthLabel: "Breite der rechten Grauzone",
    writeHerePlaceholder: "Hier schreiben...",
    addSectionsLabel: "Abschnitte hinzufugen",
    themeLightLabel: "Hell",
    themeMediumLabel: "Mittel",
    themeDarkLabel: "Dunkel",
    htmlLang: "de",
    triggerLabel: "GER",
    flagClassName: "cv-flag--de",
  },
  "fr-FR": {
    leftWidthLabel: "Largeur de la zone grise gauche",
    rightWidthLabel: "Largeur de la zone grise droite",
    writeHerePlaceholder: "Ecrire ici...",
    addSectionsLabel: "Ajouter des sections",
    themeLightLabel: "Clair",
    themeMediumLabel: "Moyen",
    themeDarkLabel: "Sombre",
    htmlLang: "fr",
    triggerLabel: "FR",
    flagClassName: "cv-flag--fr",
  },
};

const mounted = new WeakMap<Element, MountedRecord>();

function isCssCustomProp(name: string | null | undefined): name is string {
  return typeof name === "string" && /^--[\w-]+$/.test(name);
}

function percentFromControl(control: HTMLInputElement): string {
  let raw = Number(control.value);
  if (!Number.isFinite(raw)) {
    raw = Number(control.getAttribute("value")) || 30;
  }
  const min = Number(control.min) || 0;
  const max = Number(control.max) || 100;
  raw = Math.min(Math.max(raw, min), max);
  return `${raw}%`;
}

function bindRangeToVar(root: HTMLElement, control: HTMLInputElement): (() => void) | null {
  const prop = control.getAttribute("data-cv-css-var");
  if (!isCssCustomProp(prop)) return null;

  const apply = (): void => {
    root.style.setProperty(prop, percentFromControl(control));
  };

  apply();
  control.addEventListener("input", apply);

  return function disposer(): void {
    control.removeEventListener("input", apply);
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function makeSectionId(side: SectionSide, seed: number): string {
  const nowPart = Date.now().toString(36);
  const seedPart = seed.toString(36);
  return `${side}-section-${nowPart}-${seedPart}`;
}

function autoResizeTextarea(textarea: HTMLTextAreaElement): void {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.max(72, textarea.scrollHeight)}px`;
}

function parseLocaleCode(locale: string | null | undefined): LocaleCode {
  if (locale === "es-ES" || locale === "de-DE" || locale === "fr-FR" || locale === "en-US") {
    return locale;
  }
  return "en-US";
}

function parseThemeMode(theme: string | null | undefined): ThemeMode {
  if (theme === "medium" || theme === "dark" || theme === "light") {
    return theme;
  }
  return "dark";
}

function bindThemeSelector(root: HTMLElement): (() => void) | null {
  const themeButtons = Array.from(root.querySelectorAll<HTMLButtonElement>(SELECTOR_THEME_OPTIONS));
  if (themeButtons.length === 0) return null;

  const applyTheme = (theme: ThemeMode): void => {
    root.dataset.cvTheme = theme;
    document.body.dataset.cvTheme = theme;
    themeButtons.forEach((btn) => {
      const isActive = parseThemeMode(btn.dataset.cvThemeOption) === theme;
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
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

function bindLanguageSelector(root: HTMLElement): (() => void) | null {
  const switchRoot = root.querySelector<HTMLElement>(SELECTOR_LANGUAGE_SWITCH);
  const trigger = root.querySelector<HTMLButtonElement>(SELECTOR_LANGUAGE_TRIGGER);
  const menu = root.querySelector<HTMLElement>(SELECTOR_LANGUAGE_MENU);
  if (!switchRoot || !trigger || !menu) return null;

  const optionButtons = Array.from(root.querySelectorAll<HTMLButtonElement>(SELECTOR_LANGUAGE_OPTIONS));
  const triggerLabel = root.querySelector<HTMLElement>(SELECTOR_LANGUAGE_CURRENT_LABEL);
  const triggerFlag = root.querySelector<HTMLElement>(SELECTOR_LANGUAGE_CURRENT_FLAG);
  if (optionButtons.length === 0 || !triggerLabel || !triggerFlag) return null;

  const leftWidthLabel = root.querySelector<HTMLElement>(SELECTOR_I18N_LEFT_WIDTH);
  const rightWidthLabel = root.querySelector<HTMLElement>(SELECTOR_I18N_RIGHT_WIDTH);
  const writeHereInput = root.querySelector<HTMLTextAreaElement>(SELECTOR_I18N_WRITE_HERE);
  const addSectionsLabel = root.querySelector<HTMLElement>(SELECTOR_I18N_ADD_SECTIONS);
  const themeLightLabel = root.querySelector<HTMLElement>(SELECTOR_I18N_THEME_LIGHT);
  const themeMediumLabel = root.querySelector<HTMLElement>(SELECTOR_I18N_THEME_MEDIUM);
  const themeDarkLabel = root.querySelector<HTMLElement>(SELECTOR_I18N_THEME_DARK);
  let currentLocale: LocaleCode = "en-US";

  const hideMenu = (): void => {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  };

  const showMenu = (): void => {
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
  };

  const applyLocale = (locale: LocaleCode): void => {
    const text = LOCALE_TEXTS[locale];
    currentLocale = locale;
    if (leftWidthLabel) {
      leftWidthLabel.textContent = text.leftWidthLabel;
    }
    if (rightWidthLabel) {
      rightWidthLabel.textContent = text.rightWidthLabel;
    }
    if (writeHereInput) {
      writeHereInput.placeholder = text.writeHerePlaceholder;
    }
    if (addSectionsLabel) {
      addSectionsLabel.textContent = text.addSectionsLabel;
    }
    if (themeLightLabel) {
      themeLightLabel.textContent = text.themeLightLabel;
    }
    if (themeMediumLabel) {
      themeMediumLabel.textContent = text.themeMediumLabel;
    }
    if (themeDarkLabel) {
      themeDarkLabel.textContent = text.themeDarkLabel;
    }
    triggerLabel.textContent = text.triggerLabel;
    triggerFlag.className = `cv-lang-switch__flag cv-flag ${text.flagClassName}`;
    document.documentElement.lang = text.htmlLang;
  };

  const onTriggerClick = (): void => {
    if (menu.hidden) {
      showMenu();
      return;
    }
    hideMenu();
  };

  const onOptionClick = (event: MouseEvent): void => {
    const option = event.currentTarget;
    if (!(option instanceof HTMLButtonElement)) return;
    const locale = parseLocaleCode(option.dataset.cvLanguageOption);
    applyLocale(locale);
    hideMenu();
  };

  const onDocumentClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (switchRoot.contains(target)) return;
    hideMenu();
  };

  const onTriggerKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      hideMenu();
      trigger.focus();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (menu.hidden) {
        showMenu();
      } else {
        hideMenu();
      }
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      showMenu();
      optionButtons[0]?.focus();
    }
  };

  const onMenuKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      hideMenu();
      trigger.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const currentIdx = optionButtons.findIndex((btn) => btn === document.activeElement);
    if (currentIdx < 0) return;
    const delta = event.key === "ArrowDown" ? 1 : -1;
    const nextIdx = (currentIdx + delta + optionButtons.length) % optionButtons.length;
    optionButtons[nextIdx]?.focus();
  };

  const initialOption = optionButtons.find((btn) => parseLocaleCode(btn.dataset.cvLanguageOption) === currentLocale);
  if (initialOption) {
    currentLocale = parseLocaleCode(initialOption.dataset.cvLanguageOption);
  }
  applyLocale(currentLocale);
  hideMenu();

  trigger.addEventListener("click", onTriggerClick);
  trigger.addEventListener("keydown", onTriggerKeyDown);
  menu.addEventListener("keydown", onMenuKeyDown);
  optionButtons.forEach((btn) => btn.addEventListener("click", onOptionClick));
  document.addEventListener("click", onDocumentClick);

  return function disposer(): void {
    trigger.removeEventListener("click", onTriggerClick);
    trigger.removeEventListener("keydown", onTriggerKeyDown);
    menu.removeEventListener("keydown", onMenuKeyDown);
    optionButtons.forEach((btn) => btn.removeEventListener("click", onOptionClick));
    document.removeEventListener("click", onDocumentClick);
  };
}

function bindFloatingNotePanel(root: HTMLElement): (() => void) | null {
  const trigger = root.querySelector<HTMLButtonElement>(SELECTOR_LEFT_ADD_TRIGGER);
  const panel = root.querySelector<HTMLElement>(SELECTOR_FLOATING_NOTE);
  if (!trigger || !panel) return null;

  const closeBtn = panel.querySelector<HTMLButtonElement>(SELECTOR_FLOATING_NOTE_CLOSE);
  const dragBtn = panel.querySelector<HTMLButtonElement>(SELECTOR_FLOATING_NOTE_DRAG);
  const noteInput = panel.querySelector<HTMLTextAreaElement>(SELECTOR_FLOATING_NOTE_INPUT);
  if (!closeBtn || !dragBtn || !noteInput) return null;

  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let isDragging = false;

  const applyPanelPosition = (left: number, top: number): void => {
    const panelWidth = panel.offsetWidth || 280;
    const panelHeight = panel.offsetHeight || 140;
    const maxLeft = window.innerWidth - panelWidth - 8;
    const maxTop = window.innerHeight - panelHeight - 8;
    panel.style.left = `${clamp(left, 8, Math.max(8, maxLeft))}px`;
    panel.style.top = `${clamp(top, 8, Math.max(8, maxTop))}px`;
  };

  const showPanel = (): void => {
    panel.hidden = false;
    const triggerRect = trigger.getBoundingClientRect();
    const desiredLeft = triggerRect.right + 14;
    const desiredTop = triggerRect.top - 6;
    applyPanelPosition(desiredLeft, desiredTop);
    noteInput.focus();
  };

  const hidePanel = (): void => {
    panel.hidden = true;
    isDragging = false;
  };

  const onTriggerClick = (event: MouseEvent): void => {
    event.preventDefault();
    showPanel();
  };

  const onCloseClick = (event: MouseEvent): void => {
    event.preventDefault();
    hidePanel();
  };

  const onDragStart = (event: PointerEvent): void => {
    event.preventDefault();
    if (panel.hidden) {
      showPanel();
    }
    const rect = panel.getBoundingClientRect();
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
    isDragging = true;
    dragBtn.setPointerCapture(event.pointerId);
  };

  const onDragMove = (event: PointerEvent): void => {
    if (!isDragging) return;
    applyPanelPosition(event.clientX - dragOffsetX, event.clientY - dragOffsetY);
  };

  const onDragEnd = (event: PointerEvent): void => {
    if (!isDragging) return;
    isDragging = false;
    if (dragBtn.hasPointerCapture(event.pointerId)) {
      dragBtn.releasePointerCapture(event.pointerId);
    }
  };

  const onWindowResize = (): void => {
    if (panel.hidden) return;
    const rect = panel.getBoundingClientRect();
    applyPanelPosition(rect.left, rect.top);
  };

  trigger.addEventListener("click", onTriggerClick);
  closeBtn.addEventListener("click", onCloseClick);
  dragBtn.addEventListener("pointerdown", onDragStart);
  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd);
  window.addEventListener("pointercancel", onDragEnd);
  window.addEventListener("resize", onWindowResize);

  return function disposer(): void {
    trigger.removeEventListener("click", onTriggerClick);
    closeBtn.removeEventListener("click", onCloseClick);
    dragBtn.removeEventListener("pointerdown", onDragStart);
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragEnd);
    window.removeEventListener("pointercancel", onDragEnd);
    window.removeEventListener("resize", onWindowResize);
  };
}

function bindLeftSectionComposer(root: HTMLElement): (() => void) | null {
  const sectionsHost = root.querySelector<HTMLElement>(SELECTOR_LEFT_SECTIONS);
  const noteInput = root.querySelector<HTMLTextAreaElement>(SELECTOR_FLOATING_NOTE_INPUT);
  const addBtn = root.querySelector<HTMLButtonElement>(SELECTOR_FLOATING_NOTE_ADD);
  if (!sectionsHost || !noteInput || !addBtn) return null;

  const sections: CvSectionModel[] = [];
  const sectionTextDisposers: Array<() => void> = [];
  let sectionSeed = 0;

  const syncDraftSnapshot = (): void => {
    root.dataset.cvLeftSectionsModel = JSON.stringify(
      sections.map((section) => ({
        id: section.id,
        title: section.title,
        content: section.content,
        order: section.order,
        side: section.side,
      })),
    );
  };

  const createSection = (title: string): CvSectionModel => {
    sectionSeed += 1;
    return {
      id: makeSectionId("left", sectionSeed),
      title,
      content: "",
      order: sections.length,
      side: "left",
    };
  };

  const bindSectionText = (section: CvSectionModel, textarea: HTMLTextAreaElement): void => {
    const onInput = (): void => {
      section.content = textarea.value;
      autoResizeTextarea(textarea);
      syncDraftSnapshot();
    };
    textarea.addEventListener("input", onInput);
    autoResizeTextarea(textarea);
    sectionTextDisposers.push(() => textarea.removeEventListener("input", onInput));
  };

  const renderSection = (section: CvSectionModel): void => {
    const wrapper = document.createElement("div");
    wrapper.className = "cv-sidebar__section";
    wrapper.dataset.cvSectionId = section.id;
    wrapper.dataset.cvSectionSide = section.side;
    wrapper.dataset.cvSectionOrder = String(section.order);

    const title = document.createElement("h3");
    title.className = "cv-pill";
    title.textContent = section.title;

    const text = document.createElement("textarea");
    text.className = "cv-sidebar__section-text";
    text.rows = 4;
    text.value = section.content;
    text.setAttribute("aria-label", `${section.title} content`);

    wrapper.append(title, text);
    sectionsHost.appendChild(wrapper);
    bindSectionText(section, text);
  };

  const appendSectionsByTitles = (titles: string[]): void => {
    titles.forEach((titleRaw) => {
      const title = titleRaw.trim();
      if (!title) return;
      const section = createSection(title);
      sections.push(section);
      renderSection(section);
    });
    syncDraftSnapshot();
  };

  const normalizeCommaSeparatedTitles = (raw: string): string =>
    raw
      .replace(/\r\n/g, "\n")
      .replace(/\n+/g, ",")
      .split(",")
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0)
      .join(",");

  const parseTitlesFromInput = (normalized: string): string[] =>
    normalized
      .split(",")
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0);

  const addSectionsFromComposer = (): void => {
    const normalized = normalizeCommaSeparatedTitles(noteInput.value);
    const titles = parseTitlesFromInput(normalized);
    if (titles.length === 0) return;
    appendSectionsByTitles(titles);
    noteInput.value = "";
    noteInput.focus();
  };

  const onAddClick = (event: MouseEvent): void => {
    event.preventDefault();
    addSectionsFromComposer();
  };

  const onComposerKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    addSectionsFromComposer();
  };

  addBtn.addEventListener("click", onAddClick);
  noteInput.addEventListener("keydown", onComposerKeyDown);

  appendSectionsByTitles(["Contact Me", "Education"]);

  return function disposer(): void {
    addBtn.removeEventListener("click", onAddClick);
    noteInput.removeEventListener("keydown", onComposerKeyDown);
    sectionTextDisposers.forEach((dispose) => dispose());
    sectionTextDisposers.length = 0;
  };
}

function mount(rootEl: Element | null): boolean {
  if (!(rootEl instanceof HTMLElement)) return false;

  teardown(rootEl);

  const nodes = rootEl.querySelectorAll(SELECTOR_RANGE_VAR);
  const disposers: Array<() => void> = [];

  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (!(node instanceof HTMLInputElement)) continue;
    const d = bindRangeToVar(rootEl, node);
    if (d) disposers.push(d);
  }

  const floatingNoteDisposer = bindFloatingNotePanel(rootEl);
  if (floatingNoteDisposer) disposers.push(floatingNoteDisposer);

  const leftSectionComposerDisposer = bindLeftSectionComposer(rootEl);
  if (leftSectionComposerDisposer) disposers.push(leftSectionComposerDisposer);

  const localeDisposer = bindLanguageSelector(rootEl);
  if (localeDisposer) disposers.push(localeDisposer);

  const themeDisposer = bindThemeSelector(rootEl);
  if (themeDisposer) disposers.push(themeDisposer);

  if (disposers.length === 0) return false;

  const disposeAll = (): void => {
    disposers.forEach((fn) => fn());
    disposers.length = 0;
  };

  mounted.set(rootEl, { root: rootEl, disposer: disposeAll });
  rootEl.dataset.cvShellMounted = "true";
  return true;
}

function teardown(rootEl: HTMLElement): void {
  const rec = mounted.get(rootEl);
  if (!rec) return;
  rec.disposer();
  mounted.delete(rootEl);
  delete rootEl.dataset.cvShellMounted;
}

function mountAll(): void {
  const roots = document.querySelectorAll<HTMLElement>(SELECTOR_ROOT);
  roots.forEach((el) => {
    if (el.getAttribute(ATTR_AUTO) === "false") return;
    mount(el);
  });
}

const CvApp: CvAppApi = { mount, mountAll, teardown };

(function attachCvShell(global: CvGlobal): void {
  global.CvApp = CvApp;

  const maybeAutoMount = (): void => {
    mountAll();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", maybeAutoMount, { once: true });
  } else {
    maybeAutoMount();
  }
})(window);
