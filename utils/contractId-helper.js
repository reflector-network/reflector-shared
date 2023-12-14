const {StrKey, hash, xdr} = require('stellar-sdk')

/**
 * @typedef {import('stellar-sdk').Asset} Asset
 */

const passphraseMapping = {}

/**
 * Resolve network id hash from a passphrase (with pre-caching)
 * @param {String} networkPassphrase - network passphrase
 * @return {Buffer}
 */
function getNetworkIdHash(networkPassphrase) {
    let networkId = passphraseMapping[networkPassphrase]
    if (!networkId) {
        networkId = passphraseMapping[networkPassphrase] = hash(Buffer.from(networkPassphrase))
    }
    return networkId
}

/**
 * Encode ContractId for a given wrapped Stellar classic asset
 * @param {Asset} asset - asset
 * @param {String} networkPassphrase - network passphrase
 * @return {String}
 */
function encodeAssetContractId(asset, networkPassphrase) {
    const assetContractId = new xdr.HashIdPreimageContractId({
        networkId: getNetworkIdHash(networkPassphrase),
        contractIdPreimage: xdr.ContractIdPreimage.contractIdPreimageFromAsset(asset.toXDRObject())
    })
    const preimage = xdr.HashIdPreimage.envelopeTypeContractId(assetContractId)
    return StrKey.encodeContract(hash(preimage.toXDR()))
}

/**
 * Check if a contract id is valid
 * @param {string} contractId - The contract id to check
 * @returns {boolean} - True if the contract id is valid, false otherwise
 */
function isValidContractId(contractId) {
    try {
        if (!contractId)
            return false
        StrKey.decodeContract(contractId)
        return true
    } catch (e) {
        return false
    }
}

module.exports = {
    getNetworkIdHash,
    encodeAssetContractId,
    isValidContractId
}