const {StrKey} = require('stellar-sdk')
const {sortObjectKeys} = require('../utils/serialization-helper')

class Signature {
    constructor(rawSignature) {
        if (!rawSignature)
            throw new Error('rawSignature is required')
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
     * @type {string}
     */
    signature = null

    /**
     * @type {number}
     */
    nonce = null

    /**
     * @type {boolean}
     */
    rejected = undefined

    __setPubkey(pubkey) {
        if (!pubkey)
            throw new Error('pubkey is required')
        if (!StrKey.isValidEd25519PublicKey(pubkey))
            throw new Error('pubkey is invalid')
        this.pubkey = pubkey
    }

    __setSignature(signature) {
        if (!signature)
            throw new Error('signature is required')
        this.signature = signature
    }

    __setNonce(nonce) {
        if (!nonce)
            throw new Error('nonce is required')
        if (nonce < 1)
            throw new Error('nonce is invalid')
        this.nonce = nonce
    }

    __setRejected(rejected) {
        if (rejected === undefined)
            throw new Error('rejected is required')
        this.rejected = rejected
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