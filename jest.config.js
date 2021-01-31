module.exports = {
    verbose: true,
    preset: 'jest-puppeteer',
    testPathIgnorePatterns: ['/node_modules/', 'dist'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    globalSetup: './jest.global-setup.ts', // will be called once before all tests are executed
    // globalTeardown: './jest.global-teardown.ts', // will be called once after all tests are executed
    transform: {
        '^.+\\.ts?$': 'ts-jest',
    },
    moduleNameMapper: {
        '@models/(.*)$': '<rootDir>/models/$1',
        '@interfaces/(.*)$': '<rootDir>/interfaces/$1',
        '@constants/(.*)$': '<rootDir>/constants/$1',
        '@utils/(.*)$': '<rootDir>/utils/$1',
    },
};
