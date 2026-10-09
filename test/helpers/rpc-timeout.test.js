/*eslint-disable no-undef */
const http = require('http')
const nock = require('nock')


const mockServers = []
jest.mock('@stellar/stellar-sdk', () => {
    const actual = jest.requireActual('@stellar/stellar-sdk')
    class Server extends actual.rpc.Server {
        constructor(url, options) {
            super(url, options)
            mockServers.push({options, server: this})
        }
    }
    return {...actual, rpc: {...actual.rpc, Server}}
})

const {rpc} = require('@stellar/stellar-sdk')
const {getContractInstance} = require('../../helpers/entries-helper')

describe('RPC requests carry a deadline', () => {
    //every rpc.Server built in this file is recorded, the one the deadline test builds by hand with no timeout option
    //included: forgetting them before each test keeps the constructor check on the servers its own request built, in
    //any order
    beforeEach(() => {
        mockServers.length = 0
    })

    afterEach(() => {
        nock.cleanAll()
    })

    test('every rpc.Server is constructed with a 15 s timeout', async () => {
        nock('http://good.rpc.com')
            .persist()
            .post(() => true)
            .reply(200, {jsonrpc: '2.0', id: 1, result: {entries: [], latestLedger: 1}})

        const instance = await getContractInstance('CB7YJYJCYH5IJVZEVF63FPFV2G3SRG72DWITTYOMT4MXMTC3AGPIPSIC', ['http://good.rpc.com'])

        expect(instance).toBeNull()
        expect(mockServers.length).toBeGreaterThan(0)
        for (const {options, server} of mockServers) {
            expect(options).toEqual({allowHttp: true, timeout: 15000})
            //sdk 17.0.1 ignores the constructor option; the deadline the fetch adapter honours is the one on the http client
            expect(server.httpClient.defaults.timeout).toBe(15000)
        }
    })

    test('a server that accepts and never answers fails at the deadline set on the http client', async () => {
        const silent = http.createServer(() => {})
        await new Promise(resolve => silent.listen(0, '127.0.0.1', resolve))
        try {
            const server = new rpc.Server(`http://127.0.0.1:${silent.address().port}`, {allowHttp: true})
            server.httpClient.defaults.timeout = 300
            const start = Date.now()
            await expect(server.getLatestLedger()).rejects.toThrow(/timeout of 300 ?ms exceeded/)
            expect(Date.now() - start).toBeLessThan(3000)
        } finally {
            silent.closeAllConnections()
            await new Promise(resolve => silent.close(resolve))
        }
    })
})
