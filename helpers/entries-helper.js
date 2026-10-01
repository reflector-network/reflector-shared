const {OracleClient} = require('@reflector/oracle-client')
const {xdr, rpc, scValToNative, Address, XdrLargeInt, nativeToScVal} = require('@stellar/stellar-sdk')
const {safeUrl, safeError} = require('../utils/log-url-helper')

/**
 * Per-request deadline. Without it the SDK's fetch client waits indefinitely on a socket that accepts and never
 * answers, and the fail-over below never runs.
 */
const rpcTimeout = 15000

//The url that answered last, per configured url list. Without it every request walked the list in configured order, so a
//first url that hangs cost its whole deadline on every request and a node abstained on every tick until that url
//recovered. The same helper lives in oracle-client src/rpc-helper.js and reflector-node
//src/utils/rpc-helper.js. Each node already reads from its own configured urls, so the preference changes which of
//them answers, not what a payload is built from
const lastGoodUrls = new Map()
//distinct url lists one process uses: one per network, and a node runs on one network
const maxRememberedUrlLists = 16
//a preference is dropped this long after it was set, so the configured order - the primary first - is tried again: a
//node that failed over once would otherwise stay on a secondary that lags the primary long after the primary recovered
const urlPreferenceTtl = 10 * 60 * 1000

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

async function makeRequest(requestFn, sorobanRpc) {
    if (!sorobanRpc || sorobanRpc.length < 1)
        throw new Error('No soroban rpc urls provided')
    for (let i = 0; i < 3; i++) { //max 3 attempts
        const errAggr = []
        try {
            for (const serverRpc of orderByLastGood(sorobanRpc)) {
                try {
                    const server = new rpc.Server(serverRpc, {allowHttp: true, timeout: rpcTimeout})
                    //sdk 17.0.1 forwards only the headers from the constructor options; the deadline has to live on the http client
                    server.httpClient.defaults.timeout = rpcTimeout
                    const result = await requestFn(server)
                    rememberGoodUrl(sorobanRpc, serverRpc)
                    return result
                } catch (e) {
                    //as the url and the failure may be logged - here and by every consumer that logs the error thrown
                    //below - with no key a provider put in the url path
                    errAggr.push({url: safeUrl(serverRpc) || 'invalid url', err: safeError(e)})
                }
            }
            throw new Error('Failed to invoke RPC method on all provided URLs', {cause: {errAggr}})
        } catch (e) {
            if (i === 2) {
                throw e
            }
            console.warn({msg: 'RPC call failed, retrying', attempt: i + 1, err: e?.cause?.errAggr || e.message})
        }
        await new Promise(resolve => setTimeout(resolve, 300))
    }
}

/**
 * Returns contract instance
 * @param {string} contractId - contract id
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @returns {xdr.ScContractInstance|null}
 */
async function getContractInstance(contractId, sorobanRpc) {
    const key = xdr.LedgerKey.contractData(
        new xdr.LedgerKeyContractData({
            contract: Address.fromString(contractId).toScAddress(),
            key: xdr.ScVal.scvLedgerKeyContractInstance(),
            durability: xdr.ContractDataDurability.persistent
        })
    )
    //getLedgerEntries returns {entries: []} for a missing contract instead of throwing,
    //so "contract not deployed" stays distinguishable from "RPC outage" upstream
    const contractInstanceRequestFn = async (server) => await server.getLedgerEntries(key)
    const result = await makeRequest(contractInstanceRequestFn, sorobanRpc)
    const entries = result?.entries || []
    if (entries.length < 1)
        return null
    return entries[0].val.contractData.val.instance
}

/**
 * Returns native storage
 * @param {xdr.ScMapEntry[]} values - values
 * @param {any[]} keys - props to extract
 * @returns {object}
 */
function getNativeStorage(values, keys) {
    const storage = {}
    keys = [...keys] //avoid keys mutation
    if (values && keys.length > 0)
        for (const value of values) {
            const key = scValToNative(value.key)
            const keyIndex = keys.indexOf(key)
            if (keyIndex < 0)
                continue
            const val = scValToNative(value.val)
            storage[key.toString()] = val
            //remove found key
            keys.splice(keyIndex, 1)
            if (keys.length < 1)
                break //all keys found
        }
    return storage
}

