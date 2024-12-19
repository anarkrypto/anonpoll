import baseConfig from '@zeropoll/chain/jest.config.js';

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
	...baseConfig,
	setupFilesAfterEnv: [],
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		'^@/(.*)$': '<rootDir>/src/$1',
	},
};
