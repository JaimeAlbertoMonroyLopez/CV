interface CvGlobal extends Window {
  CvApp?: CvAppApi;
  CvModulesSliders?: CvModulesSlidersApi;
  CvModulesThemes?: CvModulesThemesApi;
  CvModulesLocalization?: CvModulesLocalizationApi;
  CvModulesFloatingNote?: CvModulesFloatingNoteApi;
  CvModulesFloatingNoteAddSection?: CvModulesFloatingNoteAddSectionApi;
  CvModulesLeftSectionComposer?: CvModulesLeftSectionComposerApi;
  CvModulesRightSectionComposer?: CvModulesRightSectionComposerApi;
  CvAppShellMount?: CvAppShellMountApi;
  CvAppBootstrap?: CvAppBootstrapApi;
  CvRuntimeWiring?: CvRuntimeWiringApi;
}

interface CvRuntimeWiringApi {
  getSlidersModule: () => CvModulesSlidersApi;
  getThemesModule: () => CvModulesThemesApi;
  getLocalizationModule: () => CvModulesLocalizationApi;
  getFloatingNoteModule: () => CvModulesFloatingNoteApi;
  getFloatingNoteAddSectionModule: () => CvModulesFloatingNoteAddSectionApi;
  getLeftSectionComposerModule: () => CvModulesLeftSectionComposerApi;
  getRightSectionComposerModule: () => CvModulesRightSectionComposerApi;
  getAppShellMountModule: () => CvAppShellMountApi;
  getAppBootstrapModule: () => CvAppBootstrapApi;
}

function getSlidersModule(): CvModulesSlidersApi {
  const api = (window as CvGlobal).CvModulesSliders;
  if (!api) {
    throw new Error("Sliders module is not loaded.");
  }
  return api;
}

function getThemesModule(): CvModulesThemesApi {
  const api = (window as CvGlobal).CvModulesThemes;
  if (!api) {
    throw new Error("Themes module is not loaded.");
  }
  return api;
}

function getLocalizationModule(): CvModulesLocalizationApi {
  const api = (window as CvGlobal).CvModulesLocalization;
  if (!api) {
    throw new Error("Localization module is not loaded.");
  }
  return api;
}

function getFloatingNoteModule(): CvModulesFloatingNoteApi {
  const api = (window as CvGlobal).CvModulesFloatingNote;
  if (!api) {
    throw new Error("Floating note module is not loaded.");
  }
  return api;
}

function getFloatingNoteAddSectionModule(): CvModulesFloatingNoteAddSectionApi {
  const api = (window as CvGlobal).CvModulesFloatingNoteAddSection;
  if (!api) {
    throw new Error("Floating note add section module is not loaded.");
  }
  return api;
}

function getLeftSectionComposerModule(): CvModulesLeftSectionComposerApi {
  const api = (window as CvGlobal).CvModulesLeftSectionComposer;
  if (!api) {
    throw new Error("Left section composer module is not loaded.");
  }
  return api;
}

function getRightSectionComposerModule(): CvModulesRightSectionComposerApi {
  const api = (window as CvGlobal).CvModulesRightSectionComposer;
  if (!api) {
    throw new Error("Right section composer module is not loaded.");
  }
  return api;
}

function getAppShellMountModule(): CvAppShellMountApi {
  const api = (window as CvGlobal).CvAppShellMount;
  if (!api) {
    throw new Error("App shell mount module is not loaded.");
  }
  return api;
}

function getAppBootstrapModule(): CvAppBootstrapApi {
  const api = (window as CvGlobal).CvAppBootstrap;
  if (!api) {
    throw new Error("App bootstrap module is not loaded.");
  }
  return api;
}

(window as CvGlobal).CvRuntimeWiring = {
  getSlidersModule,
  getThemesModule,
  getLocalizationModule,
  getFloatingNoteModule,
  getFloatingNoteAddSectionModule,
  getLeftSectionComposerModule,
  getRightSectionComposerModule,
  getAppShellMountModule,
  getAppBootstrapModule,
};