/**
 * Returns oracle contract state and wasm version
 * @param {string} contractId - contract id
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @param {Account} account - account to build transaction
 * @param {{fee: number, networkPassphrase: string}} txOptions - transaction options
 * @returns {{hash: string, admin: string, lastTimestamp: BigInt, isInitialized: boolean, assetTtls: BigInt[], protocol: number}}
 */
async function getOracleContractState(contractId, sorobanRpc, account, txOptions) {
    const contractState = {
        hash: null,
        lastTimestamp: 0n,
        isInitialized: false,
        admin: null,
        expiration: [],
        protocol: null,
        version: null
    }

    if (account) {
        const oracleClient = new OracleClient(txOptions.networkPassphrase, sorobanRpc, contractId)
        contractState.version = await oracleClient
            .version(account, {...txOptions, simulationOnly: true})
            .then(response => response.result.retval.value)
    }

    const instance = await getContractInstance(contractId, sorobanRpc)
    if (!instance)
        return contractState

    const hash = instance.executable.wasmHash.toString()
    const {admin, last_timestamp: lastTimestamp, expiration, protocol} = getNativeStorage(instance.storage, ['admin', 'last_timestamp', 'expiration', 'protocol'])

    contractState.admin = admin
    contractState.lastTimestamp = lastTimestamp || 0n
    contractState.hash = hash
    contractState.isInitialized = !!admin
    contractState.expiration = expiration || []
    contractState.protocol = protocol || null

    return contractState
}

/**
 * Returns hash of the data
 * @param {string} contractId - contract id
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @returns {{hash: string, admin: string, lastSubscriptionId: BigInt, isInitialized: boolean}}
 */
async function getSubscriptionsContractState(contractId, sorobanRpc) {
    const contractState = {
        hash: null,
        lastSubscriptionId: 0n,
        isInitialized: false,
        admin: null
    }

    const instance = await getContractInstance(contractId, sorobanRpc)
    if (!instance)
        return contractState

    const hash = instance.executable.wasmHash.toString()
    const {admin, last: lastSubscriptionId} = getNativeStorage(instance.storage, ['admin', 'last'])

    contractState.admin = admin
    contractState.lastSubscriptionId = lastSubscriptionId
    contractState.hash = hash
    contractState.isInitialized = !!admin

    return contractState
}

async function getContractState(contractId, sorobanRpc) {
    const contractState = {
        hash: null,
        isInitialized: false,
        lastTimestamp: 0n,
        lastSubscriptionsId: 0n,
        lastBallotId: 0n,
        lastUnlock: 0n,
        admin: null
    }

    const instance = await getContractInstance(contractId, sorobanRpc)
    if (!instance)
        return contractState

    const hash = instance.executable.wasmHash.toString()
    const {
        admin,
        last_timestamp: lastTimestamp,
        last: lastSubscriptionsId,
        last_ballot_id: lastBallotId,
        last_unlock: lastUnlock
    } = getNativeStorage(instance.storage, ['admin', 'last_timestamp', 'last', 'last_ballot_id', 'last_unlock'])

    contractState.admin = admin
    contractState.hash = hash
    contractState.isInitialized = !!admin
    contractState.lastTimestamp = lastTimestamp || 0n
    contractState.lastSubscriptionsId = lastSubscriptionsId || 0n
    contractState.lastBallotId = lastBallotId || 0n
    contractState.lastUnlock = lastUnlock || 0n

    return contractState
}

/**
 * Returns subscriptions
 * @param {string} contractId - contract id
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @param {BigInt} max - max index
 * @param {number} batchSize - batch size
 * @returns {any[]}
 */
