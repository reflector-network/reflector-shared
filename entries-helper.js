const {xdr, SorobanRpc, StrKey, scValToBigInt, Address, XdrLargeInt} = require('@stellar/stellar-sdk')

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
 * Returns hash of the data
 * @param {string} contractId - contract id
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @returns {{hash: string, admin: string, lastTimestamp: BigInt, prices: BigInt[], isInitialized: boolean}}
 */
async function getContractState(contractId, sorobanRpc) {
    const contractState = {
        hash: null,
        lastTimestamp: 0n,
        prices: [],
        isInitialized: false,
        admin: null
    }

    const key = xdr.ScVal.scvLedgerKeyContractInstance()
    const contractDataRequestFn = async (server) => await server.getContractData(contractId, key, SorobanRpc.Durability.Persistent)
    const contractData = await makeRequest(contractDataRequestFn, sorobanRpc)
    if (!contractData)
        return contractState

    const hash = contractData.val.contractData().val().instance().executable().wasmHash().toString('hex')
    const {admin, lastTimestamp, assetsLength} = tryGetParsedStateData(contractData.val.contractData().val().instance().storage())

    contractState.admin = admin
    contractState.lastTimestamp = lastTimestamp
    contractState.hash = hash
    contractState.isInitialized = !!admin

    if (assetsLength > 0) {
        const assetsEntriesKeys = []
        const keys = []
        for (let i = 0; i < assetsLength; i++) {
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

        const prices = Array(assetsLength).fill(0n)

        for (const assetEntry of assetsEntries) {
            const key = scValToBigInt(assetEntry.key.value().key())
            const value = scValToBigInt(assetEntry.val.value().val())
            const assetIndex = keys.indexOf(key)
            if (assetIndex)
                prices[keys.indexOf(key)] = value
        }
        contractState.prices = prices
    }

    return contractState
}

function tryGetParsedStateData(storage) {
    const data = {admin: null, lastTimestamp: 0n, assetsLength: 0}
    if (!storage)
        return data
    for (const entry of storage) {
        const key = entry.key().value().toString()
        if (key === 'admin')
            data.admin = StrKey.encodeEd25519PublicKey(entry.val().address().accountId().ed25519())
        else if (key === 'last_timestamp')
            data.lastTimestamp = scValToBigInt(entry.val())
        else if (key === 'assets') {
            data.assetsLength = [...entry.val().value()].length
        }
        if (data.admin && data.lastTimestamp && data.assetsLength)
            break
    }
    return data
}

module.exports = {
    getContractState
}