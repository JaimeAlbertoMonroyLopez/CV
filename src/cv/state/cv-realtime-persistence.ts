interface CvStateRealtimePersistenceApi {
  CvRealtimePersistence: typeof CvRealtimePersistence;
}

const STATE_CV_STORAGE_BEACON_KEY = "cv-recovery-beacon-v1";
const STATE_CV_STORAGE_BEACON_MUTATION_KEY = "cv-recovery-last-mutation-v1";
const STATE_CV_DEBOUNCE_MS = 250;
const STATE_CV_MAX_WAIT_MS = 1400;
const STATE_CV_ALL_SECTION_KEYS: readonly CvSectionKey[] = [
  "sec_1_leftSidebarContent",
  "sec_2_headerProfile",
  "sec_3_workExperience",
  "sec_4_rightSidebarContent",
  "sec_5_pageShell",
  "sec_6_leftControlRail",
  "sec_7_rightControlRail",
  "sec_8_topToolbar",
];

interface CvDirtyNodeRef {
  sectionKey: CvSectionKey;
  nodeId: string;
}

class CvRealtimePersistence {
  private readonly repository: CvDexieRepository;
  private readonly root: HTMLElement;
  private debounceHandle: number | null = null;
  private maxHandle: number | null = null;
  private readonly dirtySections = new Set<CvSectionKey>();
  private readonly dirtyNodeIdsBySection = new Map<CvSectionKey, Set<string>>();
  private inFlight = false;
  private rerun = false;
  private paused = 0;
  private disposed = false;
  private readonly onVisibilityChange: () => void;
  private readonly onPageHide: () => void;
  private readonly onBeforeUnload: () => void;

  constructor(root: HTMLElement) {
    this.root = root;
    this.repository = new CvDexieRepository();
    this.onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void this.flushNow(true);
      }
    };
    this.onPageHide = () => {
      void this.flushNow(true);
    };
    this.onBeforeUnload = () => {
      void this.flushNow(true);
    };
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    window.addEventListener("pagehide", this.onPageHide);
    window.addEventListener("beforeunload", this.onBeforeUnload);
  }

  async loadHydrationModel(): Promise<CvHydrationModel | null> {
    const documentSnapshot = await this.repository.loadPrimaryDocument();
    if (!documentSnapshot) return null;
    return readHydrationModel(documentSnapshot);
  }

  runWithoutTracking(callback: () => void): void {
    this.paused += 1;
    try {
      callback();
    } finally {
      this.paused = Math.max(0, this.paused - 1);
    }
  }

  markDirty(sectionKeys?: readonly CvSectionKey[], dirtyNodeRefs?: readonly CvDirtyNodeRef[]): void {
    if (this.disposed || this.paused > 0) return;
    if (sectionKeys && sectionKeys.length > 0) {
      sectionKeys.forEach((key) => this.dirtySections.add(key));
    } else {
      STATE_CV_ALL_SECTION_KEYS.forEach((key) => this.dirtySections.add(key));
    }
    if (dirtyNodeRefs && dirtyNodeRefs.length > 0) {
      dirtyNodeRefs.forEach((nodeRef) => {
        this.dirtySections.add(nodeRef.sectionKey);
        const set = this.dirtyNodeIdsBySection.get(nodeRef.sectionKey);
        if (set) {
          set.add(nodeRef.nodeId);
          return;
        }
        this.dirtyNodeIdsBySection.set(nodeRef.sectionKey, new Set([nodeRef.nodeId]));
      });
    }
    this.writeRecoveryBeacon("1");
    this.schedule();
  }

  private schedule(): void {
    if (this.debounceHandle === null) {
      this.debounceHandle = window.setTimeout(() => {
        this.debounceHandle = null;
        void this.flushNow();
      }, STATE_CV_DEBOUNCE_MS);
    }
    if (this.maxHandle === null) {
      this.maxHandle = window.setTimeout(() => {
        this.maxHandle = null;
        void this.flushNow();
      }, STATE_CV_MAX_WAIT_MS);
    }
  }

  private clearTimers(): void {
    if (this.debounceHandle !== null) {
      window.clearTimeout(this.debounceHandle);
      this.debounceHandle = null;
    }
    if (this.maxHandle !== null) {
      window.clearTimeout(this.maxHandle);
      this.maxHandle = null;
    }
  }

  private writeRecoveryBeacon(value: "0" | "1"): void {
    try {
      window.localStorage.setItem(STATE_CV_STORAGE_BEACON_KEY, value);
      window.localStorage.setItem(STATE_CV_STORAGE_BEACON_MUTATION_KEY, String(Date.now()));
    } catch {
      // Storage can fail in private mode or restricted environments.
    }
  }

  async flushNow(force = false): Promise<void> {
    if (!force && this.disposed) return;
    if (this.dirtySections.size === 0) return;
    if (this.inFlight) {
      this.rerun = true;
      return;
    }
    this.inFlight = true;
    this.clearTimers();
    const dirtyKeys = Array.from(this.dirtySections);
    const dirtyNodeIdsBySection = new Map<CvSectionKey, Set<string>>();
    this.dirtyNodeIdsBySection.forEach((nodeIds, key) => {
      dirtyNodeIdsBySection.set(key, new Set(nodeIds));
    });
    this.dirtySections.clear();
    this.dirtyNodeIdsBySection.clear();
    try {
      const snapshot = buildDocumentFromDom(this.root);
      await this.repository.savePrimaryDocument(snapshot, dirtyKeys, dirtyNodeIdsBySection);
      this.writeRecoveryBeacon("0");
    } catch {
      dirtyKeys.forEach((key) => this.dirtySections.add(key));
      dirtyNodeIdsBySection.forEach((nodeIds, key) => {
        const existing = this.dirtyNodeIdsBySection.get(key);
        if (existing) {
          nodeIds.forEach((nodeId) => existing.add(nodeId));
          return;
        }
        this.dirtyNodeIdsBySection.set(key, new Set(nodeIds));
      });
      this.writeRecoveryBeacon("1");
    } finally {
      this.inFlight = false;
      if (this.rerun || this.dirtySections.size > 0) {
        this.rerun = false;
        this.schedule();
      }
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.clearTimers();
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.removeEventListener("pagehide", this.onPageHide);
    window.removeEventListener("beforeunload", this.onBeforeUnload);
    void this.flushNow(true);
    this.disposed = true;
  }
}

(window as unknown as { CvStateRealtimePersistence?: CvStateRealtimePersistenceApi }).CvStateRealtimePersistence = {
  CvRealtimePersistence,
};
