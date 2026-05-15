interface CvDataDexieRepositoryApi {
  CvDexieRepository: typeof CvDexieRepository;
}

const DATA_CV_PRIMARY_DOCUMENT_ID = "primary-cv-document";
const DATA_CV_DEXIE_DB_NAME = "cv-editor-db";
const DATA_CV_ALL_SECTION_KEYS: readonly CvSectionKey[] = [
  "sec_1_leftSidebarContent",
  "sec_2_headerProfile",
  "sec_3_workExperience",
  "sec_4_rightSidebarContent",
  "sec_5_pageShell",
  "sec_6_leftControlRail",
  "sec_7_rightControlRail",
  "sec_8_topToolbar",
];

declare const Dexie: DexieCtorLike | undefined;

class CvDexieRepository {
  private readonly enabled: boolean;
  private readonly db: DexieDatabaseLike | null;
  private readonly documents: DexieTableLike<string, CvDocumentRecord> | null;
  private readonly sections: DexieTableLike<string, CvSectionRecord> | null;
  private readonly nodes: DexieTableLike<string, CvNodeRecord> | null;

  constructor() {
    if (typeof Dexie === "undefined") {
      this.enabled = false;
      this.db = null;
      this.documents = null;
      this.sections = null;
      this.nodes = null;
      return;
    }
    const db = new Dexie(DATA_CV_DEXIE_DB_NAME);
    db.version(1).stores({
      documents: "id,schemaVersion,updatedAt",
      sections: "id,documentId,[documentId+order],key,kind,updatedAt",
      nodes: "id,documentId,sectionId,[sectionId+order],type,updatedAt",
    });
    this.enabled = true;
    this.db = db;
    this.documents = db.table<CvDocumentRecord>("documents");
    this.sections = db.table<CvSectionRecord>("sections");
    this.nodes = db.table<CvNodeRecord>("nodes");
  }

  private async ensureOpen(): Promise<boolean> {
    if (!this.enabled || !this.db) return false;
    if (this.db.isOpen()) return true;
    await this.db.open();
    return true;
  }

  async loadPrimaryDocument(): Promise<CvDocumentV1 | null> {
    if (!(await this.ensureOpen()) || !this.documents) return null;
    const record = await this.documents.where("id").equals(DATA_CV_PRIMARY_DOCUMENT_ID).toArray();
    const first = record[0];
    if (!first) return null;
    const parsed = parseStoredDocument(first.snapshotJson);
    return parsed;
  }

  async savePrimaryDocument(
    snapshot: CvDocumentV1,
    dirtyKeys: readonly CvSectionKey[],
    dirtyNodeIdsBySection: ReadonlyMap<CvSectionKey, ReadonlySet<string>>,
  ): Promise<void> {
    if (!(await this.ensureOpen()) || !this.db || !this.documents || !this.sections || !this.nodes) return;
    const db = this.db;
    const documents = this.documents;
    const sections = this.sections;
    const nodes = this.nodes;

    const dirtyKeySet = new Set<CvSectionKey>(dirtyKeys.length > 0 ? dirtyKeys : DATA_CV_ALL_SECTION_KEYS);
    const dirtySections = snapshot.sections.filter((section) => dirtyKeySet.has(section.key));
    const sectionRecords: CvSectionRecord[] = [];
    const fullRewriteNodeRecords: CvNodeRecord[] = [];
    const partialNodeRecords: CvNodeRecord[] = [];
    dirtySections.forEach((section) => {
      sectionRecords.push({
        id: section.id,
        documentId: snapshot.documentId,
        key: section.key,
        kind: section.kind,
        order: section.order,
        parentId: section.parentId,
        visible: section.visible ? 1 : 0,
        updatedAt: snapshot.updatedAt,
      });
      const dirtyNodeIds = dirtyNodeIdsBySection.get(section.key);
      if (dirtyNodeIds && dirtyNodeIds.size > 0) {
        section.nodes
          .filter((node) => dirtyNodeIds.has(node.id))
          .forEach((node) => {
            partialNodeRecords.push({
              id: `${section.id}:${node.id}`,
              documentId: snapshot.documentId,
              sectionId: section.id,
              type: node.type,
              order: node.order,
              payloadJson: JSON.stringify(node.payload),
              updatedAt: snapshot.updatedAt,
            });
          });
        return;
      }
      section.nodes.forEach((node) => {
        fullRewriteNodeRecords.push({
          id: `${section.id}:${node.id}`,
          documentId: snapshot.documentId,
          sectionId: section.id,
          type: node.type,
          order: node.order,
          payloadJson: JSON.stringify(node.payload),
          updatedAt: snapshot.updatedAt,
        });
      });
    });

    await db.transaction("rw", documents, sections, nodes, async () => {
      const sectionRows = await sections.where("documentId").equals(snapshot.documentId).toArray();
      const oldSectionsByKey = new Map<CvSectionKey, CvSectionRecord>();
      sectionRows.forEach((row) => oldSectionsByKey.set(row.key, row));
      const fullRewriteSectionIds = sectionRows
        .filter((row) => dirtyKeySet.has(row.key))
        .filter((row) => {
          const dirtyNodeIds = dirtyNodeIdsBySection.get(row.key);
          return !(dirtyNodeIds && dirtyNodeIds.size > 0);
        })
        .map((row) => row.id);
      if (fullRewriteSectionIds.length > 0) {
        const fullRewriteSectionIdSet = new Set(fullRewriteSectionIds);
        const nodeRows = await nodes.where("documentId").equals(snapshot.documentId).toArray();
        const oldNodeIds = nodeRows.filter((row) => fullRewriteSectionIdSet.has(row.sectionId)).map((row) => row.id);
        if (oldNodeIds.length > 0) {
          await nodes.bulkDelete(oldNodeIds);
        }
      }
      const dirtySectionIds = sectionRows.filter((row) => dirtyKeySet.has(row.key)).map((row) => row.id);
      if (dirtySectionIds.length > 0) {
        await sections.bulkDelete(dirtySectionIds);
      }
      if (sectionRecords.length > 0) {
        await sections.bulkPut(sectionRecords);
      }
      if (fullRewriteNodeRecords.length > 0) {
        await nodes.bulkPut(fullRewriteNodeRecords);
      }
      if (partialNodeRecords.length > 0) {
        await nodes.bulkPut(partialNodeRecords);
      }
      const missingPartialNodeDeletes: string[] = [];
      oldSectionsByKey.forEach((existingSection, key) => {
        const dirtyNodeIds = dirtyNodeIdsBySection.get(key);
        if (!dirtyNodeIds || dirtyNodeIds.size === 0) return;
        const currentSection = snapshot.sections.find((section) => section.key === key);
        if (!currentSection) return;
        const currentNodeIdSet = new Set(currentSection.nodes.map((node) => node.id));
        dirtyNodeIds.forEach((nodeId) => {
          if (currentNodeIdSet.has(nodeId)) return;
          missingPartialNodeDeletes.push(`${existingSection.id}:${nodeId}`);
        });
      });
      if (missingPartialNodeDeletes.length > 0) {
        await nodes.bulkDelete(missingPartialNodeDeletes);
      }
      await documents.put({
        id: snapshot.documentId,
        schemaVersion: snapshot.schemaVersion,
        updatedAt: snapshot.updatedAt,
        snapshotJson: JSON.stringify(snapshot),
      });
    });
  }
}

(window as unknown as { CvDataDexieRepository?: CvDataDexieRepositoryApi }).CvDataDexieRepository = {
  CvDexieRepository,
};
