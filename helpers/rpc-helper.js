const {rpc} = require('@stellar/stellar-sdk')

/**
 * Per-request deadline. Without it the SDK's fetch client waits indefinitely on a socket that accepts and never
 * answers, and the fail-over never runs.
 */
const rpcTimeout = 15000

//The url that answered last, per configured url list. Without it every request walked the list in configured order, so a
//first url that hangs cost its whole deadline on every request and a node abstained on every tick until that url
//recovered. The ledger reads (helpers/entries-helper.js) and the simulations (client/transaction-builder.js) share it, so
//a fail-over one of them found applies to the other. reflector-node src/utils/rpc-helper.js, node-orchestrator
//utils/request-helper.js and reflector-stellar-connector src/utils.js keep copies of their own. Each node reads and
//simulates on its own configured urls, so the preference changes which of them answers, not what a payload is built
//from, and a simulation result is normalised onto a fixed grid either way
const lastGoodUrls = new Map()
//distinct url lists one process uses: one per network, and a node runs on one network
const maxRememberedUrlLists = 16
//a preference is dropped this long after it was set, so the configured order - the primary first - is tried again: a
//node that failed over once would otherwise stay on a secondary that lags the primary long after the primary recovered
const urlPreferenceTtl = 10 * 60 * 1000

/**
 * @param {string} url - soroban rpc url
 * @returns {rpc.Server} a server whose every request carries rpcTimeout
 */
function createRpcServer(url) {
    const server = new rpc.Server(url, {allowHttp: true, timeout: rpcTimeout})
    //sdk 17.0.1 forwards only the headers from the constructor options; the deadline has to live on the http client
    server.httpClient.defaults.timeout = rpcTimeout
    return server
}

/**
 * @param {string[]|Iterable<string>|string} urls - configured urls, in whatever form a caller passed them
 * @returns {string[]} urls as an array, unchanged if it already was one
 */
function __toUrlList(urls) {
    if (Array.isArray(urls))
        return urls
    if (typeof urls !== 'string' && typeof urls?.[Symbol.iterator] === 'function')
        return Array.from(urls)
    return [urls]
}

/**
 * @param {string[]|Iterable<string>|string} urls - configured urls
 * @returns {string[]} the url that answered last first, then the others in configured order; the configured order
 * alone once the preference is older than urlPreferenceTtl
 */
function orderByLastGood(urls) {
    urls = __toUrlList(urls)
    const key = urls.join('\n')
    const preferred = lastGoodUrls.get(key)
    const index = preferred ? urls.indexOf(preferred.url) : -1
    if (index < 0)
        return urls
    if (Date.now() - preferred.since >= urlPreferenceTtl) {
        lastGoodUrls.delete(key)
        return urls
    }
    //only the first occurrence moves: a url listed twice is still asked twice, so a failing request makes as many
    //attempts as it did without the preference
    return [urls[index], ...urls.slice(0, index), ...urls.slice(index + 1)]
}

/**
 * @param {string[]|Iterable<string>|string} urls - configured urls
 * @param {string} url - the url that answered
 */
function rememberGoodUrl(urls, url) {
    urls = __toUrlList(urls)
    const key = urls.join('\n')
    const previous = lastGoodUrls.get(key)
    //the time is kept while the same url keeps answering, so a preference still expires ten minutes after it was set
    const since = previous && previous.url === url ? previous.since : Date.now()
    //deleted and set again, so the first entry is always the list used longest ago
    lastGoodUrls.delete(key)
    lastGoodUrls.set(key, {url, since})
    if (lastGoodUrls.size > maxRememberedUrlLists)
        lastGoodUrls.delete(lastGoodUrls.keys().next().value)
}

/**
 * Forgets every remembered url. A test seam: nothing outside the tests calls it
 */
function __resetUrlPreference() {
    lastGoodUrls.clear()
}

module.exports = {
    rpcTimeout,
    createRpcServer,
    orderByLastGood,
    rememberGoodUrl,
    __resetUrlPreference
}
