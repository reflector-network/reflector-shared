const {sortObjectKeys} = require('../../utils/index')
const UpdateBase = require('./update-base')
const UpdateType = require('./update-type')

module.exports = class ContractsUpdate extends UpdateBase {

    /**
     * @param {BigInt} timestamp - pending update timestamp
     * @param {{ContractConfig}[]} configs - pending update configs
     */
    constructor(timestamp, configs) {
        super(UpdateType.CONTRACTS, timestamp)
        if (!configs || !configs.length)
            throw new Error('configs is required')
        this.configs = configs
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            configs: this.configs.map(config => config.toPlainObject())
        })
    }
}