const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')

/**
 * @typedef {import('../../assets/asset')} Asset
 */

module.exports = class OracleRetentionUpdateTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction hash
     * @param {number} timestamp - transaction timestamp
     * @param {{token: string, fee: BigInt}} retentionConfig - retention config
     */
    constructor(transaction, timestamp, retentionConfig) {
        super(transaction, timestamp, PendingTransactionType.ORACLE_RETENTION_UPDATE)
        if (!retentionConfig)
            throw new Error('retentionConfig is required')
        this.retentionConfig = retentionConfig
    }

    /**
     * @type {{token: string, fee: BigInt}}
     */
    retentionConfig

    getDebugInfo() {
        return `Retention config: ${JSON.stringify({...this.retentionConfig, fee: this.retentionConfig.fee.toString()})}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}