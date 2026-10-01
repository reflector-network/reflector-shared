/*eslint-disable no-undef */
const {getDataHash} = require('../../../helpers/signatures-helper')
const Config = require('../../../models/configs/config')
const WasmHash = require('../../../models/configs/wasm-hash')
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
        config.priceHeartbeat = 3600000
        const configObj = new Config(config)
        expect(configObj.issues).toBe(undefined)
        const rawConfig = configObj.toPlainObject()
        expect(rawConfig.priceHeartbeat).toBe(3600000)
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
        rawConfig.contracts.CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW = oracleBeamContractRaw

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

describe('wasm hash validation', () => {
    test('an uppercase wasm hash is a config issue', () => {
        const config = JSON.parse(JSON.stringify(legacyConfig))
        config.wasmHash = config.wasmHash.toUpperCase()
        const configObj = new Config(config)
        expect(configObj.issues).toHaveLength(1)
        expect(configObj.issues[0]).toContain('Wasm hash is not valid')
    })

    test('a non-hex 64-character string is a config issue', () => {
        const config = JSON.parse(JSON.stringify(legacyConfig))
        config.wasmHash = 'g'.repeat(64)
        expect(new Config(config).issues[0]).toContain('Wasm hash is not valid')
    })

    test('WasmHash.isSameHash ignores case and rejects non-strings', () => {
        expect(WasmHash.isSameHash('ab'.repeat(32), 'AB'.repeat(32))).toBe(true)
        expect(WasmHash.isSameHash('ab'.repeat(32), 'ac'.repeat(32))).toBe(false)
        expect(WasmHash.isSameHash(null, 'ab'.repeat(32))).toBe(false)
    })
})

describe('duplicate assets', () => {
    test('the same asset with a different threshold is a duplicate', () => {
        const config = JSON.parse(JSON.stringify(legacyConfig))
        const contract = config.contracts[Object.keys(config.contracts)[0]]
        contract.assets.push({...contract.assets[0], threshold: 20})
        const configObj = new Config(config)
        expect(configObj.issues).toHaveLength(1)
        expect(configObj.issues[0]).toContain('Duplicate asset found in assets')
    })

    test('the same code under another asset type is not a duplicate', () => {
        const config = JSON.parse(JSON.stringify(legacyConfig))
        const contract = config.contracts[Object.keys(config.contracts)[0]]
        contract.assets.push({type: 1, code: 'XLM'}, {type: 2, code: 'XLM'})
        expect(new Config(config).issues ?? []).toHaveLength(0)
    })
})

describe('heartbeat and timeframe bounds', () => {
    const minute = 60 * 1000

    /**
     * @param {object} [overrides] - top-level fields merged over the fixture
     * @param {number} [timeframe] - timeframe of the fixture's first oracle contract
     * @returns {Config}
     */
    function build(overrides = {}, timeframe = undefined) {
        const config = JSON.parse(JSON.stringify(legacyConfig))
        Object.assign(config, overrides)
        if (timeframe !== undefined)
            config.contracts[Object.keys(config.contracts)[0]].timeframe = timeframe
        return new Config(config)
    }

    test('a heartbeat that JSON parses to Infinity is refused', () => {
        const configObj = build({priceHeartbeat: JSON.parse('1e400')})
        expect(configObj.issues).toEqual(['priceHeartbeat: Price heartbeat should be a finite number'])
        expect(configObj.priceHeartbeat).toBeUndefined()
    })

    test('a huge finite heartbeat is refused, and seven days is the largest accepted', () => {
        expect(build({priceHeartbeat: 1e300}).issues).toEqual(['priceHeartbeat: Price heartbeat should not exceed 604800000 ms'])
        expect(build({priceHeartbeat: 7 * 24 * 60 * minute + 1}).issues).toHaveLength(1)
        expect(build({priceHeartbeat: 7 * 24 * 60 * minute}).issues).toBeUndefined()
    })

    test('a negative heartbeat is refused as non-positive, not as non-finite', () => {
        expect(build({priceHeartbeat: -60000}).issues).toEqual(['priceHeartbeat: Price heartbeat should be positive'])
    })

    test('a timeframe above the heartbeat less two minutes is refused', () => {
        //the fixture's oracles use 5-minute timeframes
        expect(build({priceHeartbeat: 6 * minute}).issues).toEqual([
            'contracts.CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW.timeframe: Timeframe should be at most the price heartbeat minus 120000 ms',
            'contracts.CBMZO5MRIBFL457FBK5FEWZ4QJTYL3XWID7QW7SWDSDOQI5H4JN7XPZU.timeframe: Timeframe should be at most the price heartbeat minus 120000 ms'
        ])
        expect(build({priceHeartbeat: 7 * minute}).issues).toBeUndefined()
    })

    test('without a heartbeat the node default of two hours bounds the timeframe', () => {
        expect(build({}, 118 * minute).issues).toBeUndefined()
        expect(build({}, 119 * minute).issues).toEqual([
            'contracts.CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW.timeframe: Timeframe should be at most the price heartbeat minus 120000 ms'
        ])
    })

    test('a refused heartbeat falls back to the default for the timeframe check', () => {
        //one issue for the heartbeat only: the 5-minute timeframes are within the default two hours
        expect(build({priceHeartbeat: JSON.parse('1e400')}).issues).toHaveLength(1)
    })

    test('a beam contract is bounded like an oracle', () => {
        const config = JSON.parse(JSON.stringify(legacyConfig))
        config.contracts.CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW = {...oracleBeamContractRaw, timeframe: 119 * minute}
        const configObj = new Config(config)
        expect(configObj.contracts.get('CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW')).toBeInstanceOf(OracleBeamConfig)
        expect(configObj.issues).toEqual([
            'contracts.CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW.timeframe: Timeframe should be at most the price heartbeat minus 120000 ms'
        ])
    })

    test('a timeframe given as a numeric string is bounded as well', () => {
        expect(build({}, String(119 * minute)).issues).toEqual([
            'contracts.CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW.timeframe: Timeframe should be at most the price heartbeat minus 120000 ms'
        ])
    })

    test('the heartbeats and timeframes of the local cluster and the consumer fixtures are accepted', () => {
        //reflector-node tests/cluster/utils.js: 10-minute heartbeat, 5-minute oracle and 1-minute beam timeframes
        expect(build({priceHeartbeat: 10 * minute}).issues).toBeUndefined()
        expect(build({priceHeartbeat: 10 * minute}, minute).issues).toBeUndefined()
        //reflector-node tests/cluster/run-cluster.js: 2-hour heartbeat with a 1-minute beam
        expect(build({priceHeartbeat: 120 * minute}, minute).issues).toBeUndefined()
        //three minutes is the smallest heartbeat a 1-minute timeframe allows; the fixture's other oracle keeps 5 minutes
        expect(build({priceHeartbeat: 3 * minute}, minute).issues).toEqual([
            'contracts.CBMZO5MRIBFL457FBK5FEWZ4QJTYL3XWID7QW7SWDSDOQI5H4JN7XPZU.timeframe: Timeframe should be at most the price heartbeat minus 120000 ms'
        ])
    })
})
