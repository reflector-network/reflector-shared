const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')

module.exports = class SubscriptionsTriggerTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction
     * @param {number} timestamp - transaction timestamp
     * @param {Buffer} triggerHash - trigger hash
     */
    constructor(transaction, timestamp, triggerHash) {
        super(transaction, timestamp, PendingTransactionType.SUBSCRIPTIONS_TRIGGER)
        if (!triggerHash)
            throw new Error('triggerHash is required')
        this.triggerHash = triggerHash
    }

    /**
     * @type {Buffer}
     */
    triggerHash

    getDebugInfo() {
        return `Pending trigger tx: triggerHash: ${this.triggerHash.toString('base64')}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}