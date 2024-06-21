const {sortObjectKeys} = require('../../../utils/serialization-helper')
const UpdateType = require('../update-type')
const ContractUpdateBase = require('../contract-update-base')

module.exports = class OraclePeriodUpdate extends ContractUpdateBase {
    /**
     * @param {number} timestamp - pending update timestamp
     * @param {string} contractId - oracle id
     * @param {string} admin - oracle admin
     * @param {number} period - pending update period
     */
    constructor(timestamp, contractId, admin, period) {
        super(UpdateType.ORACLE_PERIOD, timestamp, contractId, admin)
        if (!period)
            throw new Error('period is required')
        this.period = period
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            period: this.period
        })
    }
}