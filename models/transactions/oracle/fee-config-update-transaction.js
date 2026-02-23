const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')

module.exports = class OracleFeeConfigUpdateTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction hash
     * @param {number} timestamp - transaction timestamp
     * @param {{token: string, fee: BigInt}} feeConfig - fee config
     */
    constructor(transaction, timestamp, feeConfig) {
        super(transaction, timestamp, PendingTransactionType.ORACLE_FEE_CONFIG_UPDATE)
        if (!feeConfig)
            throw new Error('feeConfig is required')
        this.feeConfig = feeConfig
    }

    /**
     * @type {{token: string, fee: BigInt}}
     */
    feeConfig

    getDebugInfo() {
        return `Fee config: ${JSON.stringify({...this.feeConfig, fee: this.feeConfig.fee.toString()})}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}