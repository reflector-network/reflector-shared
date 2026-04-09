/*eslint-disable no-undef */
const {getDataHash} = require('../../../helpers/signatures-helper')
const Config = require('../../../models/configs/config')
const OracleConfig = require('../../../models/configs/oracle-config')
const OracleBeamConfig = require('../../../models/configs/oracle-beam-config')
const SubscriptionsConfig = require('../../../models/configs/subscriptions-config')
const DAOConfig = require('../../../models/configs/dao-config')
const {sortObjectKeys} = require('../../../utils/serialization-helper')
const {legacyConfig, mixedLegacyConfig, oracleBeamContractRaw, oracleContractRaw, subscriptionsContractRaw, daoContractRaw} = require('../../constants')

describe('configs tests', () => {

    test('legacy config hash test', () => {
        const config = new Config(legacyConfig)
        expect(config.isLegacy).toBe(true)
        console.log(JSON.stringify(config.toPlainObject()))
        console.log(JSON.stringify(sortObjectKeys(legacyConfig)))
        const configHash = config.getHash()
        const rawConfigHash = getDataHash(sortObjectKeys(legacyConfig))
        expect(configHash).toBe(rawConfigHash)
    }, 1000000)

    test('convert to new format config test', () => {
        const config = new Config(legacyConfig)
        const newConfig = new Config(config.toPlainObject(false))
        expect(newConfig.isLegacy).toBe(false)
    }, 1000000)


    test('mixed legacy config test', () => {
        const config = new Config(mixedLegacyConfig)
        expect(config.issues.length).toBe(1)
    }, 1000000)

    test('default decimals and baseAssets', () => {
        const config = JSON.parse(JSON.stringify(legacyConfig))
        config.decimals = 14
        config.baseAssets = {
            exchanges: {
                code: "USD",
                type: 2
            }
        }
        const configObj = new Config(config)
        expect(configObj.issues).toBe(undefined)
        expect(configObj.baseAssets.get("exchanges").code).toBe("USD")
        expect(configObj.baseAssets.get("exchanges").type).toBe(2)
        expect(configObj.decimals).toBe(14)
    }, 1000000)


    test('no cache size', () => {
        const config = JSON.parse(JSON.stringify(legacyConfig))
        config.cacheSize = undefined
        const configObj = new Config(config)
        expect(configObj.issues).toBe(undefined)
    })

    test('cache size', () => {
        const config = JSON.parse(JSON.stringify(legacyConfig))
        config.cacheSize = 5
        const configObj = new Config(config)
        expect(configObj.issues).toBe(undefined)
    })

    test('no retention period', () => {
        const config = JSON.parse(JSON.stringify(legacyConfig))
        config.retentionPeriod = undefined
        const configObj = new Config(config)
        expect(configObj.issues).toBe(undefined)
    })

    test('retention config', () => {
        const config = JSON.parse(JSON.stringify(legacyConfig))
        config.retentionConfig = {
            token: 'native',
            fee: BigInt(1000000)
        }
        const configObj = new Config(config)
        expect(configObj.issues).toBe(undefined)
    })

    test('price heartbeat', () => {
        const config = JSON.parse(JSON.stringify(legacyConfig))
        config.priceHeartbeat = 60000
        const configObj = new Config(config)
        expect(configObj.issues).toBe(undefined)
        const rawConfig = configObj.toPlainObject()
        expect(rawConfig.priceHeartbeat).toBe(60000)
    })

    test('price heartbeat not valid', () => {
        const config = JSON.parse(JSON.stringify(legacyConfig))
        config.priceHeartbeat = -1
        const configObj = new Config(config)
        expect(configObj.issues.length).toBe(1)
    })

    test('asset threshold', () => {
        const config = JSON.parse(JSON.stringify(legacyConfig))
        config.contracts[Object.keys(config.contracts)[0]].assets[0].threshold = 50
        const configObj = new Config(config)
        expect(configObj.issues).toBe(undefined)
        const rawConfig = configObj.toPlainObject()
        expect(rawConfig.contracts[Object.keys(rawConfig.contracts)[0]].assets[0].threshold).toBe(50)
    })

    test('different raw config fields order', () => {
        const configA = new Config(legacyConfig)
        const rawConfigB = {...legacyConfig}
        const firstNode = rawConfigB.nodes[Object.keys(rawConfigB.nodes)[0]]
        delete rawConfigB.nodes[firstNode.pubkey]
        rawConfigB.nodes[firstNode.pubkey] = firstNode
        const configB = new Config(rawConfigB)
        for (let i = 0; i < configA.nodes.size; i++) {
            expect([...configA.nodes.keys()][i] === [...configB.nodes.keys()][i]).toBe(true)
        }
    })
})

describe('config round-trip tests', () => {

    const contractRoundTripCases = [
        ['OracleConfig', OracleConfig, oracleContractRaw],
        ['OracleConfig with optional fields', OracleConfig, {...oracleContractRaw, decimals: 14, cacheSize: 5, feeConfig: {token: 'native', fee: '1000000'}}],
        ['OracleBeamConfig', OracleBeamConfig, oracleBeamContractRaw],
        ['SubscriptionsConfig', SubscriptionsConfig, subscriptionsContractRaw],
        ['DAOConfig', DAOConfig, daoContractRaw]
    ]

    test.each(contractRoundTripCases)('%s round-trip', (_, ConfigClass, raw) => {
        const original = new ConfigClass(raw)
        expect(original.issues).toBe(undefined)

        const serialized = original.toPlainObject(false)
        const restored = new ConfigClass(serialized)
        expect(restored.issues).toBe(undefined)
        expect(restored.equals(original)).toBe(true)
    })

    test('full Config round-trip with all contract types', () => {
        const rawConfig = JSON.parse(JSON.stringify(legacyConfig))
        rawConfig.contracts['CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW'] = oracleBeamContractRaw

        const original = new Config(rawConfig)
        expect(original.issues).toBe(undefined)

        const serialized = original.toPlainObject(false)
        const restored = new Config(serialized)
        expect(restored.issues).toBe(undefined)
        expect(restored.equals(original)).toBe(true)
    })

    test('OracleConfig rejects non-minute timeframe', () => {
        const config = new OracleConfig({...oracleContractRaw, timeframe: 300001})
        expect(config.issues).toContainEqual(expect.stringContaining('Timeframe should be minutes in milliseconds'))
    })
})
