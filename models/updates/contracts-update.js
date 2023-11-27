import UpdateBase from './update-base.js'
import UpdateType from './update-type.js'
import { sortObjectKeys } from '../../utils/index.js'

export default class ContractsUpdate extends UpdateBase {

    /**
     * @param {BigInt} timestamp - pending update timestamp
     * @param {{ContractConfig}[]} configs - pending update configs
     */
    constructor(timestamp, configs) {
        super(UpdateType.NODES, timestamp)
        if (!configs || !configs.length)
            throw new Error('nodes is required')
        this.configs = configs
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            configs: this.configs.map(config => config.toPlainObject())
        })
    }
}