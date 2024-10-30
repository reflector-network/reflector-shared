const {mapToPlainObject} = require('../../../utils/map-helper')
const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')

/**
 * @typedef {import('../../configs/dao-config')} DAOConfig
 */

module.exports = class DAODepositsUpdateTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction
     * @param {number} timestamp - transaction timestamp
     * @param {Map<number, string>} depositParams - new deposit params
     */
    constructor(transaction, timestamp, depositParams) {
        super(transaction, timestamp, PendingTransactionType.DAO_DEPOSITS_UPDATE)
        this.depositParams = depositParams
    }

    /**
     * @type {Map<number, string>}
     */
    depositParams

    getDebugInfo() {
        return `Pending deposits update: ${JSON.stringify(mapToPlainObject(this.depositParams))}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}