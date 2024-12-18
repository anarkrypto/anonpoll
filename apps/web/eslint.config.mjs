import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import customConfig from '@zeropoll/eslint-config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const eslintConfig = [
	...customConfig,
	...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default mergeConfigs(eslintConfig);

/**
 * Merges multiple ESLint flat configs while preventing plugin duplication
 * @param {Linter.FlatConfig[]} configs - Arrays of ESLint flat config objects
 * @returns {Linter.FlatConfig[]} Merged config array with deduplicated plugins
 */
function mergeConfigs(...configs) {
	const seenPlugins = new Map();

	return configs.flat().map(config => {
		if (!config.plugins) return config;

		const dedupedPlugins = Object.fromEntries(
			Object.entries(config.plugins).map(([pluginName, plugin]) => {
				if (seenPlugins.has(pluginName)) {
					// Same plugins name should use the same reference
					return [pluginName, seenPlugins.get(pluginName)];
				}
				seenPlugins.set(pluginName, plugin);
				return [pluginName, plugin];
			})
		);

		return {
			...config,
			plugins: dedupedPlugins,
		};
	});
}
