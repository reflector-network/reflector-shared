/*eslint-disable no-undef */
const {getDataHash} = require('../helpers/signatures-helper')
const Config = require('../models/configs/config')
const {sortObjectKeys} = require('../utils/serialization-helper')
const {legacyConfig, mixedLegacyConfig} = require('./constants')

test('legacy config hash test', () => {
    const config = new Config(legacyConfig)
    expect(config.isLegacy).toBe(true)
    console.log(JSON.stringify(config.toPlainObject()))
    console.log(JSON.stringify(sortObjectKeys(legacyConfig)))
    const configHash = config.getHash()
    const rawConfigHash = getDataHash(sortObjectKeys(legacyConfig))
    expect(configHash).toBe(rawConfigHash)
}, 1000000)


test('mixed legacy config test', () => {
    const config = new Config(mixedLegacyConfig)
    expect(config.issues.length).toBe(1)
}, 1000000)