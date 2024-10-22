const PendingTransactionBase = require('../pending-transaction-base')
const PendingTransactionType = require('../pending-transaction-type')

/**
 * @typedef {import('../../configs/dao-config')} DAOConfig
 */

module.exports = class DAOVoteTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction hash
     * @param {number} timestamp - transaction timestamp
     * @param {string} ballotId - Ballot ID
     * @param {boolean} accepted - Ballot accepted
     */
    constructor(transaction, timestamp, ballotId, accepted) {
        super(transaction, timestamp, PendingTransactionType.DAO_INIT)
        this.ballotId = ballotId
        this.accepted = accepted
    }

    /**
     * @type {string}
     */
    ballotId

    /**
     * @type {boolean}
     */
    accepted

    getDebugInfo() {
        return `Pending vote tx: ballotId: ${this.ballotId}, accepted: ${this.accepted}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}