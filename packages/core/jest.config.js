/* eslint-disable no-undef */
/* eslint-disable import/unambiguous */
/* eslint-disable import/no-commonjs */
/** @type {import('ts-jest').JestConfigWithTsJest} */

const baseConfig = require('@zeropoll/chain/jest.config.cjs');

module.exports = {
	...baseConfig,
	setupFilesAfterEnv: [],
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		'^@/(.*)$': '<rootDir>/src/$1',
	},
};
