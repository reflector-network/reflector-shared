const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')

module.exports = class SubscriptionsTriggerTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction
     * @param {number} timestamp - transaction timestamp
     * @param {BigInt[]} heartbeatIds - heartbeat subscriptions ids
     * @param {BigInt[]} triggerIds - heartbeat subscriptions ids
     */
    constructor(transaction, timestamp, heartbeatIds, triggerIds) {
        super(transaction, timestamp, PendingTransactionType.SUBSCRIPTIONS_TRIGGER)
        if (!heartbeatIds && !heartbeatIds.length && !triggerIds && !triggerIds.length)
            throw new Error('heartbeatIds or triggerIds is required')
        this.heartbeatIds = heartbeatIds
        this.triggerIds = triggerIds
    }

    /**
     * @type {BigInt[]}
     */
    heartbeatIds

    /**
     * @type {BigInt[]}
     */
    triggerIds

    getDebugInfo() {
        return `Pending trigger tx: heartbeatIds: ${this.heartbeatIds.map(id => id.toString()).join(',')}, triggerIds: ${this.triggerIds.map(id => id.toString()).join(',')}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}