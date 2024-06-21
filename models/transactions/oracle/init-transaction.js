const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')

/**
 * @typedef {import('../../configs/oracle-config')} OracleConfig
 */

module.exports = class OracleInitTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction hash
     * @param {number} timestamp - transaction timestamp
     * @param {OracleConfig} config - pending update config
     */
    constructor(transaction, timestamp, config) {
        super(transaction, timestamp, PendingTransactionType.ORACLE_INIT)
        this.config = config
    }

    /**
     * @type {OracleConfig}
     */
    config

    getDebugInfo() {
        return `Pending config init: ${JSON.stringify(this.config.toPlainObject())}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}