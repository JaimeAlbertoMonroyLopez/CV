interface CvDomainDocumentMapperApi {
  parseRangeValue: (root: HTMLElement, cssVarName: string, fallback: number) => number;
  applyRangeValue: (root: HTMLElement, cssVarName: string, value: number) => void;
  applyThemeValue: (root: HTMLElement, theme: ThemeMode) => void;
  applyLocaleValue: (root: HTMLElement, locale: LocaleCode) => void;
  buildDocumentFromDom: (root: HTMLElement) => CvDocumentV1;
  readHydrationModel: (document: CvDocumentV1) => CvHydrationModel;
  parseStoredDocument: (raw: string) => CvDocumentV1 | null;
}

const DOMAIN_DOC_PRIMARY_ID = "primary-cv-document";
const DOMAIN_DOC_SCHEMA_VERSION = 1 as const;
const DOMAIN_SELECTOR_RANGE_VAR = 'input[type="range"][data-cv-css-var]';
const DOMAIN_SELECTOR_LANGUAGE_OPTIONS = "[data-cv-language-option]";
const DOMAIN_SELECTOR_THEME_OPTIONS = "[data-cv-theme-option]";

function mapperClamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function mapperMakeSectionId(seed: number): string {
  return `left-section-${Date.now().toString(36)}-${seed.toString(36)}`;
}

function parseRangeValue(root: HTMLElement, cssVarName: string, fallback: number): number {
  const control = root.querySelector<HTMLInputElement>(`${DOMAIN_SELECTOR_RANGE_VAR}[data-cv-css-var="${cssVarName}"]`);
  if (!control) return fallback;
  const raw = Number(control.value);
  if (!Number.isFinite(raw)) return fallback;
  return raw;
}

function applyRangeValue(root: HTMLElement, cssVarName: string, value: number): void {
  const control = root.querySelector<HTMLInputElement>(`${DOMAIN_SELECTOR_RANGE_VAR}[data-cv-css-var="${cssVarName}"]`);
  if (!control) return;
  control.value = String(value);
  control.dispatchEvent(new Event("input", { bubbles: true }));
}

function applyThemeValue(root: HTMLElement, theme: ThemeMode): void {
  const btn = root.querySelector<HTMLButtonElement>(`${DOMAIN_SELECTOR_THEME_OPTIONS}[data-cv-theme-option="${theme}"]`);
  if (!btn) return;
  btn.click();
}

function applyLocaleValue(root: HTMLElement, locale: LocaleCode): void {
  const btn = root.querySelector<HTMLButtonElement>(`${DOMAIN_SELECTOR_LANGUAGE_OPTIONS}[data-cv-language-option="${locale}"]`);
  if (!btn) return;
  btn.click();
}

function buildDocumentFromDom(root: HTMLElement): CvDocumentV1 {
  const timestamp = new Date().toISOString();
  const leftSections = normalizePersistedLeftSections(parseLeftSectionsFromDataset(root.dataset.cvLeftSectionsModel));
  const locale = getLocalizationModule().parseLocaleCode(root.dataset.cvLocale);
  const theme = getThemesModule().parseThemeMode(root.dataset.cvTheme);
  const leftSidebarWidth = parseRangeValue(root, "--cv-sidebar-left", 30);
  const rightSidebarWidth = parseRangeValue(root, "--cv-sidebar-right", 30);
  const sections = createSectionSkeletons(DOMAIN_DOC_PRIMARY_ID);
  const leftSection = sections.find((section) => section.key === "sec_1_leftSidebarContent");
  if (leftSection) {
    leftSection.nodes = leftSections.map((section, idx) => ({
      id: section.id,
      type: "left-sidebar-entry",
      order: idx + 1,
      payload: {
        title: section.title,
        content: section.content,
        side: section.side,
      },
    }));
  }
  const toolbarSection = sections.find((section) => section.key === "sec_8_topToolbar");
  if (toolbarSection) {
    toolbarSection.nodes = [
      { id: "node-toolbar-left-width", type: "slider", order: 1, payload: { cssVar: "--cv-sidebar-left", value: leftSidebarWidth } },
      { id: "node-toolbar-right-width", type: "slider", order: 2, payload: { cssVar: "--cv-sidebar-right", value: rightSidebarWidth } },
      { id: "node-toolbar-theme", type: "theme", order: 3, payload: { value: theme } },
      { id: "node-toolbar-locale", type: "locale", order: 4, payload: { value: locale } },
    ];
  }

  return {
    documentId: DOMAIN_DOC_PRIMARY_ID,
    schemaVersion: DOMAIN_DOC_SCHEMA_VERSION,
    updatedAt: timestamp,
    meta: {
      documentId: DOMAIN_DOC_PRIMARY_ID,
      schemaVersion: DOMAIN_DOC_SCHEMA_VERSION,
      locale,
      theme,
      leftSidebarWidth,
      rightSidebarWidth,
      updatedAt: timestamp,
    },
    sections,
  };
}

