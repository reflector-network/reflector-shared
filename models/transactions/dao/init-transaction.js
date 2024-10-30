const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')

/**
 * @typedef {import('../../configs/dao-config')} DAOConfig
 */

module.exports = class DAOInitTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction hash
     * @param {number} timestamp - transaction timestamp
     * @param {DAOConfig} config - pending update config
     */
    constructor(transaction, timestamp, config) {
        super(transaction, timestamp, PendingTransactionType.DAO_INIT)
        this.config = config
    }

    /**
     * @type {DAOConfig}
     */
    config

    getDebugInfo() {
        return `Pending config init: ${JSON.stringify(this.config.toPlainObject())}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}