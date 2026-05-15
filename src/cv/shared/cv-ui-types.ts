interface LeftSectionComposerOptions {
  initialSectionsPromise?: Promise<readonly CvSectionModel[] | null>;
  onSectionsChanged?: (change: CvLeftSectionsChangePayload) => void;
}

interface CvLeftSectionsChangePayload {
  kind: "structure" | "node-content";
  sectionId?: string;
}

type _CvUiTypesKeepAlive = LeftSectionComposerOptions | CvLeftSectionsChangePayload;
const _cvUiTypesKeepAlive: _CvUiTypesKeepAlive | null = null;
