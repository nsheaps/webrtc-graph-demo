module.exports = {
    testEnvironment: 'jsdom',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'public/**/*.js',
        'server.js',
        '!public/**/*.test.js',
        '!**/node_modules/**'
    ],
    testMatch: [
        '**/test/**/*.test.js'
    ],
    setupFilesAfterEnv: ['<rootDir>/test/setup.js']
};
