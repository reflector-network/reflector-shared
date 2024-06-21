/*eslint-disable no-undef */
const {Keypair} = require('@stellar/stellar-sdk')
const Config = require('../models/configs/config')
const {buildUpdates} = require('../helpers/updates-helper')
const OraclePeriodUpdate = require('../models/updates/oracle/period-update')
const OracleAssetsUpdate = require('../models/updates/oracle/assets-update')
const ContractsUpdate = require('../models/updates/contracts-update')
const NodesUpdate = require('../models/updates/nodes-update')
const WasmUpdate = require('../models/updates/wasm-update')
const ValidationError = require('../models/validation-error')

const rawConfig = {
    "contracts": {
        "CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW": {
            "admin": "GDCOZYKHZXOJANHK3ASICJYEFGYUBSEP3YQKEXXLAGV3BBPLOFLGBAZX",
            "assets": [
                {
                    "code": "BTC",
                    "type": 2
                },
                {
                    "code": "ETH",
                    "type": 2
                },
                {
                    "code": "USDT",
                    "type": 2
                },
                {
                    "code": "XRP",
                    "type": 2
                },
                {
                    "code": "SOL",
                    "type": 2
                },
                {
                    "code": "USDC",
                    "type": 2
                },
                {
                    "code": "ADA",
                    "type": 2
                },
                {
                    "code": "AVAX",
                    "type": 2
                },
                {
                    "code": "DOT",
                    "type": 2
                },
                {
                    "code": "MATIC",
                    "type": 2
                },
                {
                    "code": "LINK",
                    "type": 2
                },
                {
                    "code": "DAI",
                    "type": 2
                },
                {
                    "code": "ATOM",
                    "type": 2
                },
                {
                    "code": "XLM",
                    "type": 2
                },
                {
                    "code": "UNI",
                    "type": 2
                }
            ],
            "baseAsset": {
                "code": "USD",
                "type": 2
            },
            "dataSource": "coinmarketcap",
            "decimals": 14,
            "fee": 10000000,
            "oracleId": "CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW",
            "period": 86400000,
            "timeframe": 300000
        },
        "CBMZO5MRIBFL457FBK5FEWZ4QJTYL3XWID7QW7SWDSDOQI5H4JN7XPZU": {
            "admin": "GD6CN3XGN3ZGND3RSPMAOB3YCO4HXF2TD6W4OMOUL4YOPC7XGBHXPF5K",
            "assets": [
                {
                    "code": "BTCLN:GDPKQ2TSNJOFSEE7XSUXPWRP27H6GFGLWD7JCHNEYYWQVGFA543EVBVT",
                    "type": 1
                },
                {
                    "code": "AQUA:GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
                    "type": 1
                },
                {
                    "code": "yUSDC:GDGTVWSM4MGS4T7Z6W4RPWOCHE2I6RDFCIFZGS3DOA63LWQTRNZNTTFF",
                    "type": 1
                },
                {
                    "code": "FIDR:GBZQNUAGO4DZFWOHJ3PVXZKZ2LTSOVAMCTVM46OEMWNWTED4DFS3NAYH",
                    "type": 1
                },
                {
                    "code": "SSLX:GBHFGY3ZNEJWLNO4LBUKLYOCEK4V7ENEBJGPRHHX7JU47GWHBREH37UR",
                    "type": 1
                },
                {
                    "code": "ARST:GCSAZVWXZKWS4XS223M5F54H2B6XPIIXZZGP7KEAIU6YSL5HDRGCI3DG",
                    "type": 1
                }
            ],
            "baseAsset": {
                "code": "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
                "type": 1
            },
            "dataSource": "pubnet",
            "decimals": 14,
            "fee": 10000000,
            "oracleId": "CBMZO5MRIBFL457FBK5FEWZ4QJTYL3XWID7QW7SWDSDOQI5H4JN7XPZU",
            "period": 86400000,
            "timeframe": 300000
        }
    },
    "minDate": 0,
    "network": "testnet",
    "nodes": {
        "GCR6ZOFMKDWX5OMUDQZHQWD2FEE4WCWQJOBMRZRQM5BVTPKJ7LL35TBF": {
            "pubkey": "GCR6ZOFMKDWX5OMUDQZHQWD2FEE4WCWQJOBMRZRQM5BVTPKJ7LL35TBF",
            "url": "ws://127.0.0.1:3000",
            "domain": "node0.com"
        },
        "GDQFOLVYRNYBTQ2WCXOANDAAM4BSZMLJUEI6CO2PMOCOVDS6SKM2AMRQ": {
            "pubkey": "GDQFOLVYRNYBTQ2WCXOANDAAM4BSZMLJUEI6CO2PMOCOVDS6SKM2AMRQ",
            "url": "ws://127.0.0.1:3001",
            "domain": "node1.com"
        }
    },
    "systemAccount": "GCEBYD3K3IYSYLK5EQEK72RVAH2AHZUYSFFG4IOXUS5AOINLMXJRMDRA",
    "wasmHash": "551723e0178208dd25c950bf78ab5618d47257a594654bbcaaf6cec8dc8c240c"
}

const contractToUpdate = 'CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW'
const contractToUpdate2 = 'CBMZO5MRIBFL457FBK5FEWZ4QJTYL3XWID7QW7SWDSDOQI5H4JN7XPZU'

test('buildUpdates, period test', () => {
    const config = new Config(rawConfig)
    const newConfig = new Config(rawConfig)
    newConfig.contracts.get(contractToUpdate).period = 9999999
    const updates = buildUpdates(1, config, newConfig)
    expect(updates.size).toBe(1)
    expect(updates.get(contractToUpdate)).toBeInstanceOf(OraclePeriodUpdate)
})

