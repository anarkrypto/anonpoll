import type { Config } from "jest";

const config: Config = {
	preset: "ts-jest",
	testEnvironment: "node",
	setupFiles: ["<rootDir>/jest.setup.ts"],
	extensionsToTreatAsEsm: [".ts"],
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1"
	},
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				useESM: true
			}
		]
	},
	testTimeout: 10000,
	verbose: true
};

export default config;
