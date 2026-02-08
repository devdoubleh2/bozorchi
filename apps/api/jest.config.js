export default {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/__test__"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/__test__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@sp/types$": "<rootDir>/packages/types",
    "^@sp/types/(.*)$": "<rootDir>/packages/types/$1",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "esnext",
          moduleResolution: "node",
        },
      },
    ],
  },
  transformIgnorePatterns: [],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/test-utils/**",
    "!src/**/index.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    "./src/services/": {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    "./src/utils/": {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    "./src/middleware/": {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/src/test-utils/setup.ts"],
  testTimeout: 30000,
  maxWorkers: 1,
  clearMocks: true,
  restoreMocks: true,
};
