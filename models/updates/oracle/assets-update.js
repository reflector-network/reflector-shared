const {sortObjectKeys} = require('../../../utils/serialization-helper')
const UpdateType = require('../update-type')
const ContractUpdateBase = require('../contract-update-base')

/**
 * @typedef {import('../../assets/asset')} Asset
 */

module.exports = class OracleAssetsUpdate extends ContractUpdateBase {
    /**
     * @param {number} timestamp - pending update timestamp
     * @param {string} contractId - oracle id
     * @param {string} admin - oracle admin
     * @param {Asset[]} assets - pending update assets
     */
    constructor(timestamp, contractId, admin, assets) {
        super(UpdateType.ORACLE_ASSETS, timestamp, contractId, admin)
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