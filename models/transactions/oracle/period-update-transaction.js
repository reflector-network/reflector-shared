const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')

module.exports = class OraclePeriodUpdateTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction hash
     * @param {number} timestamp - transaction timestamp
     * @param {number} period - period update
     */
    constructor(transaction, timestamp, period) {
        super(transaction, timestamp, PendingTransactionType.ORACLE_PERIOD_UPDATE)
        if (!period || isNaN(period) || period <= 0)
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