async function getSubscriptions(contractId, sorobanRpc, max, batchSize = 50) {
    const subscriptions = []
    let from = 0n
    while (from < max) {
        let to = from + BigInt(batchSize)
        if (to > max)
            to = max

        const subscriptionsKeys = []
        for (let i = from + 1n; i <= to; i++)
            subscriptionsKeys.push(__getSubscriptionKey(contractId, i))

        const subscriptionsEntriesRequestFn = async (server) => (await server.getLedgerEntries(...subscriptionsKeys))
        const subscriptionsEntriesResult = (await makeRequest(subscriptionsEntriesRequestFn, sorobanRpc))
        const subscriptionsEntries = subscriptionsEntriesResult?.entries || []

        for (const subscriptionKey of subscriptionsKeys) {
            const subscriptionIndex = subscriptionsEntries.findIndex(entry => {
                if (!entry.strKey)
                    entry.strKey = entry.key.toXdr('base64') //cache xdr for filtering
                return entry.strKey === subscriptionKey.strKey
            })
            if (subscriptionIndex < 0) { //not found
                subscriptions.push(null)
                continue
            }
            const subscription = subscriptionsEntries.splice(subscriptionIndex, 1)[0] //remove from array to speed up search
            subscriptions.push(__getSubscriptionObject(subscription))
        }
        from = to
        if (from >= max)
            break
    }

    return subscriptions
}

/**
 * Returns subscription by id
 * @param {string} contractId - contract id
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @param {BigInt} id - subscription id
 * @returns {any}
 */
async function getSubscriptionById(contractId, sorobanRpc, id) {
    const key = __getSubscriptionKey(contractId, id)
    const subscriptionEntryRequestFn = async (server) => (await server.getLedgerEntries(...[key]))
    const subscriptionEntries = (await makeRequest(subscriptionEntryRequestFn, sorobanRpc))?.entries || []
    if (subscriptionEntries.length < 1)
        return null
    return __getSubscriptionObject(subscriptionEntries[0])
}

function __getSubscriptionKey(contractId, id) {
    const contractData = xdr.LedgerKey.contractData(
        new xdr.LedgerKeyContractData({
            contract: Address.fromString(contractId).toScAddress(),
            key: new XdrLargeInt('u64', id.toString()).toU64(),
            durability: xdr.ContractDataDurability.persistent
        })
    )
    contractData.strKey = contractData.toXdr('base64') //cache xdr for filtering
    return contractData
}

function __getSubscriptionObject(subscriptionEntry) {
    if (!subscriptionEntry)
        return null
    const id = scValToNative(subscriptionEntry.val.value.key)
    const data = scValToNative(subscriptionEntry.val.value.val)
    return {id, ...data}
}

/**
 * @param {string} contractId - contract id
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @param {any[]} keys - storage keys to fetch
 * @returns {Promise<object>}
 */
async function getContractInstanceEntries(contractId, sorobanRpc, keys) {
    const instance = await getContractInstance(contractId, sorobanRpc)
    if (!instance)
        return {}
    return getNativeStorage(instance.storage, keys)
}

/**
 * @param {string} contractId - contract id
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @param {{key: any, type: string, persistent: boolean}[]} keys - storage keys to fetch
 * @returns {Promise<object>}
 */
async function getContractEntries(contractId, sorobanRpc, keys) {
    const entriesMap = new Map()
    const entriesKeys = []
    for (let i = 0; i < keys.length; i++) {
        const entryKey = xdr.LedgerKey.contractData(
            new xdr.LedgerKeyContractData({
                contract: Address.fromString(contractId).toScAddress(),
                key: nativeToScVal(keys[i].key, keys[i].type),
                durability: keys[i].persistent ? xdr.ContractDataDurability.persistent : xdr.ContractDataDurability.temporary
            })
        )
        entriesKeys.push(entryKey)
        entriesMap.set(
            entryKey.toXdr('base64'),
            keys[i].key.toString()
        )
    }

    const entriesRequestFn = async (server) => (await server.getLedgerEntries(...entriesKeys))
    const entries = (await makeRequest(entriesRequestFn, sorobanRpc))?.entries || []

    const result = {}
    for (const entry of entries) {
        const originalKey = entriesMap.get(entry.key.toXdr('base64'))
        if (!originalKey)
            continue
        const value = scValToNative(entry.val.value.val)
        result[originalKey.toString()] = value
    }
    return result
}

module.exports = {
    getSubscriptionsContractState,
    getOracleContractState,
    getContractState,
    getSubscriptions,
    getSubscriptionById,
    getContractInstance,
    getNativeStorage,
    getContractInstanceEntries,
    getContractEntries
}
