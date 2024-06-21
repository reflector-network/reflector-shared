const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')

module.exports = class SubscriptionsTriggerTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction
     * @param {number} timestamp - transaction timestamp
     * @param {number[]} ids - ids of subscriptions
     * @param {boolean} isHeartbeat - is heartbeat
     */
    constructor(transaction, timestamp, ids, isHeartbeat) {
        super(transaction, timestamp, PendingTransactionType.SUBSCRIPTIONS_TRIGGER)
        if (!ids || !ids.length)
            throw new Error('ids is required')
        this.ids = ids
        this.isHeartbeat = isHeartbeat
    }

    /**
     * @type {number[]}
     */
    ids

    /**
     * @type {boolean}
     */
    isHeartbeat

    getDebugInfo() {
        return `Pending trigger tx: ids: ${this.ids.join(',')}, isHeartbeat: ${this.isHeartbeat}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}