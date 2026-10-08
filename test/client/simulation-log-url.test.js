/*eslint-disable no-undef */
const {inspect} = require('util')

const keyedUrl = 'https://rpc.example/v1/SECRETKEY123/'

jest.mock('@stellar/stellar-sdk', () => {
    const actual = jest.requireActual('@stellar/stellar-sdk')
    class Server {
        constructor(url) {
            this.url = url
            this.httpClient = {defaults: {}}
        }
    }
    return {...actual, rpc: {...actual.rpc, Server}}
})

const {makeServerRequest} = require('../../client/transaction-builder')
const {__resetUrlPreference} = require('../../helpers/rpc-helper')

/**
 * @param {string} url - request url
 * @returns {Error} a request failure the way the sdk's axios client reports it: the full url in the config, the response
 * and, from some providers, the message
 */
function axiosFailure(url) {
    const err = new Error(`Request failed with status code 403 for ${url}`)
    err.isAxiosError = true
    err.code = 'ERR_BAD_REQUEST'
    err.config = {url, method: 'post', headers: {}, data: '{"jsonrpc":"2.0"}'}
    err.response = {status: 403, config: {url}}
    return err
}

//an rpc provider key often lives in the url path (https://provider/<key>): a url that reaches a log line or a thrown
//error keeps its scheme, host and port only
describe('an rpc url is reported as its scheme, host and port only', () => {
    let debug
    let error

    beforeEach(() => {
        __resetUrlPreference()
        debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
        error = jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    test('the debug line, the error lines and the thrown error carry the host, never the key in the path', async () => {
        const thrown = await makeServerRequest([keyedUrl], server => {
            throw axiosFailure(server.url)
        }).catch(e => e)

        expect(thrown.message).toBe('Failed to make request.')
        expect(thrown.cause).toHaveLength(1)
        const [cause] = thrown.cause
        expect(cause.message).toBe('Request failed with status code 403 for https://rpc.example')
        expect(cause.code).toBe('ERR_BAD_REQUEST')
        expect(cause.status).toBe(403)
        expect(cause.config).toBeUndefined()
        expect(inspect(thrown, {depth: 10})).not.toContain('SECRETKEY123')

        expect(debug.mock.calls).toEqual([
            ['Failed to build update. Soroban RPC url: https://rpc.example, error: Request failed with status code 403 for https://rpc.example']
        ])
        expect(error).toHaveBeenCalledTimes(1)
        expect(error.mock.calls[0][0]).toBe(cause)
        expect(inspect(error.mock.calls, {depth: 10})).not.toContain('SECRETKEY123')
    })
})