function readHydrationModel(document: CvDocumentV1): CvHydrationModel {
  const leftSection = document.sections.find((section) => section.key === "sec_1_leftSidebarContent");
  const leftSections: CvSectionModel[] = [];
  if (leftSection) {
    leftSection.nodes
      .sort((a, b) => a.order - b.order)
      .forEach((node, idx) => {
        const title = typeof node.payload.title === "string" ? node.payload.title : "";
        const content = typeof node.payload.content === "string" ? node.payload.content : "";
        if (!title) return;
        leftSections.push({
          id: node.id || mapperMakeSectionId(idx + 1),
          title,
          content,
          order: leftSections.length,
          side: "left",
        });
      });
  }

  return {
    locale: getLocalizationModule().parseLocaleCode(document.meta.locale),
    theme: getThemesModule().parseThemeMode(document.meta.theme),
    leftSidebarWidth: mapperClamp(document.meta.leftSidebarWidth, 22, 45),
    rightSidebarWidth: mapperClamp(document.meta.rightSidebarWidth, 22, 45),
    leftSections,
  };
}

function parseStoredDocument(raw: string): CvDocumentV1 | null {
  const parsed = safeJsonParse(raw);
  if (!isObjectRecord(parsed)) return null;
  const docId = parsed.documentId;
  const schemaVersion = parsed.schemaVersion;
  const updatedAt = parsed.updatedAt;
  const meta = parsed.meta;
  const sections = parsed.sections;
  if (docId !== DOMAIN_DOC_PRIMARY_ID || schemaVersion !== DOMAIN_DOC_SCHEMA_VERSION || typeof updatedAt !== "string") {
    return null;
  }
  if (!isObjectRecord(meta) || !Array.isArray(sections)) return null;
  const locale = getLocalizationModule().parseLocaleCode(typeof meta.locale === "string" ? meta.locale : null);
  const theme = getThemesModule().parseThemeMode(typeof meta.theme === "string" ? meta.theme : null);
  const leftSidebarWidth = typeof meta.leftSidebarWidth === "number" ? meta.leftSidebarWidth : 30;
  const rightSidebarWidth = typeof meta.rightSidebarWidth === "number" ? meta.rightSidebarWidth : 30;
  const normalizedDocument: CvDocumentV1 = {
    documentId: DOMAIN_DOC_PRIMARY_ID,
    schemaVersion: DOMAIN_DOC_SCHEMA_VERSION,
    updatedAt,
    meta: {
      documentId: DOMAIN_DOC_PRIMARY_ID,
      schemaVersion: DOMAIN_DOC_SCHEMA_VERSION,
      locale,
      theme,
      leftSidebarWidth,
      rightSidebarWidth,
      updatedAt,
    },
    sections: createSectionSkeletons(DOMAIN_DOC_PRIMARY_ID),
  };
  const normalizedSections = normalizedDocument.sections;
  const persistedSections = sections.filter((section): section is Record<string, unknown> => isObjectRecord(section));
  const leftPersisted = persistedSections.find((section) => section.key === "sec_1_leftSidebarContent");
  const toolbarPersisted = persistedSections.find((section) => section.key === "sec_8_topToolbar");
  const leftTarget = normalizedSections.find((section) => section.key === "sec_1_leftSidebarContent");
  if (leftTarget && leftPersisted && Array.isArray(leftPersisted.nodes)) {
    leftTarget.nodes = leftPersisted.nodes
      .filter((node): node is Record<string, unknown> => isObjectRecord(node))
      .map((node, idx) => ({
        id: typeof node.id === "string" ? node.id : mapperMakeSectionId(idx + 1),
        type: typeof node.type === "string" ? node.type : "left-sidebar-entry",
        order: typeof node.order === "number" ? node.order : idx + 1,
        payload: isObjectRecord(node.payload)
          ? Object.entries(node.payload).reduce<CvNodePayload>((acc, [key, value]) => {
              if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
                acc[key] = value;
              }
              return acc;
            }, {})
          : {},
      }));
  }
  const toolbarTarget = normalizedSections.find((section) => section.key === "sec_8_topToolbar");
  if (toolbarTarget && toolbarPersisted && Array.isArray(toolbarPersisted.nodes)) {
    toolbarTarget.nodes = toolbarPersisted.nodes
      .filter((node): node is Record<string, unknown> => isObjectRecord(node))
      .map((node, idx) => ({
        id: typeof node.id === "string" ? node.id : `node-toolbar-${idx + 1}`,
        type: typeof node.type === "string" ? node.type : "meta",
        order: typeof node.order === "number" ? node.order : idx + 1,
        payload: isObjectRecord(node.payload)
          ? Object.entries(node.payload).reduce<CvNodePayload>((acc, [key, value]) => {
              if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
                acc[key] = value;
              }
              return acc;
            }, {})
          : {},
      }));
  }
  normalizedDocument.sections = normalizedSections;
  return normalizedDocument;
}

(window as unknown as { CvDomainDocumentMapper?: CvDomainDocumentMapperApi }).CvDomainDocumentMapper = {
  parseRangeValue,
  applyRangeValue,
  applyThemeValue,
  applyLocaleValue,
  buildDocumentFromDom,
  readHydrationModel,
  parseStoredDocument,
};
