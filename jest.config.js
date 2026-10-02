module.exports = {
  projects: [
    {
      displayName: 'logic',
      testEnvironment: 'node',
      transform: { '^.+\\.tsx?$': ['babel-jest', { presets: ['babel-preset-expo'] }] },
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      moduleNameMapper: { '^(\\.\\./)+lib/crypto$': '<rootDir>/src/testing/nodeCrypto.ts' },
    },
  ],
};
