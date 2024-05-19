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
 * @returns {{hash: string, admin: string, lastTimestamp: BigInt, prices: BigInt[]}}
 */
async function getContractState(contractId, sorobanRpc) {
    const key = xdr.ScVal.scvLedgerKeyContractInstance()
    const contractDataRequestFn = async (server) => await server.getContractData(contractId, key, SorobanRpc.Durability.Persistent)
    const contractData = await makeRequest(contractDataRequestFn, sorobanRpc)
    if (!contractData)
        throw new Error('Failed to get contract data. Check contract id and network.')

    const hash = contractData.val.contractData().val().instance().executable().wasmHash().toString('hex')
    const {admin, lastTimestamp, assetsLength} = tryGetParsedStateData(contractData.val.contractData().val().instance().storage())

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

    return {
        hash,
        admin,
        lastTimestamp,
        prices
    }
}

function tryGetParsedStateData(storage) {
    const data = {}
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