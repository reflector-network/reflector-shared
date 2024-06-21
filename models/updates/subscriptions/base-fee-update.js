const {sortObjectKeys} = require('../../../utils/serialization-helper')
const UpdateType = require('../update-type')
const ContractUpdateBase = require('../contract-update-base')

module.exports = class SubscriptionsFeeUpdate extends ContractUpdateBase {
    /**
     * @param {number} timestamp - pending update timestamp
     * @param {string} contractId - contract id
     * @param {string} admin - contract admin
     * @param {number} fee - pending update fee
     */
    constructor(timestamp, contractId, admin, fee) {
        super(UpdateType.SUBSCRIPTIONS_FEE, timestamp, contractId, admin)
        if (isNaN(fee) || fee < 0)
            throw new Error('fee is required')
        this.fee = fee
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            fee: this.fee
        })
    }
}