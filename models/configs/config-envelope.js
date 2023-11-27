import Config from './config.js'
import Signature from '../signature.js'
import { sortObjectKeys } from '../../utils/index.js'

export default class ConfigEnvelope {
    constructor(rawEnvelope) {
        if (!rawEnvelope)
            throw new Error('rawEnvelope is required')
        this.__setConfig(rawEnvelope.config)
        this.__setSignatures(rawEnvelope.signatures)
        this.__setTimestamp(rawEnvelope.timestamp)
    }

    __setConfig(config) {
        if (!config)
            throw new Error('config is required')
        this.config = new Config(config)
    }

    __setSignatures(signatures) {
        if (!signatures || !signatures.length)
            throw new Error('signatures is required')
        this.signatures = signatures.map(s => new Signature(s))
    }

    __setTimestamp(timestamp) {
        if (!timestamp || isNaN(timestamp))
            throw new Error('timestamp is required')
        this.timestamp = timestamp
    }

    toPlainObject() {
        return sortObjectKeys({
            config: this.config.toPlainObject(),
            signatures: this.signatures.map(s => s.toPlainObject()),
            timestamp: this.timestamp
        })
    }
}