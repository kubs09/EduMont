module.exports = {
  transform: {},
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      moduleNameMapper: { '^#backend/(.*)$': '<rootDir>/$1' },
      transform: {},
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      moduleNameMapper: { '^#backend/(.*)$': '<rootDir>/$1' },
      setupFiles: ['<rootDir>/tests/setup/loadTestEnv.js'],
      transform: {},
    },
  ],
};
