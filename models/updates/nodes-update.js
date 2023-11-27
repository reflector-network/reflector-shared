import UpdateBase from './update-base.js'
import UpdateType from './update-type.js'
import { sortObjectKeys } from '../../utils/index.js'

/**
 * @typedef {import('../node')} Node
 */

export default class NodesUpdate extends UpdateBase {

    /**
     * @param {BigInt} timestamp - pending update timestamp
     * @param {Node[]} nodes - pending update nodes
     */
    constructor(timestamp, nodes) {
        super(UpdateType.NODES, timestamp)
        if (!nodes || !nodes.length)
            throw new Error('nodes is required')
        this.nodes = nodes
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            nodes: this.nodes.toPlainObject()
        })
    }
}