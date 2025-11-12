const {sortObjectKeys} = require('../../../utils/serialization-helper')
const UpdateType = require('../update-type')
const ContractUpdateBase = require('../contract-update-base')

module.exports = class OracleInvocationCostsUpdate extends ContractUpdateBase {
    /**
     * @param {number} timestamp - pending update timestamp
     * @param {string} contractId - oracle id
     * @param {string} admin - oracle admin
     * @param {BigInt[]} invocationCosts - invocation costs
     */
    constructor(timestamp, contractId, admin, invocationCosts) {
        super(UpdateType.ORACLE_INVOCATION_COSTS, timestamp, contractId, admin)
        if (invocationCosts === undefined)
            throw new Error('costs are required')
        if (!Array.isArray(invocationCosts) || invocationCosts.some(c => typeof c !== 'bigint'))
            throw new Error('costs must be an array of BigInt')
        this.invocationCosts = invocationCosts
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            invocationCosts: this.invocationCosts.map(c => c.toString())
        })
    }
}