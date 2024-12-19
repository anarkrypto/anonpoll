import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";
import globals from "globals";

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
				...globals.node,
				...globals.browser,
				TextEncoder: true,
				TextDecoder: true,
				Buffer: true // Specific Node.js additions
			}
		},
		plugins: {
			"@typescript-eslint": tseslint
		},
		rules: {
			"no-undef": "off",
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
		}
	},
	{
		files: ["**/*.spec.{js,ts}", "**/*.test.{js,ts}"],
		languageOptions: { globals: globals.jest }
	},
	{
		ignores: ["**/node_modules/**", "**/dist/**", "**/coverage/**"]
	},
	prettier
];
