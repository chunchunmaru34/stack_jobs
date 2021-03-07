module.exports = {
    verbose: true,
    preset: 'jest-puppeteer',
    testPathIgnorePatterns: ['/node_modules/', 'dist'],
    setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
    globalSetup: './src/jest.global-setup.ts', // will be called once before all tests are executed
    // globalTeardown: './jest.global-teardown.ts', // will be called once after all tests are executed
    transform: {
        '^.+\\.ts?$': 'ts-jest',
    },
    moduleNameMapper: {
        '@models/(.*)$': '<rootDir>/src/models/$1',
        '@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
        '@constants/(.*)$': '<rootDir>/src/constants/$1',
        '@utils/(.*)$': '<rootDir>/src/utils/$1',
    },
};
