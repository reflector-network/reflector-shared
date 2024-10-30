/*eslint-disable no-undef */
const crypto = require('crypto')
const nock = require('nock')
const {Keypair} = require('@stellar/stellar-sdk')
const Config = require('../models/configs/config')
const {buildOracleInitTransaction, buildUpdateTransaction, buildOraclePriceUpdateTransaction, buildSubscriptionsInitTransaction, buildSubscriptionTriggerTransaction, buildSubscriptionChargeTransaction, buildDAOInitTransaction} = require('../index')
const Asset = require('../models/assets/asset')
const Node = require('../models/node')
const {normalizeTimestamp} = require('../utils/timestamp-helper')
const ContractTypes = require('../models/configs/contract-type')

//Configure Mock Server to return 503 for all requests
beforeEach(() => {
    nock('http://bad.rpc.com')
        .persist()
        .post(() => true)
        .reply(503)
    nock('http://good.rpc.com')
        .persist()
        .post(() => true)
        .reply(200, {
            "jsonrpc": "2.0",
            "id": 8675309,
            "result": {
                "transactionData": "AAAAAAAAAAIAAAAGAAAAAcwD/nT9D7Dc2LxRdab+2vEUF8B+XoN7mQW21oxPT8ALAAAAFAAAAAEAAAAHy8vNUZ8vyZ2ybPHW0XbSrRtP7gEWsJ6zDzcfY9P8z88AAAABAAAABgAAAAHMA/50/Q+w3Ni8UXWm/trxFBfAfl6De5kFttaMT0/ACwAAABAAAAABAAAAAgAAAA8AAAAHQ291bnRlcgAAAAASAAAAAAAAAAAg4dbAxsGAGICfBG3iT2cKGYQ6hK4sJWzZ6or1C5v6GAAAAAEAHfKyAAAFiAAAAIgAAAAAAAAAAw==",
                "minResourceFee": "90353",
                "events": [
                    "AAAAAQAAAAAAAAAAAAAAAgAAAAAAAAADAAAADwAAAAdmbl9jYWxsAAAAAA0AAAAgzAP+dP0PsNzYvFF1pv7a8RQXwH5eg3uZBbbWjE9PwAsAAAAPAAAACWluY3JlbWVudAAAAAAAABAAAAABAAAAAgAAABIAAAAAAAAAACDh1sDGwYAYgJ8EbeJPZwoZhDqEriwlbNnqivULm/oYAAAAAwAAAAM=",
                    "AAAAAQAAAAAAAAABzAP+dP0PsNzYvFF1pv7a8RQXwH5eg3uZBbbWjE9PwAsAAAACAAAAAAAAAAIAAAAPAAAACWZuX3JldHVybgAAAAAAAA8AAAAJaW5jcmVtZW50AAAAAAAAAwAAAAw="
                ],
                "results": [
                    {
                        "auth": [],
                        "xdr": "AAAAAwAAAAw="
                    }
                ],
                "cost": {
                    "cpuInsns": "1635562",
                    "memBytes": "1295756"
                },
                "latestLedger": 2552139
            }
        })
})

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
            "fee": 10000000,
            "oracleId": "CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW",
            "period": 86400000,
            "timeframe": 300000
        },
        "CBMZO5MRIBFL457FBK5FEWZ4QJTYL3XWID7QW7SWDSDOQI5H4JN7XPZU": {
            type: ContractTypes.ORACLE,
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
            "contractId": "CBMZO5MRIBFL457FBK5FEWZ4QJTYL3XWID7QW7SWDSDOQI5H4JN7XPZU",
            "period": 86400000,
            "timeframe": 300000
        },
        "CBFZZVW5SKMVTXKHHQKGOLLHYTOVNSYA774GCROOBMYAKEYCP4THNEXQ": {
            type: ContractTypes.SUBSCRIPTIONS,
            "admin": "GC5GG65IUN7MLRGYXLT4GDQ4YY5TQJ5YIVVBIIKSUSFLSPTQFHRZZXHZ",
            "baseFee": 100,
            "fee": 10000000,
            "token": "CDBBDS5FN46XAVGD5IRKJIK4I7KGGSFI7R2KLXG32QQQELHPTIZS26BW",
            "contractId": "CBFZZVW5SKMVTXKHHQKGOLLHYTOVNSYA774GCROOBMYAKEYCP4THNEXQ"
        },
        "CDB7K2IT4NXDV66BGOESQSSTGVJXZWDGA3DM6P3U2W435IBY6U7GVUII": {
            type: ContractTypes.DAO,
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

const oracleContract = 'CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW'
const subscriptoionsContract = 'CBFZZVW5SKMVTXKHHQKGOLLHYTOVNSYA774GCROOBMYAKEYCP4THNEXQ'
const daoContract = 'CDB7K2IT4NXDV66BGOESQSSTGVJXZWDGA3DM6P3U2W435IBY6U7GVUII'

const sorobanRpc = ['http://good.rpc.com']

const account = {
    accountId: () => 'GCEBYD3K3IYSYLK5EQEK72RVAH2AHZUYSFFG4IOXUS5AOINLMXJRMDRA',
    sequence: 0
}


account.sequenceNumber = () => account.sequence.toString()
account.incrementSequenceNumber = () => {
    account.sequence++
}

const defaultDecimals = 14

test('buildOracleInitTransaction', async () => {
    const currentConfig = new Config(rawConfig)
    const config = currentConfig.contracts.get(oracleContract)
    const transaction = await buildOracleInitTransaction({
        config,
        network: 'testnet',
        sorobanRpc,
        account,
        maxTime: new Date(normalizeTimestamp(Date.now(), 1000) + 10000),
        decimals: defaultDecimals,
        fee: 1000000
    })
    expect(transaction).toBeDefined()
    account.incrementSequenceNumber()
}, 10000)

test('buildOracleUpdateTransaction', async () => {
    const currentConfig = new Config(rawConfig)
    const updateConfigs = []
    {//update period
        const newConfig = new Config(rawConfig)
        newConfig.contracts.get(oracleContract).period = 9999999
        updateConfigs.push(newConfig)
    }
    {//add asset
        const newConfig = new Config(rawConfig)
        newConfig.contracts.get(oracleContract).assets.push(new Asset(2, 'TEST'))
        updateConfigs.push(newConfig)
    }
    {//add node
        const newConfig = new Config(rawConfig)
        newConfig.nodes.set('GBP5VTXZF5C43SNXBUEVIXWKX4K6KJ6PAEKGRJWEY55EK3LGJI3PQSVV', new Node({
            "pubkey": "GBP5VTXZF5C43SNXBUEVIXWKX4K6KJ6PAEKGRJWEY55EK3LGJI3PQSVV",
            "url": "ws://some.node.com",
            "domain": "node2.com"
        }))
        updateConfigs.push(newConfig)
    }
    {//remove node
        const newConfig = new Config(rawConfig)
        newConfig.nodes.delete('GCR6ZOFMKDWX5OMUDQZHQWD2FEE4WCWQJOBMRZRQM5BVTPKJ7LL35TBF')
        updateConfigs.push(newConfig)
    }
    for (const newConfig of updateConfigs) {
        const transaction = await buildUpdateTransaction({
            currentConfig,
            newConfig,
            timestamp: 1,
            network: 'testnet',
            sorobanRpc,
            account,
            maxTime: new Date(normalizeTimestamp(Date.now(), 1000) + 10000),
            fee: 1000000
        })
        expect(transaction).toBeDefined()
        expect(transaction).not.toBeNull()
    }
    account.incrementSequenceNumber()
}, 10000)

test('buildOraclePriceUpdateTransaction', async () => {
    const currentConfig = new Config(rawConfig)
    const contract = currentConfig.contracts.get(oracleContract)
    const transaction = await buildOraclePriceUpdateTransaction({
        contractId: oracleContract,
        network: 'testnet',
        sorobanRpc,
        account,
        admin: contract.admin,
        timestamp: 100000,
        prices: [1n, 2n, 3n],
        fee: contract.fee,
        maxTime: new Date(normalizeTimestamp(Date.now(), 1000) + 10000)
    })
    expect(transaction).toBeDefined()
    account.incrementSequenceNumber()
}, 10000)


test('buildSubscriptionsInitTransaction', async () => {
    const currentConfig = new Config(rawConfig)
    const config = currentConfig.contracts.get(subscriptoionsContract)
    const transaction = await buildSubscriptionsInitTransaction({
        contractId: subscriptoionsContract,
        config,
        network: 'testnet',
        sorobanRpc,
        account,
        maxTime: new Date(normalizeTimestamp(Date.now(), 1000) + 10000),
        fee: 1000000
    })
    expect(transaction).toBeDefined()
    account.incrementSequenceNumber()
}, 10000)

test('buildSubscriptionsUpdateTransaction', async () => {
    const currentConfig = new Config(rawConfig)
    const updateConfigs = []
    {//update fee
        const newConfig = new Config(rawConfig)
        newConfig.contracts.get(subscriptoionsContract).baseFee = 200
        updateConfigs.push(newConfig)
    }
    for (const newConfig of updateConfigs) {
        const transaction = await buildUpdateTransaction({
            currentConfig,
            newConfig,
            timestamp: 1,
            network: 'testnet',
            sorobanRpc,
            account,
            maxTime: new Date(normalizeTimestamp(Date.now(), 1000) + 10000),
            fee: 1000000
        })
        expect(transaction).toBeDefined()
        expect(transaction).not.toBeNull()
    }
    account.incrementSequenceNumber()
}, 10000)

test('buildSubscriptionsTriggerTransaction', async () => {
    const currentConfig = new Config(rawConfig)
    const contract = currentConfig.contracts.get(subscriptoionsContract)
    const transaction = await buildSubscriptionTriggerTransaction({
        contractId: oracleContract,
        network: 'testnet',
        sorobanRpc,
        account,
        admin: contract.admin,
        timestamp: 100000,
        triggerHash: crypto.randomBytes(32),
        fee: contract.fee,
        maxTime: new Date(normalizeTimestamp(Date.now(), 1000) + 10000)
    })
    expect(transaction).toBeDefined()
    account.incrementSequenceNumber()
}, 10000)

test('buildSubscriptionsChargeTransaction', async () => {
    const currentConfig = new Config(rawConfig)
    const contract = currentConfig.contracts.get(subscriptoionsContract)
    const transaction = await buildSubscriptionChargeTransaction({
        contractId: oracleContract,
        network: 'testnet',
        sorobanRpc,
        account,
        admin: contract.admin,
        timestamp: 100000,
        ids: [1n],
        fee: contract.fee,
        maxTime: new Date(normalizeTimestamp(Date.now(), 1000) + 10000)
    })
    expect(transaction).toBeDefined()
    account.incrementSequenceNumber()
}, 10000)


test('buildGlobalConfigUpdateTransaction', async () => {
    const currentConfig = new Config(rawConfig)
    const newConfig = new Config(rawConfig)
    newConfig.systemAccount = Keypair.random().publicKey()
    const transaction = await buildUpdateTransaction({
        currentConfig,
        newConfig,
        timestamp: 1,
        network: 'testnet',
        sorobanRpc,
        account,
        maxTime: new Date(normalizeTimestamp(Date.now(), 1000) + 10000),
        fee: 1000000
    })
    expect(transaction).toBeNull()
    account.incrementSequenceNumber()
}, 10000)


test('buildDAOInitTransaction', async () => {
    const currentConfig = new Config(rawConfig)
    const contract = currentConfig.contracts.get(daoContract)
    const transaction = await buildDAOInitTransaction({
        contractId: daoContract,
        network: 'testnet',
        config: contract,
        sorobanRpc,
        account,
        admin: contract.admin,
        timestamp: 100000,
        fee: contract.fee,
        maxTime: new Date(normalizeTimestamp(Date.now(), 1000) + 10000)
    })
    expect(transaction).toBeDefined()
    account.incrementSequenceNumber()
}, 10000)

test('account sequence', () => {
    //there is total 6 updates, so the sequence should be 6
    expect(account.sequence).toBe(11)
})