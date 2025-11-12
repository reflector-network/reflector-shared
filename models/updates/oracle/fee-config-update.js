const {sortObjectKeys} = require('../../../utils/serialization-helper')
const UpdateType = require('../update-type')
const ContractUpdateBase = require('../contract-update-base')

module.exports = class OracleFeeConfigUpdate extends ContractUpdateBase {
    /**
     * @param {number} timestamp - pending update timestamp
     * @param {string} contractId - oracle id
     * @param {string} admin - oracle admin
     * @param {{token: string, fee: BigInt}} feeConfig - fee config
     */
    constructor(timestamp, contractId, admin, feeConfig) {
        super(UpdateType.ORACLE_FEE_CONFIG, timestamp, contractId, admin)
        if (feeConfig === undefined)
            throw new Error('feeConfig is required')
        if (!feeConfig.fee || typeof feeConfig.fee !== 'bigint')
            throw new Error('feeConfig.fee must be a BigInt')
        if (!feeConfig.token || typeof feeConfig.token !== 'string')
            throw new Error('feeConfig.token must be a string')
        this.feeConfig = feeConfig
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            feeConfig: {...this.feeConfig, fee: this.feeConfig.fee.toString()}
        })
    }
}