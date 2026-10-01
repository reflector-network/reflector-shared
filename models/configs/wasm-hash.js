const {sortObjectKeys} = require('../../utils/serialization-helper')
const ValidationError = require('../validation-error')
const ContractTypes = require('./contract-type')

const hashPattern = /^[0-9a-f]{64}$/

module.exports = class WasmHash {
    constructor(raw) {
        if (!raw) {
            throw new Error('Wasm hash item is not defined')
        }

        if (typeof raw === 'string') {
            raw = {hash: raw, type: ContractTypes.ORACLE}
            this.isLegacy = true
        }

        if (typeof raw.hash !== 'string' || !hashPattern.test(raw.hash))
            throw new ValidationError(`Wasm hash is not valid: ${raw.hash}`)

        this.hash = raw.hash

        if (!raw.type || !ContractTypes.isValidType(raw.type))
            throw new Error(`Wasm contract type is not valid: ${raw.type}`)

        this.type = raw.type
    }

    /**
     * @type {string}
     */
    hash

    /**
     * @type {string}
     */
    type


    /**
     * @type {boolean}
     */
    isLegacy = false

    /**
     * Accepted wasm hash format: 64 lowercase hex characters, the form the chain reports
     * @type {RegExp}
     */
    static pattern = hashPattern

    /**
     * Compares two wasm hashes case-insensitively, so a stray uppercase value never loops an update forever
     * @param {string} hash - first hash
     * @param {string} other - second hash
     * @returns {boolean}
     */
    static isSameHash(hash, other) {
        return typeof hash === 'string' && typeof other === 'string' && hash.toLowerCase() === other.toLowerCase()
    }

    toPlainObject(asLegacy = true) {
        if (this.isLegacy && asLegacy) {
            return this.hash
        }
        return sortObjectKeys({
            hash: this.hash,
            type: this.type
        })
    }

    equals(other) {
        if (!other || other.constructor !== this.constructor)
            return false
        return this.hash === other.hash
            && this.type === other.type
    }
}