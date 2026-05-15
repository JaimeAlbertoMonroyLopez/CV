interface CvRightSectionsChangePayload {
  kind: "structure" | "node-content";
  sectionId?: string;
}

interface RightSectionComposerOptions {
  onSectionsChanged?: (change: CvRightSectionsChangePayload) => void;
}

interface CvModulesRightSectionComposerApi {
  bindRightSectionComposer: (root: HTMLElement, options?: RightSectionComposerOptions) => (() => void) | null;
}

interface CvRightSectionModel {
  id: string;
  title: string;
  content: string;
  order: number;
}

const RIGHT_COMPOSER_SELECTOR_ADD_TRIGGER = '[data-cv-control="right-add-trigger"]';
const RIGHT_COMPOSER_SELECTOR_HOST = "[data-cv-right-sections]";

function makeRightSectionId(seed: number): string {
  return `right-section-${Date.now().toString(36)}-${seed.toString(36)}`;
}

function autoResizeRightTextarea(textarea: HTMLTextAreaElement): void {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.max(72, textarea.scrollHeight)}px`;
}

function bindRightSectionComposer(root: HTMLElement, options?: RightSectionComposerOptions): (() => void) | null {
  const addTrigger = root.querySelector<HTMLButtonElement>(RIGHT_COMPOSER_SELECTOR_ADD_TRIGGER);
  const sectionsHost = root.querySelector<HTMLElement>(RIGHT_COMPOSER_SELECTOR_HOST);
  if (!addTrigger || !sectionsHost) return null;

  const sections: CvRightSectionModel[] = [];
  const sectionTextDisposers: Array<() => void> = [];
  let sectionSeed = 0;

  const syncSnapshot = (change: CvRightSectionsChangePayload): void => {
    root.dataset.cvRightSectionsModel = JSON.stringify(
      sections.map((section) => ({
        id: section.id,
        title: section.title,
        content: section.content,
        order: section.order,
      })),
    );
    options?.onSectionsChanged?.(change);
  };

  const bindSectionText = (section: CvRightSectionModel, textarea: HTMLTextAreaElement): void => {
    const onInput = (): void => {
      section.content = textarea.value;
      autoResizeRightTextarea(textarea);
      syncSnapshot({ kind: "node-content", sectionId: section.id });
    };
    textarea.addEventListener("input", onInput);
    autoResizeRightTextarea(textarea);
    sectionTextDisposers.push(() => textarea.removeEventListener("input", onInput));
  };

  const renderSection = (section: CvRightSectionModel): void => {
    const slot = document.createElement("div");
    slot.className = "cv-pill-slot";
    slot.dataset.cvSectionId = section.id;
    slot.dataset.cvSectionSide = "right";
    slot.dataset.cvSectionOrder = String(section.order);

    const title = document.createElement("h3");
    title.className = "cv-pill";
    title.textContent = section.title;

    const text = document.createElement("textarea");
    text.className = "cv-sidebar__section-text";
    text.rows = 4;
    text.value = section.content;
    text.setAttribute("aria-label", `${section.title} content`);

    slot.append(title, text);
    sectionsHost.appendChild(slot);
    bindSectionText(section, text);
  };

  const appendSection = (titleRaw: string): void => {
    const title = titleRaw.trim();
    if (!title) return;
    sectionSeed += 1;
    const section: CvRightSectionModel = {
      id: makeRightSectionId(sectionSeed),
      title,
      content: "",
      order: sections.length,
    };
    sections.push(section);
    renderSection(section);
    syncSnapshot({ kind: "structure" });
  };

  const onAddClick = (event: MouseEvent): void => {
    event.preventDefault();
    const title = window.prompt("Title for right section:", "");
    if (typeof title !== "string") return;
    appendSection(title);
  };

  addTrigger.addEventListener("click", onAddClick);

  return function disposer(): void {
    addTrigger.removeEventListener("click", onAddClick);
    sectionTextDisposers.forEach((dispose) => dispose());
    sectionTextDisposers.length = 0;
  };
}

(window as unknown as { CvModulesRightSectionComposer?: CvModulesRightSectionComposerApi }).CvModulesRightSectionComposer = {
  bindRightSectionComposer,
};
