import { Keypair, xdr } from 'stellar-base'
import crypto from 'crypto'
import { ValidationError } from './models/index.js'
import { sortObjectKeys } from './utils/serialization-helper.js'

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
export function verifySignature(publicKey, signature, hash) {
    const kp = Keypair.fromPublicKey(publicKey)
    return kp.verify(Buffer.from(hash, 'hex'), Buffer.from(signature, 'hex'))
}

/**
 * Returns hash of the data
 * @param {any} data
 * @param {number} nonce
 * @param {boolean} [rejected]
 * @returns {string}
 */
export function getHash(pubkey, data, nonce, rejected = false) {
    let hashData = structuredClone(data)
    if (rejected)
        hashData.rejected = true
    hashData.nonce = nonce
    hashData = sortObjectKeys(hashData)
    return crypto.createHash('sha256').update(`${pubkey}:${JSON.stringify(hashData)}`).digest('hex')
}

/**
 * Returns hash of the data
 * @param {any} data
 * @param {string} [pubkey]
 * @returns {string}
 */
export function getDataHash(data, pubkey = null) {
    if (data instanceof Object)
        data = sortObjectKeys(data)
    return crypto.createHash('sha256').update(`${pubkey ? `${pubkey}:` : ''}${JSON.stringify(data)}`).digest('hex')
}