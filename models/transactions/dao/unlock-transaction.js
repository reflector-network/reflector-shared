const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')


module.exports = class DAOUnlockTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction hash
     * @param {number} timestamp - transaction timestamp
     * @param {string} developer - Developer public key
     * @param {string[]} operators - Operators public keys
     */
    constructor(transaction, timestamp, developer, operators) {
        super(transaction, timestamp, PendingTransactionType.DAO_UNLOCK)
        if (!developer || !operators || !operators.length)
            throw new Error('Invalid DAOUnlockTransaction params')
        this.developer = developer
        this.operators = operators
    }

    /**
     * @type {string}
     */
    developer

    /**
     * @type {string[]}
     */
    operators

    getDebugInfo() {
        return `Pending unlock tx: developer: ${this.developer}, operators: ${this.operators.join(',')}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}