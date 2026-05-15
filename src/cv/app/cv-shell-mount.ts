interface CvAppShellMountApi {
  bindShell: (
    rootEl: HTMLElement,
    persistence: CvRealtimePersistence,
    hydrationPromise: Promise<CvHydrationModel | null>,
  ) => Array<() => void>;
  teardownShell: (rootEl: HTMLElement, mounted: WeakMap<Element, MountedRecord>) => void;
  mountAllShell: (
    mountFn: (rootEl: Element | null) => boolean,
    selectorRoot: string,
    autoAttr: string,
  ) => void;
}

const SHELL_SELECTOR_RANGE_VAR = 'input[type="range"][data-cv-css-var]';

function bindShell(
  rootEl: HTMLElement,
  persistence: CvRealtimePersistence,
  hydrationPromise: Promise<CvHydrationModel | null>,
): Array<() => void> {
  const nodes = rootEl.querySelectorAll(SHELL_SELECTOR_RANGE_VAR);
  const disposers: Array<() => void> = [];

  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (!(node instanceof HTMLInputElement)) continue;
    const toolbarNodeId = node.dataset.cvCssVar === "--cv-sidebar-left"
      ? "node-toolbar-left-width"
      : node.dataset.cvCssVar === "--cv-sidebar-right"
        ? "node-toolbar-right-width"
        : null;
    const d = getSlidersModule().bindRangeToVar(rootEl, node, () => {
      if (!toolbarNodeId) {
        persistence.markDirty(["sec_8_topToolbar"]);
        return;
      }
      persistence.markDirty(["sec_8_topToolbar"], [
        { sectionKey: "sec_8_topToolbar", nodeId: toolbarNodeId },
      ]);
    });
    if (d) disposers.push(d);
  }

  const floatingNoteDisposer = getFloatingNoteModule().bindFloatingNotePanel(rootEl);
  if (floatingNoteDisposer) disposers.push(floatingNoteDisposer);

  const leftSectionComposerDisposer = getLeftSectionComposerModule().bindLeftSectionComposer(rootEl, {
    initialSectionsPromise: hydrationPromise.then((hydrated) => hydrated?.leftSections ?? null),
    onSectionsChanged: (change) => {
      if (change.kind === "node-content" && typeof change.sectionId === "string") {
        persistence.markDirty(["sec_1_leftSidebarContent"], [
          { sectionKey: "sec_1_leftSidebarContent", nodeId: change.sectionId },
        ]);
        return;
      }
      persistence.markDirty(["sec_1_leftSidebarContent"]);
    },
  });
  if (leftSectionComposerDisposer) disposers.push(leftSectionComposerDisposer);

  const rightSectionComposerDisposer = getRightSectionComposerModule().bindRightSectionComposer(rootEl, {
    onSectionsChanged: (change) => {
      if (change.kind === "node-content" && typeof change.sectionId === "string") {
        persistence.markDirty(["sec_4_rightSidebarContent"], [
          { sectionKey: "sec_4_rightSidebarContent", nodeId: change.sectionId },
        ]);
        return;
      }
      persistence.markDirty(["sec_4_rightSidebarContent"]);
    },
  });
  if (rightSectionComposerDisposer) disposers.push(rightSectionComposerDisposer);

  const localeDisposer = getLocalizationModule().bindLanguageSelector(rootEl, () =>
    persistence.markDirty(["sec_8_topToolbar"], [{ sectionKey: "sec_8_topToolbar", nodeId: "node-toolbar-locale" }]),
  );
  if (localeDisposer) disposers.push(localeDisposer);

  const themeDisposer = getThemesModule().bindThemeSelector(rootEl, () =>
    persistence.markDirty(["sec_8_topToolbar"], [{ sectionKey: "sec_8_topToolbar", nodeId: "node-toolbar-theme" }]),
  );
  if (themeDisposer) disposers.push(themeDisposer);

  void hydrationPromise.then((hydrated) => {
    if (!hydrated) return;
    persistence.runWithoutTracking(() => {
      applyRangeValue(rootEl, "--cv-sidebar-left", hydrated.leftSidebarWidth);
      applyRangeValue(rootEl, "--cv-sidebar-right", hydrated.rightSidebarWidth);
      applyThemeValue(rootEl, hydrated.theme);
      applyLocaleValue(rootEl, hydrated.locale);
    });
  });

  return disposers;
}

function teardownShell(rootEl: HTMLElement, mounted: WeakMap<Element, MountedRecord>): void {
  const rec = mounted.get(rootEl);
  if (!rec) return;
  rec.disposer();
  mounted.delete(rootEl);
  delete rootEl.dataset.cvShellMounted;
}

function mountAllShell(
  mountFn: (rootEl: Element | null) => boolean,
  selectorRoot: string,
  autoAttr: string,
): void {
  const roots = document.querySelectorAll<HTMLElement>(selectorRoot);
  roots.forEach((el) => {
    if (el.getAttribute(autoAttr) === "false") return;
    mountFn(el);
  });
}

(window as unknown as { CvAppShellMount?: CvAppShellMountApi }).CvAppShellMount = {
  bindShell,
  teardownShell,
  mountAllShell,
};
