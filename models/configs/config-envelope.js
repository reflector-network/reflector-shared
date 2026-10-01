const Signature = require('../signature')
const ValidationError = require('../validation-error')
const {sortObjectKeys} = require('../../utils/serialization-helper')
const {verifySignature} = require('../../helpers/signatures-helper')
const Config = require('./config')

/**
 * A config with the votes cast on it. Only `config` (plus each signer's pubkey, nonce and rejected flag) is covered
 * by the signatures; `timestamp` and `allowEarlySubmission` are scheduling fields the orchestrator sets after the vote
 * and are trusted from it, not signed. The node release is to bound that trust by refusing envelopes whose
 * `timestamp` precedes `config.minDate`; this class does not check it.
 */
module.exports = class ConfigEnvelope {
    constructor(rawEnvelope) {
        if (!rawEnvelope)
            throw new ValidationError('rawEnvelope is required')
        this.__setConfig(rawEnvelope.config)
        this.__setSignatures(rawEnvelope.signatures)
        this.__setTimestamp(rawEnvelope.timestamp)
        this.__setAllowEarlySubmission(rawEnvelope.allowEarlySubmission)
    }

    /**
     * @type {Config}
     */
    config = null

    /**
     * @type {Signature[]}
     */
    signatures = []

    /**
     * @type {number}
     */
    timestamp = null

    /**
     * @type {boolean}
     */
    allowEarlySubmission = false

    __setAllowEarlySubmission(allowEarlySubmission) {
        this.allowEarlySubmission = !!allowEarlySubmission
    }

    __setConfig(config) {
        if (!config)
            throw new ValidationError('config is required')
        this.config = new Config(config)
    }

    __setSignatures(signatures) {
        if (!Array.isArray(signatures))
            throw new ValidationError('signatures must be an array')
        for (const rawSignature of signatures) {
            if (!rawSignature || typeof rawSignature !== 'object')
                throw new ValidationError('signature entry must be an object')
            const signature = new Signature(rawSignature)
            if (this.signatures.find(s => s.pubkey === signature.pubkey))
                throw new ValidationError(`signature for ${signature.pubkey} already exists`)
            this.signatures.push(signature)
        }
    }

    __setTimestamp(timestamp) {
        timestamp = parseInt(timestamp, 10)
        if (isNaN(timestamp) || timestamp < 0)
            throw new ValidationError('timestamp is not a valid number')
        this.timestamp = timestamp
    }

    /**
     * Verifies every signature against this envelope's config, using each signature's own rejected flag, and checks
     * that every signer belongs to the allowed set. Intended as the single verifier for both the orchestrator and the
     * nodes. The allowed set is the CURRENT cluster's node keys, not this envelope's: a node this config removes still
     * votes on it, a node this config adds must not.
     * @param {Iterable<string>} allowedPubkeys - public keys of the current cluster's nodes
     * @returns {{valid: boolean, accepted: string[], rejected: string[], invalid: string[], unknown: string[]}}
     */
    verifySignatures(allowedPubkeys) {
        if (!allowedPubkeys || typeof allowedPubkeys[Symbol.iterator] !== 'function')
            throw new ValidationError('allowedPubkeys is required')
        const allowed = new Set(allowedPubkeys)
        if (allowed.size === 0)
            throw new ValidationError('allowedPubkeys is empty')
        const result = {valid: true, accepted: [], rejected: [], invalid: [], unknown: []}
        for (const signature of this.signatures) {
            if (!allowed.has(signature.pubkey)) {
                result.unknown.push(signature.pubkey)
                result.valid = false
                continue
            }
            const payloadHash = this.config.getSignaturePayloadHash(signature.pubkey, signature.nonce, signature.rejected)
            if (!verifySignature(signature.pubkey, signature.signature, payloadHash)) {
                result.invalid.push(signature.pubkey)
                result.valid = false
                continue
            }
            if (signature.rejected)
                result.rejected.push(signature.pubkey)
            else
                result.accepted.push(signature.pubkey)
        }
        return result
    }

    toPlainObject(asLegacy = true) {
        return sortObjectKeys({
            config: this.config.toPlainObject(asLegacy),
            signatures: this.signatures.map(s => s.toPlainObject()),
            timestamp: this.timestamp,
            allowEarlySubmission: this.allowEarlySubmission
        })
    }

    isPayloadEqual(otherEnvelope) {
        if (!otherEnvelope)
            return false
        return this.config.equals(otherEnvelope.config)
            && this.timestamp === otherEnvelope.timestamp
    }
}
