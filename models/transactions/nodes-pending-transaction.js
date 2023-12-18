const PendingTransactionBase = require('./pending-transaction-base')
const PendingTransactionType = require('./pending-transaction-type')

/**
 * @typedef {import('@reflector/reflector-shared').Node} Node
 */

module.exports = class NodesPendingTransaction extends PendingTransactionBase {
    /**
     * @param {Transaction} transaction - transaction hash
     * @param {number} timestamp - transaction timestamp
     * @param {Node[]} nodes - nodes update
     */
    constructor(transaction, timestamp, nodes) {
        super(transaction, timestamp, PendingTransactionType.NODES_UPDATE)
        if (!nodes || !nodes.length)
            throw new Error('nodes is required')
        this.nodes = nodes
    }

    /**
     * @type {Node[]}
     */
    nodes

    getDebugInfo() {
        return `Nodes update: ${this.nodes.map(n => `${n.pubkey}:${n.url}:${!!n.removed}`).join(', ')}, timestamp: ${this.timestamp}, type: ${this.type}, hash: ${this.hashHex}`
    }
}