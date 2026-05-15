interface CvBootstrapGlobal extends Window {
  CvApp?: CvAppApi;
}

interface CvAppBootstrapApi {
  attachCvApp: (api: CvAppApi) => void;
}

function attachCvApp(api: CvAppApi): void {
  const global = window as CvBootstrapGlobal;
  global.CvApp = api;

  const maybeAutoMount = (): void => {
    api.mountAll();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", maybeAutoMount, { once: true });
  } else {
    maybeAutoMount();
  }
}

(window as unknown as { CvAppBootstrap?: CvAppBootstrapApi }).CvAppBootstrap = {
  attachCvApp,
};
