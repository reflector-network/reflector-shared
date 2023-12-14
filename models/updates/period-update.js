const {sortObjectKeys} = require('../../utils/index')
const OracleUpdateBase = require('./oracle-update-base')
const UpdateType = require('./update-type')

module.exports = class PeriodUpdate extends OracleUpdateBase {
    /**
     * @param {BigInt} timestamp - pending update timestamp
     * @param {string} oracleId - oracle id
     * @param {string} admin - oracle admin
     * @param {BigInt} period - pending update period
     */
    constructor(timestamp, oracleId, admin, period) {
        super(UpdateType.PERIOD, timestamp, oracleId, admin)
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