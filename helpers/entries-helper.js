const {OracleClient} = require('@reflector/oracle-client')
const {xdr, rpc, scValToNative, Address, XdrLargeInt, nativeToScVal, scValToBigInt} = require('@stellar/stellar-sdk')

async function makeRequest(requestFn, sorobanRpc) {
    if (!sorobanRpc || sorobanRpc.length < 1)
        throw new Error('No soroban rpc urls provided')
    for (const serverRpc of sorobanRpc) {
        try {
            const server = new rpc.Server(serverRpc, {allowHttp: true})
            return await requestFn(server)
        } catch (e) {
            console.error(`Failed to make request to ${serverRpc}: ${e}`)
        }
    }
}

/**
 * Returns contract instance
 * @param {string} contractId - contract id
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @returns {xdr.ScContractInstance|null}
 */
async function getContractInstance(contractId, sorobanRpc) {
    const key = xdr.ScVal.scvLedgerKeyContractInstance()
    const contractDataRequestFn = async (server) => await server.getContractData(contractId, key, rpc.Durability.Persistent)
    const contractData = await makeRequest(contractDataRequestFn, sorobanRpc)
    if (!contractData)
        return null
    return contractData.val.contractData().val().instance()
}

/**
 * Returns native storage
 * @param {xdr.ScMapEntry[]} values - values
 * @param {any[]} keys - props to extract
 * @returns {object}
 */
function getNativeStorage(values, keys) {
    const storage = {}
    if (values && keys.length > 0)
        for (const value of values) {
            const key = scValToNative(value.key())
            const keyIndex = keys.indexOf(key)
            if (keyIndex < 0)
                continue
            const val = scValToNative(value.val())
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
            .then(response => response.result.retval.value())
    }

    const instance = await getContractInstance(contractId, sorobanRpc)
    if (!instance)
        return contractState

    const hash = instance.executable().wasmHash().toString('hex')
    const {admin, last_timestamp: lastTimestamp, expiration, protocol} = getNativeStorage(instance.storage(), ['admin', 'last_timestamp', 'expiration', 'protocol'])

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

    const hash = instance.executable().wasmHash().toString('hex')
    const {admin, last: lastSubscriptionId} = getNativeStorage(instance.storage(), ['admin', 'last'])

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

    const hash = instance.executable().wasmHash().toString('hex')
    const {
        admin,
        last_timestamp: lastTimestamp,
        last: lastSubscriptionsId,
        last_ballot_id: lastBallotId,
        last_unlock: lastUnlock
    } = getNativeStorage(instance.storage(), ['admin', 'last_timestamp', 'last', 'last_ballot_id', 'last_unlock'])

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
                    entry.strKey = entry.key.toXDR('base64') //cache xdr for filtering
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
            durability: xdr.ContractDataDurability.persistent()
        })
    )
    contractData.strKey = contractData.toXDR('base64') //cache xdr for filtering
    return contractData
}

function __getSubscriptionObject(subscriptionEntry) {
    if (!subscriptionEntry)
        return null
    const id = scValToNative(subscriptionEntry.val.value().key())
    const data = scValToNative(subscriptionEntry.val.value().val())
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
    return getNativeStorage(instance.storage(), keys)
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
                durability: keys[i].persistent ? xdr.ContractDataDurability.persistent() : xdr.ContractDataDurability.temporary()
            })
        )
        entriesKeys.push(entryKey)
        entriesMap.set(
            entryKey.toXDR('base64'),
            keys[i].key.toString()
        )
    }

    const assetsEntriesRequestFn = async (server) => (await server.getLedgerEntries(...entriesKeys))
    const entries = (await makeRequest(assetsEntriesRequestFn, sorobanRpc))?.entries || []

    const result = {}
    for (const entry of entries) {
        const originalKey = entriesMap.get(entry.key.toXDR('base64'))
        if (!originalKey)
            continue
        const value = scValToNative(entry.val.value().val())
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
