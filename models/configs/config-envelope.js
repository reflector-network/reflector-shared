const Signature = require('../signature')
const {sortObjectKeys} = require('../../utils/serialization-helper')
const Config = require('./config')

module.exports = class ConfigEnvelope {
    constructor(rawEnvelope) {
        if (!rawEnvelope)
            throw new Error('rawEnvelope is required')
        this.__setConfig(rawEnvelope.config)
        this.__setSignatures(rawEnvelope.signatures)
        this.__setTimestamp(rawEnvelope.timestamp)
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

    __setConfig(config) {
        if (!config)
            throw new Error('config is required')
        this.config = new Config(config)
    }

    __setSignatures(signatures) {
        if (!signatures)
            throw new Error('signatures is required')
        for (const signature of signatures) {
            if (this.signatures.find(s => s.pubkey === signature.pubkey))
                throw new Error(`signature for ${signature.pubkey} already exists`)
            this.signatures.push(new Signature(signature))
        }
    }

    __setTimestamp(timestamp) {
        timestamp = parseInt(timestamp, 10)
        if (isNaN(timestamp) || timestamp < 0)
            throw new Error('timestamp is not a valid number')
        this.timestamp = timestamp
    }

    toPlainObject() {
        return sortObjectKeys({
            config: this.config.toPlainObject(),
            signatures: this.signatures.map(s => s.toPlainObject()),
            timestamp: this.timestamp
        })
    }

    isPayloadEqual(otherEnvelope) {
        if (!otherEnvelope)
            return false
        return this.config.equals(otherEnvelope.config)
            && this.timestamp === otherEnvelope.timestamp
    }
}