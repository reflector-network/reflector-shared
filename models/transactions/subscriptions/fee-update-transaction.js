const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')

/**
 * @typedef {import('../../configs/subscriptions-config')} SubscriptionsConfig
 */

module.exports = class SubscriptionsFeeUpdateTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction
     * @param {number} timestamp - transaction timestamp
     * @param {number} fee - new fee
     */
    constructor(transaction, timestamp, fee) {
        super(transaction, timestamp, PendingTransactionType.SUBSCRIPTIONS_UPDATE_FEE)
        if (!fee || isNaN(fee) || fee <= 0)
            throw new Error('fee is required')
        this.fee = fee
    }

    /**
     * @type {number}
     */
    fee

    getDebugInfo() {
        return `Pending fee update: ${this.fee}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}