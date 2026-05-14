/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      comment: "Disallow circular dependencies anywhere in the project.",
      severity: "error",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "ui-to-domain",
      comment: "UI can only depend on state layer, not directly on domain.",
      severity: "error",
      from: { path: "^src/ui" },
      to: { path: "^src/domain" },
    },
    {
      name: "ui-to-data",
      comment: "UI should not directly access persistence or infrastructure.",
      severity: "error",
      from: { path: "^src/ui" },
      to: { path: "^src/data" },
    },
    {
      name: "state-to-data",
      comment: "State should go through domain contracts/use cases.",
      severity: "error",
      from: { path: "^src/state" },
      to: { path: "^src/data" },
    },
    {
      name: "domain-to-upward-layers",
      comment: "Domain must remain independent of state/ui/app layers.",
      severity: "error",
      from: { path: "^src/domain" },
      to: { path: "^src/(app|state|ui)" },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    includeOnly: "^src",
    tsPreCompilationDeps: false,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "default"],
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+",
      },
    },
  },
};
