interface CvModulesLeftSectionComposerApi {
  bindLeftSectionComposer: (root: HTMLElement, options?: LeftSectionComposerOptions) => (() => void) | null;
}

const LEFT_COMPOSER_SELECTOR_FLOATING_NOTE_INPUT = "[data-cv-floating-note-input]";
const LEFT_COMPOSER_SELECTOR_FLOATING_NOTE_ADD = "[data-cv-floating-note-add]";
const LEFT_COMPOSER_SELECTOR_LEFT_SECTIONS = "[data-cv-left-sections]";

function leftComposerMakeSectionId(seed: number): string {
  return `left-section-${Date.now().toString(36)}-${seed.toString(36)}`;
}

function leftComposerAutoResizeTextarea(textarea: HTMLTextAreaElement): void {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.max(72, textarea.scrollHeight)}px`;
}

function bindLeftSectionComposer(root: HTMLElement, options?: LeftSectionComposerOptions): (() => void) | null {
  const sectionsHost = root.querySelector<HTMLElement>(LEFT_COMPOSER_SELECTOR_LEFT_SECTIONS);
  const noteInput = root.querySelector<HTMLTextAreaElement>(LEFT_COMPOSER_SELECTOR_FLOATING_NOTE_INPUT);
  const addBtn = root.querySelector<HTMLButtonElement>(LEFT_COMPOSER_SELECTOR_FLOATING_NOTE_ADD);
  if (!sectionsHost || !noteInput || !addBtn) return null;

  const sections: CvSectionModel[] = [];
  const sectionTextDisposers: Array<() => void> = [];
  let sectionSeed = 0;
  let isDisposed = false;
  let isInitialized = false;

  const syncDraftSnapshot = (change: CvLeftSectionsChangePayload): void => {
    root.dataset.cvLeftSectionsModel = stringifyLeftSections(sections);
    options?.onSectionsChanged?.(change);
  };

  const createSection = (title: string): CvSectionModel => {
    sectionSeed += 1;
    return {
      id: leftComposerMakeSectionId(sectionSeed),
      title,
      content: "",
      order: sections.length,
      side: "left",
    };
  };

  const createSectionFromModel = (section: CvSectionModel): CvSectionModel => {
    sectionSeed += 1;
    return {
      id: section.id || leftComposerMakeSectionId(sectionSeed),
      title: section.title,
      content: section.content,
      order: sections.length,
      side: "left",
    };
  };

  const bindSectionText = (section: CvSectionModel, textarea: HTMLTextAreaElement): void => {
    const onInput = (): void => {
      section.content = textarea.value;
      leftComposerAutoResizeTextarea(textarea);
      syncDraftSnapshot({ kind: "node-content", sectionId: section.id });
    };
    textarea.addEventListener("input", onInput);
    leftComposerAutoResizeTextarea(textarea);
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

  const clearRenderedSections = (): void => {
    sectionTextDisposers.forEach((dispose) => dispose());
    sectionTextDisposers.length = 0;
    sections.length = 0;
    sectionsHost.innerHTML = "";
  };

  const renderSectionsFromModels = (inputSections: readonly CvSectionModel[]): void => {
    clearRenderedSections();
    const normalized = normalizePersistedLeftSections(inputSections);
    normalized.forEach((section) => {
      const next = createSectionFromModel(section);
      sections.push(next);
      renderSection(next);
    });
    syncDraftSnapshot({ kind: "structure" });
  };

  const appendSectionsByTitles = (titles: string[]): void => {
    titles.forEach((titleRaw) => {
      const title = titleRaw.trim();
      if (!title) return;
      const section = createSection(title);
      sections.push(section);
      renderSection(section);
    });
    syncDraftSnapshot({ kind: "structure" });
  };

  const disposeAddSectionBindings = getFloatingNoteAddSectionModule().bindFloatingNoteAddSection(noteInput, addBtn, {
    isEnabled: () => isInitialized,
    onAddTitles: (titles) => appendSectionsByTitles(titles),
  });
  addBtn.disabled = true;
  noteInput.disabled = true;

  const initializeComposer = async (): Promise<void> => {
    let seeded = false;
    if (options?.initialSectionsPromise) {
      const persisted = await options.initialSectionsPromise;
      if (isDisposed) return;
      if (persisted && persisted.length > 0) {
        renderSectionsFromModels(persisted);
        seeded = true;
      }
    }
    if (!seeded) {
      appendSectionsByTitles(["Contact Me", "Education"]);
    }
    isInitialized = true;
    addBtn.disabled = false;
    noteInput.disabled = false;
  };

  void initializeComposer();

  return function disposer(): void {
    isDisposed = true;
    disposeAddSectionBindings();
    sectionTextDisposers.forEach((dispose) => dispose());
    sectionTextDisposers.length = 0;
  };
}

(window as unknown as { CvModulesLeftSectionComposer?: CvModulesLeftSectionComposerApi }).CvModulesLeftSectionComposer = {
  bindLeftSectionComposer,
};
