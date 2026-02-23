const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')

module.exports = class OracleCacheSizeUpdateTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction hash
     * @param {number} timestamp - transaction timestamp
     * @param {number} cacheSize - cache size
     */
    constructor(transaction, timestamp, cacheSize) {
        super(transaction, timestamp, PendingTransactionType.ORACLE_CACHE_SIZE_UPDATE)
        if (cacheSize === undefined)
            throw new Error('cacheSize is required')
        this.cacheSize = cacheSize
    }

    /**
     * @type {number}
     */
    cacheSize

    getDebugInfo() {
        return `Cache size: ${this.cacheSize}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}