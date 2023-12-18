const {mapToPlainObject} = require('../../utils/map-helper')
const {sortObjectKeys} = require('../../utils/serialization-helper')
const UpdateBase = require('./update-base')
const UpdateType = require('./update-type')

module.exports = class ContractsUpdate extends UpdateBase {

    /**
     * @param {BigInt} timestamp - pending update timestamp
     * @param {Map<string, ContractConfig>} newConfigs - pending update configs
     * @param {Map<string, ContractConfig>} currentConfigs - current configs
     */
    constructor(timestamp, newConfigs, currentConfigs) {
        super(UpdateType.CONTRACTS, timestamp)
        if (!newConfigs)
            throw new Error('configs is required')
        this.newConfigs = newConfigs
        this.currentConfigs = currentConfigs
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            newConfigs: mapToPlainObject(this.newConfigs),
            currentConfigs: mapToPlainObject(this.currentConfigs)
        })
    }
}