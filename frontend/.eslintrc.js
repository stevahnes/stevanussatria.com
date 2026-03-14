module.exports = {
  root: true,
  ignorePatterns: [
    "package.json",
    "package-lock.json",
    "node_modules/",
    "dist/",
    ".cache/",
    ".temp/",
    ".vitepress/cache/",
  ],
  env: {
    node: true,
    browser: true,
    es2023: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:vue/recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "prettier",
  ],
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    extraFileExtensions: [".vue"],
  },
  plugins: ["vue", "@typescript-eslint", "markdown"],
  rules: {
    "vue/require-default-prop": "off",
    "vue/multi-word-component-names": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
  },
  overrides: [
    {
      files: ["*.js", "*.mjs", "*.cjs"],
      extends: ["plugin:@typescript-eslint/disable-type-checked"],
    },
    {
      files: ["tailwind.config.ts"],
      extends: ["plugin:@typescript-eslint/disable-type-checked"],
    },
    {
      files: ["**/__tests__/**/*.ts"],
      rules: {
        "vue/one-component-per-file": "off",
      },
    },
    {
      files: ["**/*.md"],
      processor: "markdown/markdown",
    },
    {
      files: ["**/*.md/**/*.{js,ts,vue}"],
      extends: ["plugin:@typescript-eslint/disable-type-checked"],
      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
        },
      },
      rules: {
        "vue/html-self-closing": "off",
        "vue/max-attributes-per-line": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "no-undef": "off",
        "no-unused-vars": "off",
      },
    },
  ],
};
