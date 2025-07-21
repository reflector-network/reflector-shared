const {sortObjectKeys} = require('../../../utils/serialization-helper')
const UpdateType = require('../update-type')
const ContractUpdateBase = require('../contract-update-base')

module.exports = class OracleRetentionUpdate extends ContractUpdateBase {
    /**
     * @param {number} timestamp - pending update timestamp
     * @param {string} contractId - oracle id
     * @param {string} admin - oracle admin
     * @param {{token: string, fee: BigInt}} retentionConfig - retention config
     */
    constructor(timestamp, contractId, admin, retentionConfig) {
        super(UpdateType.ORACLE_RETENTION, timestamp, contractId, admin)
        if (retentionConfig === undefined)
            throw new Error('retentionConfig is required')
        if (!retentionConfig.fee || typeof retentionConfig.fee !== 'bigint')
            throw new Error('retentionConfig.fee must be a BigInt')
        if (!retentionConfig.token || typeof retentionConfig.token !== 'string')
            throw new Error('retentionConfig.token must be a string')
        this.retentionConfig = retentionConfig
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            retentionConfig: {...this.retentionConfig, fee: this.retentionConfig.fee.toString()}
        })
    }
}