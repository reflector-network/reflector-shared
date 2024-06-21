const {sortObjectKeys} = require('../../utils/serialization-helper')
const ContractTypes = require('../configs/contract-type')
const UpdateBase = require('./update-base')
const UpdateType = require('./update-type')

module.exports = class WasmUpdate extends UpdateBase {
    /**
     * @param {BigInt} timestamp - pending update timestamp
     * @param {string} wasmHash - contract wasm hash
     * @param {string} contractType - contract type
     */
    constructor(timestamp, wasmHash, contractType) {
        super(UpdateType.WASM, timestamp)
        if (!wasmHash || wasmHash.length !== 64)
            throw new Error('wasmHash is not valid')
        if (!contractType || !ContractTypes.isValidType(contractType))
            throw new Error('contractType is not valid')
        this.wasmHash = wasmHash
        this.contractType = contractType
    }

    /**
     * @param {{admin: string, contract: string}[]} contractsToUpdate - ordered oracle ids to update
     */
    assignContractsToUpdate(contractsToUpdate) {
        if (!Array.isArray(contractsToUpdate) || contractsToUpdate.length < 1)
            throw new Error('No oracles to update')
        if (this.contractsToUpdate)
            throw new Error('contractsToUpdate is already assigned')
        this.contractsToUpdate = contractsToUpdate
    }

    /**
     * @type {string}
     */
    wasmHash

    /**
     * @type {{admin: string, contract: string}[]}
     * @readonly
     */
    contractsToUpdate

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            wasmHash: this.wasmHash,
            contractsToUpdate: this.contractsToUpdate
        })
    }
}