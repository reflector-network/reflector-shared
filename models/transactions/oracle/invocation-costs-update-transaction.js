const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')

module.exports = class OracleInvocationCostsUpdateTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction hash
     * @param {number} timestamp - transaction timestamp
     * @param {BigInt[]} invocationCosts - invocation costs
     */
    constructor(transaction, timestamp, invocationCosts) {
        super(transaction, timestamp, PendingTransactionType.ORACLE_INVOCATION_COSTS_UPDATE)
        if (!invocationCosts)
            throw new Error('costs are required')
        this.invocationCosts = invocationCosts
    }

    /**
     * @type {BigInt[]}
     */
    invocationCosts

    getDebugInfo() {
        return `Invocation costs: ${JSON.stringify(this.invocationCosts.map(c => c.toString()))}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}