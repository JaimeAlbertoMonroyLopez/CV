interface MountedRecord {
  root: HTMLElement;
  disposer: () => void;
}

interface CvAppApi {
  mount: (rootEl: Element | null) => boolean;
  mountAll: () => void;
  teardown: (rootEl: HTMLElement) => void;
}

type LocaleCode = "en-US" | "es-ES" | "de-DE" | "fr-FR";
type SectionSide = "left";
type ThemeMode = "light" | "medium" | "dark";

interface CvSectionModel {
  id: string;
  title: string;
  content: string;
  order: number;
  side: SectionSide;
}

type CvSectionKey =
  | "sec_1_leftSidebarContent"
  | "sec_2_headerProfile"
  | "sec_3_workExperience"
  | "sec_4_rightSidebarContent"
  | "sec_5_pageShell"
  | "sec_6_leftControlRail"
  | "sec_7_rightControlRail"
  | "sec_8_topToolbar";
type CvSectionKind = "content" | "container" | "control" | "toolbar";
type CvNodePayloadValue = string | number | boolean | null;
type CvNodePayload = Record<string, CvNodePayloadValue>;

interface CvSectionNode {
  id: string;
  type: string;
  order: number;
  payload: CvNodePayload;
}

interface CvMappedSection {
  id: string;
  key: CvSectionKey;
  kind: CvSectionKind;
  order: number;
  parentId: string | null;
  visible: boolean;
  nodes: CvSectionNode[];
}

interface CvDocumentMetaV1 {
  documentId: string;
  schemaVersion: 1;
  locale: LocaleCode;
  theme: ThemeMode;
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  updatedAt: string;
}

interface CvDocumentV1 {
  documentId: string;
  schemaVersion: 1;
  updatedAt: string;
  meta: CvDocumentMetaV1;
  sections: CvMappedSection[];
}

interface CvHydrationModel {
  locale: LocaleCode;
  theme: ThemeMode;
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  leftSections: CvSectionModel[];
}

type _CvTypesKeepAlive =
  | MountedRecord
  | CvAppApi
  | LocaleCode
  | SectionSide
  | ThemeMode
  | CvSectionModel
  | CvSectionKey
  | CvSectionKind
  | CvNodePayloadValue
  | CvNodePayload
  | CvSectionNode
  | CvMappedSection
  | CvDocumentMetaV1
  | CvDocumentV1
  | CvHydrationModel;
const _cvTypesKeepAlive: _CvTypesKeepAlive | null = null;
