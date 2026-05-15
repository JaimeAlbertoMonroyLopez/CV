interface CvDocumentRecord {
  id: string;
  schemaVersion: number;
  updatedAt: string;
  snapshotJson: string;
}

interface CvSectionRecord {
  id: string;
  documentId: string;
  key: CvSectionKey;
  kind: CvSectionKind;
  order: number;
  parentId: string | null;
  visible: number;
  updatedAt: string;
}

interface CvNodeRecord {
  id: string;
  documentId: string;
  sectionId: string;
  type: string;
  order: number;
  payloadJson: string;
  updatedAt: string;
}

interface DexieCollectionLike<TKey extends string, TRecord> {
  toArray(): Promise<TRecord[]>;
  primaryKeys(): Promise<TKey[]>;
}

interface DexieWhereClauseLike<TKey extends string, TRecord> {
  equals(value: string): DexieCollectionLike<TKey, TRecord>;
}

interface DexieTableLike<TKey extends string, TRecord> {
  put(value: TRecord): Promise<TKey>;
  bulkPut(values: readonly TRecord[]): Promise<void>;
  bulkDelete(keys: readonly TKey[]): Promise<void>;
  where(indexName: string): DexieWhereClauseLike<TKey, TRecord>;
}

interface DexieDatabaseLike {
  version(version: number): { stores(schema: Record<string, string>): void };
  table<TRecord, TKey extends string = string>(name: string): DexieTableLike<TKey, TRecord>;
  transaction(mode: "rw" | "r", ...tablesAndScope: unknown[]): Promise<void>;
  isOpen(): boolean;
  open(): Promise<void>;
}

interface DexieCtorLike {
  new (name: string): DexieDatabaseLike;
}

type _CvDexieTypesKeepAlive =
  | CvDocumentRecord
  | CvSectionRecord
  | CvNodeRecord
  | DexieCollectionLike<string, CvDocumentRecord>
  | DexieWhereClauseLike<string, CvDocumentRecord>
  | DexieTableLike<string, CvDocumentRecord>
  | DexieDatabaseLike
  | DexieCtorLike;
const _cvDexieTypesKeepAlive: _CvDexieTypesKeepAlive | null = null;
