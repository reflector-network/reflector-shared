const {mapToPlainObject} = require('../../utils/map-helper')
const {sortObjectKeys} = require('../../utils/serialization-helper')
const UpdateBase = require('./update-base')
const UpdateType = require('./update-type')

module.exports = class ConfigUpdate extends UpdateBase {

    /**
     * Global config update
     * @param {BigInt} timestamp - pending update timestamp
     * @param {Config} newConfig - pending update configs
     * @param {Config} currentConfig - current configs
     */
    constructor(timestamp, newConfig, currentConfig) {
        super(UpdateType.CONFIG, timestamp)
        if (!newConfig)
            throw new Error('configs is required')
        this.newConfig = newConfig
        this.currentConfig = currentConfig
    }

    /**
     * @type {Config}
     */
    newConfig

    /**
     * @type {Config}
     */
    currentConfig

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            newConfig: mapToPlainObject(this.newConfig),
            currentConfig: mapToPlainObject(this.currentConfig)
        })
    }
}