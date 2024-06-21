const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')

/**
 * @typedef {import('../../configs/subscriptions-config')} SubscriptionsConfig
 */

module.exports = class SubscriptionsInitTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction hash
     * @param {number} timestamp - transaction timestamp
     * @param {SubscriptionsConfig} config - pending update config
     */
    constructor(transaction, timestamp, config) {
        super(transaction, timestamp, PendingTransactionType.SUBSCRIPTIONS_INIT)
        this.config = config
    }

    /**
     * @type {SubscriptionsConfig}
     */
    config

    getDebugInfo() {
        return `Pending config init: ${JSON.stringify(this.config.toPlainObject())}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}