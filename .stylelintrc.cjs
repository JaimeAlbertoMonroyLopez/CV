module.exports = {
  extends: ["stylelint-config-standard", "stylelint-config-standard-scss"],
  rules: {
    "selector-class-pattern": "^(cv(?:-[a-z0-9]+)*(?:__(?:[a-z0-9]+(?:-[a-z0-9]+)*))?(?:--(?:[a-z0-9]+(?:-[a-z0-9]+)*))?|fa(?:-[a-z0-9]+)+)$",
    "color-function-notation": "modern",
    "alpha-value-notation": "number",
    "declaration-no-important": true,
  },
};