test('buildUpdates, new contract test', () => {
    const config = new Config(rawConfig)
    const newConfig = new Config(rawConfig)
    newConfig.contracts.get(contractToUpdate).assets.push({
        "code": "TEST",
        "type": 2
    })
    const updates = buildUpdates(1, config, newConfig)
    expect(updates.size).toBe(1)
    expect(updates.get(contractToUpdate)).toBeInstanceOf(OracleAssetsUpdate)
})

test('buildUpdates, contract remove/add test', () => {

    const config = new Config(rawConfig)
    const newConfig = new Config(rawConfig)
    newConfig.contracts.delete(contractToUpdate)
    let updates = buildUpdates(1, config, newConfig)
    expect(updates.size).toBe(1)
    expect(updates.get(null)).toBeInstanceOf(ContractsUpdate)

    updates = buildUpdates(1, newConfig, config)
    expect(updates.size).toBe(1)
    expect(updates.get(null)).toBeInstanceOf(ContractsUpdate)
})

test('buildUpdates, node remove/add test', () => {

    const config = new Config(rawConfig)
    const newConfig = new Config(rawConfig)
    const nodePubkey = 'GCR6ZOFMKDWX5OMUDQZHQWD2FEE4WCWQJOBMRZRQM5BVTPKJ7LL35TBF'
    newConfig.nodes.delete(nodePubkey)
    let updates = buildUpdates(1, config, newConfig)
    expect(updates.size).toBe(1)
    expect(updates.get(null)).toBeInstanceOf(NodesUpdate)

    updates = buildUpdates(1, newConfig, config)
    expect(updates.size).toBe(1)
    expect(updates.get(null)).toBeInstanceOf(NodesUpdate)
})

test('buildUpdates, update node test', () => {

    const config = new Config(rawConfig)
    const newConfig = new Config(rawConfig)
    const nodePubkey = 'GCR6ZOFMKDWX5OMUDQZHQWD2FEE4WCWQJOBMRZRQM5BVTPKJ7LL35TBF'
    newConfig.nodes.get(nodePubkey).url = 'ws://localhost:3000'
    const updates = buildUpdates(1, config, newConfig)
    expect(updates.size).toBe(1)
    expect(updates.get(null)).toBeInstanceOf(NodesUpdate)
})

test('buildUpdates, update wasm test', () => {
    const config = new Config(rawConfig)
    const newConfig = new Config({
        ...rawConfig,
        ...{
            wasmHash: '551723e0178208dd25c950bf78ab5618d47257a594654bbcaaf6cec8dc8c241c'
        }
    })
    const updates = buildUpdates(1, config, newConfig)
    expect(updates.size).toBe(1)
    expect(updates.get(null)).toBeInstanceOf(WasmUpdate)
})

test('buildUpdates, update wasm test (multiple)', () => {
    try {
        const config = new Config(rawConfig)
        const newConfig = new Config({
            ...rawConfig,
            ...{
                wasmHash: {
                    oracle: '551723e0178208dd25c950bf78ab5618d47257a594654bbcaaf6cec8dc8c241c',
                    subcriptions: '551723e0178208dd25c950bf78ab5618d47257a594654bbcaaf6cec8dc8c241c'
                }
            }
        })
        expect(() => buildUpdates(1, config, newConfig)).toThrow(ValidationError)
    } catch (e) {
        console.log(e)
    }
})

test('buildUpdates, update wasm test (remove)', () => {
    try {
        const config = new Config(rawConfig)
        const newConfig = new Config({
            ...rawConfig,
            ...{
                wasmHash: {
                    oracle: '551723e0178208dd25c950bf78ab5618d47257a594654bbcaaf6cec8dc8c241c'
                }
            }
        })
        expect(() => buildUpdates(1, config, newConfig)).toThrow(ValidationError)
    } catch (e) {
        console.log(e)
    }
})

test('buildUpdates, two fee updates', () => {
    const config = new Config(rawConfig)
    const newConfig = new Config(rawConfig)
    newConfig.contracts.get(contractToUpdate).fee = 9999999
    newConfig.contracts.get(contractToUpdate2).fee = 9999999
    const updates = buildUpdates(1, config, newConfig)
    expect(updates.size).toBe(2)
    expect(updates.get(contractToUpdate)).toBe(null)
    expect(updates.get(contractToUpdate2)).toBe(null)
})

test('buildUpdates, one fee and one asset updates', () => {
    const config = new Config(rawConfig)
    const newConfig = new Config(rawConfig)
    newConfig.contracts.get(contractToUpdate).fee = 9999999
    newConfig.contracts.get(contractToUpdate).assets.push({
        "code": "TEST",
        "type": 2
    })
    //expect error
    const updates = buildUpdates(1, config, newConfig)
    expect(updates.size).toBe(1)
})

test('buildUpdates, two asset updates throws error', () => {
    const config = new Config(rawConfig)
    const newConfig = new Config(rawConfig)
    newConfig.contracts.get(contractToUpdate).fee = 9999999
    newConfig.contracts.get(contractToUpdate2).assets.push({
        "code": "TEST",
        "type": 2
    })
    expect(() => buildUpdates(1, config, newConfig)).toThrow(ValidationError)
})

test('buildUpdates, change sys account', () => {
    const config = new Config(rawConfig)
    const newConfig = new Config(rawConfig)
    newConfig.systemAccount = Keypair.random().publicKey()
    const update = buildUpdates(1, config, newConfig)
    expect(update.size).toBe(1)
})