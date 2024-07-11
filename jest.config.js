module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    testEnvironment: 'jsdom',
    transform: {
      '^.+\\.jsx?$': 'babel-jest',
    },
  };
  