/** @type {import('eslint').Linter.Config} */
module.exports = {
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"prettier"
	],
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint"],
	env: {
		browser: true,
		node: true,
		es2021: true
	},
	parserOptions: {
		ecmaVersion: "latest",
		sourceType: "module"
	},
	rules: {
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
	ignorePatterns: ["**/node_modules/**", "**/dist/**", "**/coverage/**"]
};
