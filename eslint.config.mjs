import tseslint from "typescript-eslint";

export default tseslint.config({
  files: ["**/*.{ts,tsx}"],
  languageOptions: {
    parser: tseslint.parser,
  },
  ignores: [
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ],
});
