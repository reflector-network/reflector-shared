/*eslint-disable no-undef */
//Every transaction this package builds, from fixed inputs and a fixed simulation, pinned by hash. Written while the
//client still came from oracle-client 7.2.0-rc2: moving the client in must not change a single transaction
const {Account, Networks} = require('@stellar/stellar-sdk')

const mockSimulation = {restore: false}

jest.mock('@stellar/stellar-sdk', () => {
    const actual = jest.requireActual('@stellar/stellar-sdk')
    const transactionData = () => new actual.SorobanDataBuilder().setResources(1_234_567, 3_000, 2_000).setResourceFee(55_555)
    class Server {
        constructor(url) {
            this.url = url
            this.httpClient = {defaults: {}}
        }

        //a fresh, already parsed simulation on every call: the builder rounds its resources in place
        simulateTransaction() {
            const response = {
                _parsed: true,
                id: '1',
                latestLedger: 1,
                events: [],
                transactionData: transactionData(),
                minResourceFee: '55555',
                result: {auth: [], retval: actual.xdr.ScVal.scvVoid()}
            }
            if (mockSimulation.restore)
                response.restorePreamble = {minResourceFee: '77777', transactionData: transactionData()}
            return Promise.resolve(response)
        }
    }
    return {...actual, rpc: {...actual.rpc, Server}}
})

//a wasm update reads each contract's current hash first; every contract reports the hash the fixture starts from
jest.mock('../../helpers/entries-helper', () => ({
    ...jest.requireActual('../../helpers/entries-helper'),
    getContractState: () => Promise.resolve({hash: '551723e0178208dd25c950bf78ab5618d47257a594654bbcaaf6cec8dc8c240c'})
}))

const Config = require('../../models/configs/config')
const DAODepositsUpdate = require('../../models/updates/dao/deposits-update')
const {legacyConfig, oracleBeamContractRaw, daoContractRaw} = require('../constants')
const {
    buildOracleInitTransaction,
    buildOraclePriceUpdateTransaction,
    buildSubscriptionsInitTransaction,
    buildSubscriptionTriggerTransaction,
    buildSubscriptionChargeTransaction,
    buildDAOInitTransaction,
    buildDAODepositsUpdateTransaction,
    buildDAOVoteTransaction,
    buildDAOUnlockTransaction,
    buildUpdateTransaction
} = require('../../index')

const network = Networks.TESTNET
const sorobanRpc = ['http://rpc.invalid']
const maxTime = 1_800_000_060 //seconds
const fee = 1_000_000
const timestamp = 1_800_000_000_000
const oracleId = 'CBMZO5MRIBFL457FBK5FEWZ4QJTYL3XWID7QW7SWDSDOQI5H4JN7XPZU'
const beamId = 'CADGRYMISAODBSKAG7JQVSNLAN6U724UKFKQPIAOBADYJFG24QI6SGAW'
const subscriptionsId = 'CBFZZVW5SKMVTXKHHQKGOLLHYTOVNSYA774GCROOBMYAKEYCP4THNEXQ'
const daoId = 'CDB7K2IT4NXDV66BGOESQSSTGVJXZWDGA3DM6P3U2W435IBY6U7GVUII'
const newNode = 'GBP5VTXZF5C43SNXBUEVIXWKX4K6KJ6PAEKGRJWEY55EK3LGJI3PQSVV'

const clone = value => JSON.parse(JSON.stringify(value))

/**
 * @returns {object} the legacy fixture plus a beam and a DAO contract under ids of their own
 */
function rawConfig() {
    const raw = clone(legacyConfig)
    raw.contracts[beamId] = {...clone(oracleBeamContractRaw), contractId: beamId}
    raw.contracts[daoId] = {...clone(daoContractRaw), contractId: daoId}
    return raw
}

/**
 * @returns {Account} a fresh account, so every build starts from the same sequence number
 */
function account() {
    return new Account(legacyConfig.systemAccount, '100')
}

/**
 * @returns {Promise<Object<string, string>>} the hash of one transaction of every kind
 */
