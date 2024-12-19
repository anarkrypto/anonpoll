/** @type {import('ts-jest').JestConfigWithTsJest} */

export default {
	setupFilesAfterEnv: [],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/$1',
	},
};
