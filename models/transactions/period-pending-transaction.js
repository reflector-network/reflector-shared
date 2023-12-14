const PendingTransactionBase = require('./pending-transaction-base')
const PendingTransactionType = require('./pending-transaction-type')

module.exports = class PeriodPendingTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction hash
     * @param {number} timestamp - transaction timestamp
     * @param {number} period - period update
     */
    constructor(transaction, timestamp, period) {
        super(transaction, timestamp, PendingTransactionType.ASSETS_UPDATE)
        if (!period || period <= 0)
            throw new Error('period is required')
        this.period = period
    }

    /**
     * @type {number}
     */
    period

    getDebugInfo() {
        return `Period update: ${this.period}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}