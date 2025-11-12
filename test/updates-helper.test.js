/*eslint-disable no-undef */
const {Keypair} = require('@stellar/stellar-sdk')
const Config = require('../models/configs/config')
const {buildUpdates} = require('../helpers/updates-helper')
const OracleHistoryRetetionPeriodUpdate = require('../models/updates/oracle/history-period-update')
const OracleAssetsUpdate = require('../models/updates/oracle/assets-update')
const ContractsUpdate = require('../models/updates/contracts-update')
const NodesUpdate = require('../models/updates/nodes-update')
const WasmUpdate = require('../models/updates/wasm-update')
const ValidationError = require('../models/validation-error')
const DAODepositsUpdate = require('../models/updates/dao/deposits-update')
const SubscriptionsFeeUpdate = require('../models/updates/subscriptions/base-fee-update')
const OracleCacheSizeUpdate = require('../models/updates/oracle/cache-size-update')
const OracleFeeConfigUpdate = require('../models/updates/oracle/fee-config-update')
const OracleInvocationCostsUpdate = require('../models/updates/oracle/invocation-costs-update')

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
        },
        "CBFZZVW5SKMVTXKHHQKGOLLHYTOVNSYA774GCROOBMYAKEYCP4THNEXQ": {
            "type": "subscriptions",
            "admin": "GC5GG65IUN7MLRGYXLT4GDQ4YY5TQJ5YIVVBIIKSUSFLSPTQFHRZZXHZ",
            "baseFee": 100,
            "fee": 10000000,
            "token": "CDBBDS5FN46XAVGD5IRKJIK4I7KGGSFI7R2KLXG32QQQELHPTIZS26BW",
            "contractId": "CBFZZVW5SKMVTXKHHQKGOLLHYTOVNSYA774GCROOBMYAKEYCP4THNEXQ"
        },
        "CDB7K2IT4NXDV66BGOESQSSTGVJXZWDGA3DM6P3U2W435IBY6U7GVUII": {
            "type": "dao",
            "admin": "GAU4KKD63RYJ36OEV4IPVBQ5NEQOC5L3SQSS7GX2JRG3SQHAMFTQTF2G",
            "initAmount": 100000000000,
            "startDate": 1630000000,
            "fee": 10000000,
            "depositParams": {
                "0": 100000,
                "1": 10000000,
                "2": 10000,
                "3": 10000000
            },
            "token": "CDBBDS5FN46XAVGD5IRKJIK4I7KGGSFI7R2KLXG32QQQELHPTIZS26BW",
            "contractId": "CDB7K2IT4NXDV66BGOESQSSTGVJXZWDGA3DM6P3U2W435IBY6U7GVUII",
            "developer": "GCEBYD3K3IYSYLK5EQEK72RVAH2AHZUYSFFG4IOXUS5AOINLMXJRMDRA"
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
        },
        "GAL3OTXUY6SWY7BSS6EB43RY4EYH5LHJPKVANA6ACMLJEX7IVTJXEL26": {
            "pubkey": "GAL3OTXUY6SWY7BSS6EB43RY4EYH5LHJPKVANA6ACMLJEX7IVTJXEL26",
            "url": "ws://127.0.0.1:3002",
            "domain": "node2.com"
        }
    },
    "systemAccount": "GCEBYD3K3IYSYLK5EQEK72RVAH2AHZUYSFFG4IOXUS5AOINLMXJRMDRA",
    "wasmHash": "551723e0178208dd25c950bf78ab5618d47257a594654bbcaaf6cec8dc8c240c"
}

const oracleToUpdate = 'CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW'
const oracleToUpdate2 = 'CBMZO5MRIBFL457FBK5FEWZ4QJTYL3XWID7QW7SWDSDOQI5H4JN7XPZU'
const subcriptions = 'CBFZZVW5SKMVTXKHHQKGOLLHYTOVNSYA774GCROOBMYAKEYCP4THNEXQ'
const dao = 'CDB7K2IT4NXDV66BGOESQSSTGVJXZWDGA3DM6P3U2W435IBY6U7GVUII'

