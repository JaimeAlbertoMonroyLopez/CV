interface CvModulesLocalizationApi {
  parseLocaleCode: (locale: string | null | undefined) => LocaleCode;
  bindLanguageSelector: (root: HTMLElement, onMutation?: () => void) => (() => void) | null;
}

const LOCALIZATION_SELECTOR_LANGUAGE_SWITCH = "[data-cv-lang-switch]";
const LOCALIZATION_SELECTOR_ROOT = '[data-cv-module="localization"]';
const LOCALIZATION_SELECTOR_LANGUAGE_TRIGGER = "[data-cv-language-trigger]";
const LOCALIZATION_SELECTOR_LANGUAGE_MENU = "[data-cv-language-menu]";
const LOCALIZATION_SELECTOR_LANGUAGE_OPTIONS = "[data-cv-language-option]";
const LOCALIZATION_SELECTOR_LANGUAGE_CURRENT_LABEL = "[data-cv-language-current-label]";
const LOCALIZATION_SELECTOR_LANGUAGE_CURRENT_FLAG = "[data-cv-language-current-flag]";
const LOCALIZATION_SELECTOR_I18N_LEFT_WIDTH = '[data-cv-i18n="label-left-width"]';
const LOCALIZATION_SELECTOR_I18N_RIGHT_WIDTH = '[data-cv-i18n="label-right-width"]';
const LOCALIZATION_SELECTOR_I18N_WRITE_HERE = '[data-cv-i18n-placeholder="write-here"]';
const LOCALIZATION_SELECTOR_I18N_ADD_SECTIONS = '[data-cv-i18n="add-sections"]';
const LOCALIZATION_SELECTOR_I18N_THEME_LIGHT = '[data-cv-i18n="theme-light"]';
const LOCALIZATION_SELECTOR_I18N_THEME_MEDIUM = '[data-cv-i18n="theme-medium"]';
const LOCALIZATION_SELECTOR_I18N_THEME_DARK = '[data-cv-i18n="theme-dark"]';

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

function parseLocaleCode(locale: string | null | undefined): LocaleCode {
  if (locale === "es-ES" || locale === "de-DE" || locale === "fr-FR" || locale === "en-US") {
    return locale;
  }
  return "en-US";
}

function bindLanguageSelector(root: HTMLElement, onMutation?: () => void): (() => void) | null {
  const moduleRoot = root.querySelector<HTMLElement>(LOCALIZATION_SELECTOR_ROOT);
  const host = moduleRoot ?? root;
  const switchRoot = host.matches(LOCALIZATION_SELECTOR_LANGUAGE_SWITCH)
    ? host
    : host.querySelector<HTMLElement>(LOCALIZATION_SELECTOR_LANGUAGE_SWITCH);
  const trigger = host.querySelector<HTMLButtonElement>(LOCALIZATION_SELECTOR_LANGUAGE_TRIGGER);
  const menu = host.querySelector<HTMLElement>(LOCALIZATION_SELECTOR_LANGUAGE_MENU);
  if (!switchRoot || !trigger || !menu) return null;

  const optionButtons = Array.from(host.querySelectorAll<HTMLButtonElement>(LOCALIZATION_SELECTOR_LANGUAGE_OPTIONS));
  const triggerLabel = host.querySelector<HTMLElement>(LOCALIZATION_SELECTOR_LANGUAGE_CURRENT_LABEL);
  const triggerFlag = host.querySelector<HTMLElement>(LOCALIZATION_SELECTOR_LANGUAGE_CURRENT_FLAG);
  if (optionButtons.length === 0 || !triggerLabel || !triggerFlag) return null;

  const leftWidthLabel = root.querySelector<HTMLElement>(LOCALIZATION_SELECTOR_I18N_LEFT_WIDTH);
  const rightWidthLabel = root.querySelector<HTMLElement>(LOCALIZATION_SELECTOR_I18N_RIGHT_WIDTH);
  const writeHereInput = root.querySelector<HTMLTextAreaElement>(LOCALIZATION_SELECTOR_I18N_WRITE_HERE);
  const addSectionsLabel = root.querySelector<HTMLElement>(LOCALIZATION_SELECTOR_I18N_ADD_SECTIONS);
  const themeLightLabel = root.querySelector<HTMLElement>(LOCALIZATION_SELECTOR_I18N_THEME_LIGHT);
  const themeMediumLabel = root.querySelector<HTMLElement>(LOCALIZATION_SELECTOR_I18N_THEME_MEDIUM);
  const themeDarkLabel = root.querySelector<HTMLElement>(LOCALIZATION_SELECTOR_I18N_THEME_DARK);
  let currentLocale: LocaleCode = parseLocaleCode(root.dataset.cvLocale);

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
    root.dataset.cvLocale = locale;
    onMutation?.();
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

(window as unknown as { CvModulesLocalization?: CvModulesLocalizationApi }).CvModulesLocalization = {
  parseLocaleCode,
  bindLanguageSelector,
};
