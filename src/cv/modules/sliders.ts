interface CvModulesSlidersApi {
  bindRangeToVar: (
    root: HTMLElement,
    control: HTMLInputElement,
    onMutation?: () => void,
  ) => (() => void) | null;
}

function isCssCustomProp(name: string | null | undefined): name is string {
  return typeof name === "string" && /^--[\w-]+$/.test(name);
}

function percentFromControl(control: HTMLInputElement): string {
  let raw = Number(control.value);
  if (!Number.isFinite(raw)) {
    raw = Number(control.getAttribute("value")) || 30;
  }
  const min = Number(control.min) || 0;
  const max = Number(control.max) || 100;
  raw = Math.min(Math.max(raw, min), max);
  return `${raw}%`;
}

function bindRangeToVar(
  root: HTMLElement,
  control: HTMLInputElement,
  onMutation?: () => void,
): (() => void) | null {
  const prop = control.getAttribute("data-cv-css-var");
  if (!isCssCustomProp(prop)) return null;

  const apply = (): void => {
    root.style.setProperty(prop, percentFromControl(control));
    onMutation?.();
  };

  apply();
  control.addEventListener("input", apply);

  return function disposer(): void {
    control.removeEventListener("input", apply);
  };
}

(window as unknown as { CvModulesSliders?: CvModulesSlidersApi }).CvModulesSliders = {
  bindRangeToVar,
};
