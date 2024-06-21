const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')

class OraclePriceUpdateTransaction extends PendingTransactionBase {

    /**
     * @param {Transaction} transaction - transaction hash
     * @param {number} timestamp - pending update timestamp
     * @param {BigInt[]} prices - pending update prices
     */
    constructor(transaction, timestamp, prices) {
        super(transaction, timestamp, PendingTransactionType.ORACLE_PRICE_UPDATE)
        if (!prices || !prices.length)
            throw new Error('prices is required')
        if (!timestamp)
            throw new Error('timestamp is required')
        this.prices = prices
    }

    /**
     * @type {BigInt[]}
     */
    prices

    getDebugInfo() {
        return `Pending price update: [${this.prices.join(', ')}], timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}

module.exports = OraclePriceUpdateTransaction