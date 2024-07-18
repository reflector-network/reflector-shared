const PendingTransactionBase = require('./pending-transaction-base')
const PendingTransactionType = require('./pending-transaction-type')

module.exports = class WasmPendingTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction hash
     * @param {number} timestamp - transaction timestamp
     * @param {string} wasmHash - contract wasm hash
     * @param {boolean} hasMoreTxns - if yes, there are more wasm update transactions to be processed
     */
    constructor(transaction, timestamp, wasmHash, hasMoreTxns) {
        super(transaction, timestamp, PendingTransactionType.CONTRACT_UPDATE)
        if (!wasmHash || wasmHash.length !== 128)
            throw new Error('wasmHash is not valid')
        this.wasmHash = wasmHash
        this.hasMoreTxns = hasMoreTxns
    }

    /**
     * @type {string}
     */
    wasmHash

    /**
     * if yes, there are more wasm update transactions to be processed
     * @type {boolean}
     */
    hasMoreTxns

    getDebugInfo() {
        return `Contract update: ${this.period}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.wasmHash}, hasMoreTxns: ${this.hasMoreTxns}`
    }
}