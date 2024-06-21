const {mapToPlainObject} = require('../../utils/map-helper')
const {sortObjectKeys} = require('../../utils/serialization-helper')
const UpdateBase = require('./update-base')
const UpdateType = require('./update-type')

/**
 * @typedef {import('../configs/oracle-config')} OracleConfig
 */

module.exports = class ContractsUpdate extends UpdateBase {

    /**
     * @param {BigInt} timestamp - pending update timestamp
     * @param {Map<string, OracleConfig>} newConfigs - pending update configs
     * @param {Map<string, OracleConfig>} currentConfigs - current configs
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