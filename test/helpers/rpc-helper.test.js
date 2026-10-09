/*eslint-disable no-undef */
jest.mock('@stellar/stellar-sdk', () => {
    const actual = jest.requireActual('@stellar/stellar-sdk')
    class Server {
        constructor(url, options) {
            this.url = url
            this.options = options
            this.httpClient = {defaults: {}}
        }
    }
    return {...actual, rpc: {...actual.rpc, Server}}
})

const {rpcTimeout, createRpcServer, orderByLastGood, rememberGoodUrl, __resetUrlPreference} = require('../../helpers/rpc-helper')

beforeEach(() => {
    __resetUrlPreference()
})

describe('createRpcServer', () => {
    test('a server allows http and carries the 15 s deadline on its http client', () => {
        const server = createRpcServer('http://rpc-a')
        expect(rpcTimeout).toBe(15000)
        expect(server.url).toBe('http://rpc-a')
        expect(server.options).toEqual({allowHttp: true, timeout: 15000})
        expect(server.httpClient.defaults.timeout).toBe(15000)
    })
})

describe('the last-good-url preference', () => {
    test('a list nobody answered for keeps its configured order', () => {
        expect(orderByLastGood(['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
    })

    test('the url that answered last comes first, the others keep their order', () => {
        rememberGoodUrl(['a', 'b', 'c'], 'c')
        expect(orderByLastGood(['a', 'b', 'c'])).toEqual(['c', 'a', 'b'])
    })

    test('each url list keeps its own preference', () => {
        rememberGoodUrl(['a', 'b'], 'b')
        expect(orderByLastGood(['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
    })

    test('a Set and a single string are accepted as lists', () => {
        rememberGoodUrl(new Set(['a', 'b']), 'b')
        expect(orderByLastGood(new Set(['a', 'b']))).toEqual(['b', 'a'])
        expect(orderByLastGood('a')).toEqual(['a'])
    })

    test('only the first occurrence of a preferred url listed twice moves to the front', () => {
        rememberGoodUrl(['b', 'a', 'c', 'a'], 'a')
        expect(orderByLastGood(['b', 'a', 'c', 'a'])).toEqual(['a', 'b', 'c', 'a'])
    })

    test('a preference expires ten minutes after it was set; answering again does not extend it', () => {
        const now = jest.spyOn(Date, 'now').mockReturnValue(1_000_000)
        rememberGoodUrl(['a', 'b'], 'b')
        now.mockReturnValue(1_000_000 + 5 * 60_000)
        rememberGoodUrl(['a', 'b'], 'b')
        now.mockReturnValue(1_000_000 + 10 * 60_000 - 1)
        expect(orderByLastGood(['a', 'b'])).toEqual(['b', 'a'])
        now.mockReturnValue(1_000_000 + 10 * 60_000)
        expect(orderByLastGood(['a', 'b'])).toEqual(['a', 'b'])
        now.mockRestore()
    })

    test('at most 16 lists are remembered; the one that answered longest ago is dropped first', () => {
        for (let i = 0; i < 17; i++)
            rememberGoodUrl([`a${i}`, `b${i}`], `b${i}`)
        expect(orderByLastGood(['a0', 'b0'])).toEqual(['a0', 'b0'])
        expect(orderByLastGood(['a1', 'b1'])).toEqual(['b1', 'a1'])
        expect(orderByLastGood(['a16', 'b16'])).toEqual(['b16', 'a16'])
    })

    test('__resetUrlPreference forgets every list', () => {
        rememberGoodUrl(['a', 'b'], 'b')
        __resetUrlPreference()
        expect(orderByLastGood(['a', 'b'])).toEqual(['a', 'b'])
    })
})
