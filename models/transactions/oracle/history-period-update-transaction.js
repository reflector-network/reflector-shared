const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')

module.exports = class OracleHistoryPeriodTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction hash
     * @param {number} timestamp - transaction timestamp
     * @param {number} historyRetentionPeriod - history retention period
     */
    constructor(transaction, timestamp, historyRetentionPeriod) {
        super(transaction, timestamp, PendingTransactionType.ORACLE_HISTORY_PERIOD_UPDATE)
        if (!historyRetentionPeriod || isNaN(historyRetentionPeriod) || historyRetentionPeriod <= 0)
            throw new Error('historyRetentionPeriod is required')
        this.historyRetentionPeriod = historyRetentionPeriod
    }

    /**
     * @type {number}
     */
    historyRetentionPeriod

    getDebugInfo() {
        return `History retention period update: ${this.historyRetentionPeriod}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}