const crypto = require('crypto')
const {Keypair, xdr} = require('stellar-sdk')
const ValidationError = require('./models/validation-error')
const {sortObjectKeys} = require('./utils/serialization-helper')

function getDecoratedSignature(signature) {
    try {
        const signatureBuffer = Buffer.from(signature, 'hex')
        const decoratedSignature = xdr.DecoratedSignature.fromXDR(signatureBuffer, 'hex')
        return decoratedSignature
    } catch (err) {
        console.error(err)
        throw new ValidationError('Invalid signature format')
    }
}

/**
 * Verifies signature
 * @param {string} publicKey
 * @param {string} signature
 * @param {string} hash
 * @returns {boolean}
 */
function verifySignature(publicKey, signature, hash) {
    const kp = Keypair.fromPublicKey(publicKey)
    return kp.verify(Buffer.from(hash, 'hex'), Buffer.from(signature, 'hex'))
}

/**
 * Returns hash of the data
 * @param {any} data
 * @param {string} pubkey
 * @param {number} nonce
 * @param {boolean} [rejected]
 * @returns {string}
 */
function getSignaturePayloadHash(data, pubkey, nonce, rejected = false) {
    if (!pubkey)
        throw new Error('pubkey is required')
    if (!nonce)
        throw new Error('nonce is required')
    const hashData = structuredClone(data)
    hashData.nonce = nonce
    if (rejected)
        hashData.rejected = true
    return getDataHash(hashData, pubkey)
}

/**
 * Returns hash of the data
 * @param {any} data
 * @param {string} [pubkey]
 * @returns {string}
 */
function getDataHash(data, pubkey = null) {
    if (typeof data === 'object')
        data = sortObjectKeys(data)
    return crypto.createHash('sha256').update(`${pubkey ? `${pubkey}:` : ''}${JSON.stringify(data)}`).digest('hex')
}

module.exports = {
    getDecoratedSignature,
    verifySignature,
    getSignaturePayloadHash,
    getDataHash
}