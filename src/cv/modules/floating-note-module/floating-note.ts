interface CvModulesFloatingNoteApi {
  bindFloatingNotePanel: (root: HTMLElement) => (() => void) | null;
}

const FLOATING_NOTE_SELECTOR_TRIGGER = '[data-cv-control="left-add-trigger"]';
const FLOATING_NOTE_SELECTOR_PANEL = "[data-cv-floating-note]";
const FLOATING_NOTE_SELECTOR_CLOSE = "[data-cv-floating-note-close]";
const FLOATING_NOTE_SELECTOR_DRAG = "[data-cv-floating-note-drag]";
const FLOATING_NOTE_SELECTOR_INPUT = "[data-cv-floating-note-input]";

function clampFloatingPosition(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function bindFloatingNotePanel(root: HTMLElement): (() => void) | null {
  const trigger = root.querySelector<HTMLButtonElement>(FLOATING_NOTE_SELECTOR_TRIGGER);
  const panel = root.querySelector<HTMLElement>(FLOATING_NOTE_SELECTOR_PANEL);
  if (!trigger || !panel) return null;

  const closeBtn = panel.querySelector<HTMLButtonElement>(FLOATING_NOTE_SELECTOR_CLOSE);
  const dragBtn = panel.querySelector<HTMLButtonElement>(FLOATING_NOTE_SELECTOR_DRAG);
  const noteInput = panel.querySelector<HTMLTextAreaElement>(FLOATING_NOTE_SELECTOR_INPUT);
  if (!closeBtn || !dragBtn || !noteInput) return null;

  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let isDragging = false;

  const applyPanelPosition = (left: number, top: number): void => {
    const panelWidth = panel.offsetWidth || 280;
    const panelHeight = panel.offsetHeight || 140;
    const maxLeft = window.innerWidth - panelWidth - 8;
    const maxTop = window.innerHeight - panelHeight - 8;
    panel.style.left = `${clampFloatingPosition(left, 8, Math.max(8, maxLeft))}px`;
    panel.style.top = `${clampFloatingPosition(top, 8, Math.max(8, maxTop))}px`;
  };

  const showPanel = (): void => {
    panel.hidden = false;
    const triggerRect = trigger.getBoundingClientRect();
    const desiredLeft = triggerRect.right + 14;
    const desiredTop = triggerRect.top - 6;
    applyPanelPosition(desiredLeft, desiredTop);
    noteInput.focus();
  };

  const hidePanel = (): void => {
    panel.hidden = true;
    isDragging = false;
  };

  const onTriggerClick = (event: MouseEvent): void => {
    event.preventDefault();
    showPanel();
  };

  const onCloseClick = (event: MouseEvent): void => {
    event.preventDefault();
    hidePanel();
  };

  const onDragStart = (event: PointerEvent): void => {
    event.preventDefault();
    if (panel.hidden) {
      showPanel();
    }
    const rect = panel.getBoundingClientRect();
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
    isDragging = true;
    dragBtn.setPointerCapture(event.pointerId);
  };

  const onDragMove = (event: PointerEvent): void => {
    if (!isDragging) return;
    applyPanelPosition(event.clientX - dragOffsetX, event.clientY - dragOffsetY);
  };

  const onDragEnd = (event: PointerEvent): void => {
    if (!isDragging) return;
    isDragging = false;
    if (dragBtn.hasPointerCapture(event.pointerId)) {
      dragBtn.releasePointerCapture(event.pointerId);
    }
  };

  const onWindowResize = (): void => {
    if (panel.hidden) return;
    const rect = panel.getBoundingClientRect();
    applyPanelPosition(rect.left, rect.top);
  };

  trigger.addEventListener("click", onTriggerClick);
  closeBtn.addEventListener("click", onCloseClick);
  dragBtn.addEventListener("pointerdown", onDragStart);
  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd);
  window.addEventListener("pointercancel", onDragEnd);
  window.addEventListener("resize", onWindowResize);

  return function disposer(): void {
    trigger.removeEventListener("click", onTriggerClick);
    closeBtn.removeEventListener("click", onCloseClick);
    dragBtn.removeEventListener("pointerdown", onDragStart);
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragEnd);
    window.removeEventListener("pointercancel", onDragEnd);
    window.removeEventListener("resize", onWindowResize);
  };
}

(window as unknown as { CvModulesFloatingNote?: CvModulesFloatingNoteApi }).CvModulesFloatingNote = {
  bindFloatingNotePanel,
};
