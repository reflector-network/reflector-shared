const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')

module.exports = class SubscriptionsChargeTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction
     * @param {number} timestamp - transaction timestamp
     * @param {number[]} ids - ids of subscriptions
     */
    constructor(transaction, timestamp, ids) {
        super(transaction, timestamp, PendingTransactionType.SUBSCRIPTIONS_CHARGE)
        if (!ids || !ids.length)
            throw new Error('ids is required')
        this.ids = ids
    }

    /**
     * @type {number[]}
     */
    ids

    getDebugInfo() {
        return `Pending charge tx: ids: ${this.ids.join(',')}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}