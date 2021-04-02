module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["./__test__/jest.setup.js"],
  testTimeout: 80000,
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.ts?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
