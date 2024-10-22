const {xdr, SorobanRpc, scValToBigInt, scValToNative, Address, XdrLargeInt, contract} = require('@stellar/stellar-sdk')

async function makeRequest(requestFn, sorobanRpc) {
    for (const serverRpc of sorobanRpc) {
        try {
            const server = new SorobanRpc.Server(serverRpc, {allowHttp: true})
            return await requestFn(server)
        } catch (e) {
            console.error(`Failed to make request to ${serverRpc}: ${e}`)
        }
    }
}

function encodePriceRecordKey(timestamp, assetIndex) {
    return (BigInt(timestamp) << 64n) | BigInt(assetIndex)
}

/**
 * Returns contract instance
 * @param {string} contractId - contract id
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @returns {xdr.ScContractInstance|null}
 */
async function getContractInstance(contractId, sorobanRpc) {
    const key = xdr.ScVal.scvLedgerKeyContractInstance()
    const contractDataRequestFn = async (server) => await server.getContractData(contractId, key, SorobanRpc.Durability.Persistent)
    const contractData = await makeRequest(contractDataRequestFn, sorobanRpc)
    if (!contractData)
        return null
    return contractData.val.contractData().val().instance()
}

/**
 * Returns native storage
 * @param {xdr.ScMapEntry[]} values - values
 * @returns {object}
 */
function getNativeStorage(values) {
    const storage = {}
    if (values)
        for (const value of values) {
            const key = scValToNative(value.key())
            const val = scValToNative(value.val())
            storage[key] = val
        }
    return storage
}

/**
 * Returns hash of the data
 * @param {string} contractId - contract id
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @returns {{hash: string, admin: string, lastTimestamp: BigInt, prices: BigInt[], isInitialized: boolean}}
 */
async function getOracleContractState(contractId, sorobanRpc) {
    const contractState = {
        hash: null,
        lastTimestamp: 0n,
        prices: [],
        isInitialized: false,
        admin: null
    }

    const instance = await getContractInstance(contractId, sorobanRpc)
    if (!instance)
        return contractState

    const hash = instance.executable().wasmHash().toString('hex')
    const {admin, last_timestamp: lastTimestamp, assets} = getNativeStorage(instance.storage())

    contractState.admin = admin
    contractState.lastTimestamp = lastTimestamp || 0n
    contractState.hash = hash
    contractState.isInitialized = !!admin

    if (!assets || assets.length < 1 || !lastTimestamp)
        return contractState

    const assetsEntriesKeys = []
    const keys = []
    for (let i = 0; i < assets.length; i++) {
        const priceRecordKey = encodePriceRecordKey(lastTimestamp, i)
        keys.push(priceRecordKey)
        assetsEntriesKeys.push(xdr.LedgerKey.contractData(
            new xdr.LedgerKeyContractData({
                contract: Address.fromString(contractId).toScAddress(),
                key: new XdrLargeInt('u128', priceRecordKey).toU128(),
                durability: xdr.ContractDataDurability.temporary()
            })
        ))
    }

    const assetsEntriesRequestFn = async (server) => (await server.getLedgerEntries(...assetsEntriesKeys))
    const assetsEntries = (await makeRequest(assetsEntriesRequestFn, sorobanRpc))?.entries || []

    const prices = Array(assets.length).fill(0n)

    for (const assetEntry of assetsEntries) {
        const key = scValToBigInt(assetEntry.key.value().key())
        const value = scValToBigInt(assetEntry.val.value().val())
        const assetIndex = keys.indexOf(key)
        if (assetIndex)
            prices[keys.indexOf(key)] = value
    }
    contractState.prices = prices

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
    const {admin, last: lastSubscriptionId} = getNativeStorage(instance.storage())

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
    } = getNativeStorage(instance.storage())

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

module.exports = {
    getSubscriptionsContractState,
    getOracleContractState,
    getContractState,
    getSubscriptions,
    getSubscriptionById
}