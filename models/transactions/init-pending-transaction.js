const PendingTransactionBase = require('./pending-transaction-base')
const PendingTransactionType = require('./pending-transaction-type')

/**
 * @typedef {import('@reflector/reflector-shared').ContractConfig} ContractConfig
 */

module.exports = class InitPendingTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction hash
     * @param {number} timestamp - transaction timestamp
     * @param {ContractConfig} config - pending update config
     */
    constructor(transaction, timestamp, config) {
        super(transaction, timestamp, PendingTransactionType.INIT)
        this.config = config
    }

    /**
     * @type {ContractConfig}
     */
    config

    getDebugInfo() {
        return `Pending config init: ${JSON.stringify(this.config.toPlainObject())}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}