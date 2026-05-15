interface CvDomainSectionsSchemaApi {
  sectionIdForKey: (documentId: string, key: CvSectionKey) => string;
  createSectionSkeletons: (documentId: string) => CvMappedSection[];
}

function sectionIdForKey(documentId: string, key: CvSectionKey): string {
  return `${documentId}:${key}`;
}

function createSectionSkeletons(documentId: string): CvMappedSection[] {
  return [
    {
      id: sectionIdForKey(documentId, "sec_1_leftSidebarContent"),
      key: "sec_1_leftSidebarContent",
      kind: "content",
      order: 1,
      parentId: sectionIdForKey(documentId, "sec_5_pageShell"),
      visible: true,
      nodes: [],
    },
    {
      id: sectionIdForKey(documentId, "sec_2_headerProfile"),
      key: "sec_2_headerProfile",
      kind: "content",
      order: 2,
      parentId: sectionIdForKey(documentId, "sec_5_pageShell"),
      visible: true,
      nodes: [],
    },
    {
      id: sectionIdForKey(documentId, "sec_3_workExperience"),
      key: "sec_3_workExperience",
      kind: "content",
      order: 3,
      parentId: sectionIdForKey(documentId, "sec_5_pageShell"),
      visible: true,
      nodes: [],
    },
    {
      id: sectionIdForKey(documentId, "sec_4_rightSidebarContent"),
      key: "sec_4_rightSidebarContent",
      kind: "content",
      order: 4,
      parentId: sectionIdForKey(documentId, "sec_5_pageShell"),
      visible: true,
      nodes: [],
    },
    {
      id: sectionIdForKey(documentId, "sec_5_pageShell"),
      key: "sec_5_pageShell",
      kind: "container",
      order: 5,
      parentId: null,
      visible: true,
      nodes: [],
    },
    {
      id: sectionIdForKey(documentId, "sec_6_leftControlRail"),
      key: "sec_6_leftControlRail",
      kind: "control",
      order: 6,
      parentId: null,
      visible: true,
      nodes: [{ id: "node-left-plus", type: "button-plus", order: 1, payload: { side: "left" } }],
    },
    {
      id: sectionIdForKey(documentId, "sec_7_rightControlRail"),
      key: "sec_7_rightControlRail",
      kind: "control",
      order: 7,
      parentId: null,
      visible: true,
      nodes: [{ id: "node-right-plus", type: "button-plus", order: 1, payload: { side: "right" } }],
    },
    {
      id: sectionIdForKey(documentId, "sec_8_topToolbar"),
      key: "sec_8_topToolbar",
      kind: "toolbar",
      order: 8,
      parentId: null,
      visible: true,
      nodes: [],
    },
  ];
}

(window as unknown as { CvDomainSectionsSchema?: CvDomainSectionsSchemaApi }).CvDomainSectionsSchema = {
  sectionIdForKey,
  createSectionSkeletons,
};
