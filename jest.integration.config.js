//live-network suites: they deploy contracts with the stellar cli against the rpc named in each example.contract.config.json
module.exports = {
    testMatch: ['<rootDir>/test/client-integration/**/*.test.js'],
    testPathIgnorePatterns: ['/node_modules/']
}
