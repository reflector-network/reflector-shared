const {StrKey} = require('@stellar/stellar-sdk')
const {sortObjectKeys} = require('../utils/serialization-helper')
const ValidationError = require('./validation-error')

const signaturePattern = /^[0-9a-fA-F]{128}$/

class Signature {
    constructor(rawSignature) {
        if (!rawSignature || typeof rawSignature !== 'object')
            throw new ValidationError('rawSignature is required')
        this.__setPubkey(rawSignature.pubkey)
        this.__setSignature(rawSignature.signature)
        this.__setNonce(rawSignature.nonce)
        this.__setRejected(rawSignature.rejected)
    }

    /**
     * @type {string}
     */
    pubkey = null

    /**
     * Hex-encoded ed25519 signature over the signature payload hash
     * @type {string}
     */
    signature = null

    /**
     * @type {number}
     */
    nonce = null

    /**
     * True when this signature is a rejection vote; the flag is part of the signed payload
     * @type {boolean}
     */
    rejected = false

    __setPubkey(pubkey) {
        if (!pubkey)
            throw new ValidationError('pubkey is required')
        if (!StrKey.isValidEd25519PublicKey(pubkey))
            throw new ValidationError('pubkey is invalid')
        this.pubkey = pubkey
    }

    __setSignature(signature) {
        if (!signature)
            throw new ValidationError('signature is required')
        if (typeof signature !== 'string' || !signaturePattern.test(signature))
            throw new ValidationError('signature must be 128 hex characters')
        this.signature = signature
    }

    __setNonce(nonce) {
        if (nonce === undefined || nonce === null)
            throw new ValidationError('nonce is required')
        if (!Number.isSafeInteger(nonce) || nonce < 1)
            throw new ValidationError('nonce must be a positive integer')
        this.nonce = nonce
    }

    __setRejected(rejected) {
        if (rejected !== undefined && typeof rejected !== 'boolean')
            throw new ValidationError('rejected must be a boolean')
        this.rejected = rejected === true
    }

    toPlainObject() {
        const rawObject = {
            pubkey: this.pubkey,
            signature: this.signature,
            nonce: this.nonce
        }
        if (this.rejected)
            rawObject.rejected = this.rejected
        return sortObjectKeys(rawObject)
    }
}

module.exports = Signature
