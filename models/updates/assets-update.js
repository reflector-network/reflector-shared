const {sortObjectKeys} = require('../../utils/serialization-helper')
const OracleUpdateBase = require('./oracle-update-base')
const UpdateType = require('./update-type')

/**
 * @typedef {import('../assets/asset')} Asset
 */

module.exports = class AssetsUpdate extends OracleUpdateBase {
    /**
     * @param {BigInt} timestamp - pending update timestamp
     * @param {string} oracleId - oracle id
     * @param {string} admin - oracle admin
     * @param {Asset[]} assets - pending update assets
     */
    constructor(timestamp, oracleId, admin, assets) {
        super(UpdateType.ASSETS, timestamp, oracleId, admin)
        if (!assets || !assets.length)
            throw new Error('assets is required')
        this.assets = assets
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            assets: this.assets.map(a => a.toPlainObject())
        })
    }
}