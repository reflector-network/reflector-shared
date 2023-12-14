const {sortObjectKeys} = require('../../utils/index')
const {mapToPlainObject} = require('../../utils/map-helper')
const UpdateBase = require('./update-base')
const UpdateType = require('./update-type')

/**
 * @typedef {import('../node')} Node
 */

module.exports = class NodesUpdate extends UpdateBase {

    /**
     * @param {BigInt} timestamp - pending update timestamp
     * @param {Map<string, Node>} newNodes - pending update nodes
     * @param {Map<string, Node>} currentNodes - current nodes
     */
    constructor(timestamp, newNodes, currentNodes) {
        super(UpdateType.NODES, timestamp)
        if (!newNodes || !newNodes.length)
            throw new Error('nodes is required')
        this.newNodes = newNodes
        this.currentNodes = currentNodes
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            newNodes: mapToPlainObject(this.newNodes),
            currentNodes: mapToPlainObject(this.currentNodes)
        })
    }
}