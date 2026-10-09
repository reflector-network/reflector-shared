/*eslint-disable no-undef */
const {Account, Keypair, Networks, StrKey} = require('@stellar/stellar-sdk')

const mockRpc = {failing: new Set(), requests: []}

//one server per url for both request kinds: a url in `failing` rejects at once, as a hung url does at its deadline
jest.mock('@stellar/stellar-sdk', () => {
    const actual = jest.requireActual('@stellar/stellar-sdk')
    class Server {
        constructor(url) {
            this.url = url
            this.httpClient = {defaults: {}}
        }

        getLedgerEntries() {
            mockRpc.requests.push(['getLedgerEntries', this.url])
            if (mockRpc.failing.has(this.url))
                return Promise.reject(new Error('timeout of 15000ms exceeded'))
            return Promise.resolve({entries: [], latestLedger: 1})
        }

        simulateTransaction() {
            mockRpc.requests.push(['simulateTransaction', this.url])
            if (mockRpc.failing.has(this.url))
                return Promise.reject(new Error('timeout of 15000ms exceeded'))
            return Promise.resolve({_parsed: true, id: '1', latestLedger: 1, events: [], result: {auth: [], retval: actual.xdr.ScVal.scvVoid()}})
        }
    }
    return {...actual, rpc: {...actual.rpc, Server}}
})

const {getContractInstance} = require('../../helpers/entries-helper')
const {OracleClient} = require('../../client')
const {__resetUrlPreference} = require('../../helpers/rpc-helper')

const urls = ['http://rpc-a', 'http://rpc-b']
const contractId = StrKey.encodeContract(Buffer.alloc(32, 2))

/**
 * @returns {Promise<any>} a version simulation through the client, as getOracleContractState makes one
 */
function simulate() {
    const client = new OracleClient(Networks.TESTNET, urls, contractId)
    const source = new Account(Keypair.random().publicKey(), '1')
    return client.version(source, {fee: 100, networkPassphrase: Networks.TESTNET, timebounds: {minTime: 0, maxTime: 0}, simulationOnly: true})
}

beforeAll(() => {
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
})

beforeEach(() => {
    mockRpc.failing = new Set()
    mockRpc.requests = []
    __resetUrlPreference()
})

describe('ledger reads and simulations share one url preference', () => {
    test('a read that failed over makes the next simulation on the same urls start at the url that answered', async () => {
        mockRpc.failing.add('http://rpc-a')
        await getContractInstance(contractId, urls)
        mockRpc.failing.clear()
        mockRpc.requests = []
        await simulate()
        expect(mockRpc.requests).toEqual([['simulateTransaction', 'http://rpc-b']])
    })

    test('a simulation that failed over makes the next read on the same urls start at the url that answered', async () => {
        mockRpc.failing.add('http://rpc-a')
        await simulate()
        mockRpc.failing.clear()
        mockRpc.requests = []
        await getContractInstance(contractId, urls)
        expect(mockRpc.requests).toEqual([['getLedgerEntries', 'http://rpc-b']])
    })
})
