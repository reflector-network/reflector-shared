/*eslint-disable no-undef */
const {inspect} = require('util')

const keyedUrl = 'https://rpc.example/v1/SECRETKEY123/'

//a server whose every request fails the way the sdk's axios client reports it: the full url in the config, the response
//and, from some providers, the message
jest.mock('@stellar/stellar-sdk', () => {
    const actual = jest.requireActual('@stellar/stellar-sdk')
    class Server {
        constructor(url) {
            this.url = url
            this.httpClient = {defaults: {}}
        }

        getLedgerEntries() {
            const err = new Error(`Request failed with status code 403 for ${this.url}`)
            err.isAxiosError = true
            err.code = 'ERR_BAD_REQUEST'
            err.config = {url: this.url, method: 'post', headers: {}, data: '{"jsonrpc":"2.0"}'}
            err.response = {status: 403, config: {url: this.url}}
            return Promise.reject(err)
        }
    }
    return {...actual, rpc: {...actual.rpc, Server}}
})

const {getContractInstance} = require('../../helpers/entries-helper')
const {safeUrl, cutUrls} = require('../../utils/log-url-helper')

const contractId = 'CB7YJYJCYH5IJVZEVF63FPFV2G3SRG72DWITTYOMT4MXMTC3AGPIPSIC'

//an rpc provider key often lives in the url path (https://provider/<key>): a url that reaches a log line or a thrown
//error keeps its scheme, host and port only
describe('an rpc url is reported as its scheme, host and port only', () => {
    let warn

    beforeEach(() => {
        warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
        warn.mockRestore()
    })

    test('safeUrl keeps the scheme, host and port, and drops userinfo, path, query and fragment', () => {
        expect(safeUrl(keyedUrl)).toBe('https://rpc.example')
        expect(safeUrl('https://user:pass@rpc.example:8443/v1/SECRETKEY123/?key=abc#frag')).toBe('https://rpc.example:8443')
        expect(safeUrl('not a url')).toBeUndefined()
        expect(safeUrl(undefined)).toBeUndefined()
    })

    test('cutUrls cuts every http and websocket url in a string and leaves file urls alone', () => {
        expect(cutUrls(`request to ${keyedUrl} failed`)).toBe('request to https://rpc.example failed')
        expect(cutUrls('POST https://user:pass@rpc.example:8443/v1/SECRETKEY123/?key=abc#frag timed out'))
            .toBe('POST https://rpc.example:8443 timed out')
        expect(cutUrls('wss://node.example:30347/SECRETKEY123 closed')).toBe('wss://node.example:30347 closed')
        expect(cutUrls('at file:///app/helpers/entries-helper.js:10:5')).toBe('at file:///app/helpers/entries-helper.js:10:5')
    })

    test('the retry warnings and the thrown error carry the host, never the key in the path', async () => {
        const error = await getContractInstance(contractId, [keyedUrl]).catch(e => e)

        expect(error.message).toBe('Failed to invoke RPC method on all provided URLs')
        expect(error.cause.errAggr).toHaveLength(1)
        const [{url, err}] = error.cause.errAggr
        expect(url).toBe('https://rpc.example')
        expect(err.message).toBe('Request failed with status code 403 for https://rpc.example')
        expect(err.code).toBe('ERR_BAD_REQUEST')
        expect(err.status).toBe(403)
        expect(err.config).toBeUndefined()
        expect(inspect(error, {depth: 10})).not.toContain('SECRETKEY123')

        expect(warn).toHaveBeenCalledTimes(2)
        for (const [entry] of warn.mock.calls) {
            expect(entry.err[0].url).toBe('https://rpc.example')
            expect(inspect(entry, {depth: 10})).not.toContain('SECRETKEY123')
        }
    })
})
