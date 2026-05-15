interface CvModulesFloatingNoteAddSectionApi {
  bindFloatingNoteAddSection: (
    noteInput: HTMLTextAreaElement,
    addBtn: HTMLButtonElement,
    options: CvFloatingNoteAddSectionOptions,
  ) => () => void;
}

interface CvFloatingNoteAddSectionOptions {
  isEnabled: () => boolean;
  onAddTitles: (titles: string[]) => void;
}

function normalizeCommaSeparatedTitles(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, ",")
    .split(",")
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .join(",");
}

function parseTitlesFromInput(normalized: string): string[] {
  return normalized
    .split(",")
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
}

function bindFloatingNoteAddSection(
  noteInput: HTMLTextAreaElement,
  addBtn: HTMLButtonElement,
  options: CvFloatingNoteAddSectionOptions,
): () => void {
  const addSectionsFromComposer = (): void => {
    if (!options.isEnabled()) return;
    const normalized = normalizeCommaSeparatedTitles(noteInput.value);
    const titles = parseTitlesFromInput(normalized);
    if (titles.length === 0) return;
    options.onAddTitles(titles);
    noteInput.value = "";
    noteInput.focus();
  };

  const onAddClick = (event: MouseEvent): void => {
    event.preventDefault();
    addSectionsFromComposer();
  };

  const onComposerKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    addSectionsFromComposer();
  };

  addBtn.addEventListener("click", onAddClick);
  noteInput.addEventListener("keydown", onComposerKeyDown);

  return function disposer(): void {
    addBtn.removeEventListener("click", onAddClick);
    noteInput.removeEventListener("keydown", onComposerKeyDown);
  };
}

(window as unknown as { CvModulesFloatingNoteAddSection?: CvModulesFloatingNoteAddSectionApi }).CvModulesFloatingNoteAddSection = {
  bindFloatingNoteAddSection,
};
