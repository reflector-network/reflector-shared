const {sortObjectKeys} = require('../../../utils/serialization-helper')
const UpdateType = require('../update-type')
const ContractUpdateBase = require('../contract-update-base')

module.exports = class OracleHistoryPeriodUpdate extends ContractUpdateBase {
    /**
     * @param {number} timestamp - pending update timestamp
     * @param {string} contractId - oracle id
     * @param {string} admin - oracle admin
     * @param {number} historyRetentionPeriod - pending update period
     */
    constructor(timestamp, contractId, admin, historyRetentionPeriod) {
        super(UpdateType.ORACLE_HISTORY_PERIOD, timestamp, contractId, admin)
        if (!historyRetentionPeriod)
            throw new Error('historyRetentionPeriod is required')
        this.historyRetentionPeriod = historyRetentionPeriod
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            historyRetentionPeriod: this.historyRetentionPeriod
        })
    }
}