async function buildAll() {
    const config = new Config(rawConfig())
    const oracle = config.contracts.get(oracleId)
    const subscriptions = config.contracts.get(subscriptionsId)
    const dao = config.contracts.get(daoId)
    const common = {network, sorobanRpc, maxTime, fee}
    const update = mutate => {
        const raw = rawConfig()
        mutate(raw)
        return buildUpdateTransaction({...common, account: account(), timestamp, currentConfig: new Config(rawConfig()), newConfig: new Config(raw)})
    }
    const deposits = new Map([...dao.depositParams].map(([key, value]) => [key, value + 1]))
    const built = {
        oracleInit: await buildOracleInitTransaction({...common, account: account(), config: oracle, decimals: 14}),
        oraclePriceUpdate: await buildOraclePriceUpdateTransaction({...common, account: account(), contractId: oracleId, admin: oracle.admin, timestamp, prices: [1n, 2n]}),
        subscriptionsInit: await buildSubscriptionsInitTransaction({...common, account: account(), config: subscriptions}),
        subscriptionsTrigger: await buildSubscriptionTriggerTransaction({...common, account: account(), contractId: subscriptionsId, admin: subscriptions.admin, timestamp, ids: [1n, 2n], triggerHash: Buffer.alloc(32, 7)}),
        subscriptionsCharge: await buildSubscriptionChargeTransaction({...common, account: account(), contractId: subscriptionsId, admin: subscriptions.admin, timestamp, ids: [1n, 2n]}),
        daoInit: await buildDAOInitTransaction({...common, account: account(), config: dao}),
        daoDeposits: await buildDAODepositsUpdateTransaction(sorobanRpc, account(), {fee, networkPassphrase: network, timebounds: {minTime: 0, maxTime}}, new DAODepositsUpdate(timestamp, daoId, dao.admin, deposits)),
        daoVote: await buildDAOVoteTransaction({...common, account: account(), contractId: daoId, admin: dao.admin, timestamp, ballotId: 3, accepted: true}),
        daoUnlock: await buildDAOUnlockTransaction({...common, account: account(), contractId: daoId, admin: dao.admin, timestamp, developer: dao.developer, operators: [...config.nodes.keys()]}),
        updateOracleAssets: await update(raw => raw.contracts[oracleId].assets.push({code: 'TEST', type: 2})),
        updateOraclePeriod: await update(raw => {
            raw.contracts[oracleId].period = 99_999_999
        }),
        updateOracleFeeConfig: await update(raw => {
            raw.contracts[beamId].feeConfig = {token: 'CDBBDS5FN46XAVGD5IRKJIK4I7KGGSFI7R2KLXG32QQQELHPTIZS26BW', fee: '1000000'}
        }),
        updateOracleCacheSize: await update(raw => {
            raw.contracts[oracleId].cacheSize = 1000
        }),
        updateNodes: await update(raw => {
            raw.nodes[newNode] = {pubkey: newNode, url: 'ws://some.node.com', domain: 'node3.com'}
        }),
        updateWasm: await update(raw => {
            raw.wasmHash = 'aa'.repeat(32)
        }),
        updateSubscriptionsFee: await update(raw => {
            raw.contracts[subscriptionsId].baseFee = 200
        }),
        updateDaoDeposits: await update(raw => {
            const params = raw.contracts[daoId].depositParams
            for (const key of Object.keys(params))
                params[key] += 1
        })
    }
    return Object.fromEntries(Object.entries(built).map(([kind, tx]) => [kind, tx.hashHex]))
}

beforeAll(() => {
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})
})

afterEach(() => {
    mockSimulation.restore = false
})

describe('every transaction the package builds is pinned', () => {
    test('one transaction of every kind', async () => {
        expect(await buildAll()).toMatchSnapshot()
    })

    test('a footprint restore the simulation demands in place of a price update', async () => {
        mockSimulation.restore = true
        const tx = await buildOraclePriceUpdateTransaction({network, sorobanRpc, maxTime, fee, account: account(), contractId: oracleId, admin: 'GD6CN3XGN3ZGND3RSPMAOB3YCO4HXF2TD6W4OMOUL4YOPC7XGBHXPF5K', timestamp, prices: [1n, 2n]})
        expect(tx.transaction.isRestore).toBe(true)
        expect(tx.transaction.operations[0].type).toBe('restoreFootprint')
        expect(tx.hashHex).toMatchSnapshot()
    })

    test('the same inputs build the same transactions twice', async () => {
        expect(await buildAll()).toEqual(await buildAll())
    })
})