describe('updates helper', () => {

    test('buildUpdates, period test', () => {
        const config = new Config(rawConfig)
        const newConfig = new Config(rawConfig)
        newConfig.contracts.get(oracleToUpdate).period = 9999999
        const updates = buildUpdates(1, config, newConfig)
        expect(updates.size).toBe(1)
        expect(updates.get(oracleToUpdate)).toBeInstanceOf(OracleHistoryRetetionPeriodUpdate)
    })

    test('buildUpdates, new contract test', () => {
        const config = new Config(rawConfig)
        const newConfig = new Config(rawConfig)
        newConfig.contracts.get(oracleToUpdate).assets.push({
            "code": "TEST",
            "type": 2
        })
        const updates = buildUpdates(1, config, newConfig)
        expect(updates.size).toBe(1)
        expect(updates.get(oracleToUpdate)).toBeInstanceOf(OracleAssetsUpdate)
    })

    test('buildUpdates, contract remove/add test', () => {

        const config = new Config(rawConfig)
        const newConfig = new Config(rawConfig)
        newConfig.contracts.delete(oracleToUpdate)
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
        const secondPubkey = 'GDQFOLVYRNYBTQ2WCXOANDAAM4BSZMLJUEI6CO2PMOCOVDS6SKM2AMRQ'
        newConfig.nodes.get(secondPubkey).domain = 'newdomain.com'
        const updates = buildUpdates(1, config, newConfig)
        expect(updates.size).toBe(1)
        expect(updates.get(null)).toBeInstanceOf(NodesUpdate)
    })

    test('buildUpdates, update two nodes test', () => {

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

    test('buildUpdates, update subscriptions fee', () => {
        const config = new Config(rawConfig)
        const newConfig = new Config(rawConfig)
        newConfig.contracts.get(subcriptions).baseFee = 9999999
        const updates = buildUpdates(1, config, newConfig)
        expect(updates.size).toBe(1)
        expect(updates.get(subcriptions)).toBeInstanceOf(SubscriptionsFeeUpdate)
    })

    test('buildUpdates, add dao contract', () => {
        const config = new Config(rawConfig)
        config.contracts.delete(dao)
        const newConfig = new Config(rawConfig)
        const updates = buildUpdates(1, config, newConfig)
        expect(updates.size).toBe(1)
        expect(updates.get(null)).toBeInstanceOf(ContractsUpdate)
    })

    test('buildUpdates, update dao deposits', () => {
        const config = new Config(rawConfig)
        const newConfig = new Config(rawConfig)
        newConfig.contracts.get(dao).depositParams.forEach((value, key) => {
            newConfig.contracts.get(dao).depositParams.set(key, value + 1)
        })
        const updates = buildUpdates(1, config, newConfig)
        expect(updates.size).toBe(1)
        expect(updates.get(dao)).toBeInstanceOf(DAODepositsUpdate)
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
        const config = new Config(rawConfig)
        const newConfig = new Config(rawConfig)
        newConfig.wasmHash = new Map()
        expect(() => buildUpdates(1, config, newConfig)).toThrow(ValidationError)
    })

    test('buildUpdates, two fee updates', () => {
        const config = new Config(rawConfig)
        const newConfig = new Config(rawConfig)
        newConfig.contracts.get(oracleToUpdate).fee = 9999999
        newConfig.contracts.get(oracleToUpdate2).fee = 9999999
        const updates = buildUpdates(1, config, newConfig)
        expect(updates.size).toBe(2)
        expect(updates.get(oracleToUpdate)).toBe(null)
        expect(updates.get(oracleToUpdate2)).toBe(null)
    })

    test('buildUpdates, one fee and one asset updates', () => {
        const config = new Config(rawConfig)
        const newConfig = new Config(rawConfig)
        newConfig.contracts.get(oracleToUpdate).fee = 9999999
        newConfig.contracts.get(oracleToUpdate).assets.push({
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
        newConfig.contracts.get(oracleToUpdate).fee = 9999999
        newConfig.contracts.get(oracleToUpdate2).assets.push({
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

    test('buildUpdates, change cache size', () => {
        const config = new Config(rawConfig)
        const newConfig = new Config(rawConfig)
        newConfig.contracts.get(oracleToUpdate).cacheSize = 9999999
        const update = buildUpdates(1, config, newConfig)
        expect(update.size).toBe(1)
        expect(update.get(oracleToUpdate)).toBeInstanceOf(OracleCacheSizeUpdate)
    })

    test('buildUpdates, change fee config', () => {
        const config = new Config(rawConfig)
        const newConfig = new Config(rawConfig)
        newConfig.contracts.get(oracleToUpdate).feeConfig = {
            token: 'GDU4KKD63RYJ36OEV4IPVBQ5NEQOC5L3SQSS7GX2JRG3SQHAMFTQTF2G',
            fee: 10000000n
        }
        const update = buildUpdates(1, config, newConfig)
        expect(update.size).toBe(1)
        expect(update.get(oracleToUpdate)).toBeInstanceOf(OracleFeeConfigUpdate)
    })

    test('buildUpdates, change invocation costs', () => {
        const config = new Config(rawConfig)
        const newConfig = new Config(rawConfig)
        newConfig.contracts.get(oracleToUpdate).invocationCosts = [1000n, 2000n, 3000n, 4000n, 5000n]
        const update = buildUpdates(1, config, newConfig)
        expect(update.size).toBe(1)
        expect(update.get(oracleToUpdate)).toBeInstanceOf(OracleInvocationCostsUpdate)
    })
})