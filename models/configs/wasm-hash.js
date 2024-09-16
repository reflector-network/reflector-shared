const {sortObjectKeys} = require('../../utils/serialization-helper')
const ContractTypes = require('./contract-type')

module.exports = class WasmHash {
    constructor(raw) {
        if (!raw) {
            throw new Error('Wasm hash item is not defined')
        }

        if (typeof raw === 'string') {
            raw = {hash: raw, type: ContractTypes.ORACLE}
            this.isLegacy = true
        }

        if (!raw.hash || typeof raw.hash !== 'string' || raw.hash.length !== 64)
            throw new Error(`Wasm hash is not valid: ${raw.hash}`)

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