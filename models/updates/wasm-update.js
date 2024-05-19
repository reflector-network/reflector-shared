const {sortObjectKeys} = require('../../utils/serialization-helper')
const UpdateBase = require('./update-base')
const UpdateType = require('./update-type')

module.exports = class WasmUpdate extends UpdateBase {
    /**
     * @param {BigInt} timestamp - pending update timestamp
     * @param {string} wasmHash - contract wasm hash
     */
    constructor(timestamp, wasmHash) {
        super(UpdateType.WASM, timestamp)
        if (!wasmHash || wasmHash.length !== 64)
            throw new Error('wasmHash is not valid')
        this.wasmHash = wasmHash
    }

    /**
     * @param {string} oracleId - oracle id
     */
    assignOracleId(oracleId) {
        if (!oracleId)
            throw new Error('oracleId is required')
        if (this.oracleId)
            throw new Error('oracleId is already assigned')
        this.oracleId = oracleId
    }

    /**
     * @type {string}
     */
    wasmHash

    /**
     * @type {string}
     * @readonly
     */
    oracleId

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            wasmHash: this.wasmHash,
            oracleId: this.oracleId
        })
    }
}