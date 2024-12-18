import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
	eslint.configs.recommended,
	{
		files: ["**/*.{js,jsx,ts,tsx}"],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module"
			},
			globals: {
				// Equivalent to previous env settings
				browser: true,
				node: true,
				es2021: true
			}
		},
		plugins: {
			"@typescript-eslint": tseslint
		},
		rules: {
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": "warn",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-unused-expressions": [
				"error",
				{
					allowShortCircuit: true,
					allowTernary: true,
					allowTaggedTemplates: true
				}
			]
		},
		ignores: ["**/node_modules/**", "**/dist/**", "**/coverage/**"]
	},
	prettier
];
