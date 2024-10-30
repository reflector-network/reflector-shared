const {sortObjectKeys} = require('../../../utils/serialization-helper')
const UpdateType = require('../update-type')
const ContractUpdateBase = require('../contract-update-base')
const {mapToPlainObject} = require('../../../utils/map-helper')

module.exports = class DAODepositsUpdate extends ContractUpdateBase {
    /**
     * @param {number} timestamp - pending update timestamp
     * @param {string} contractId - oracle id
     * @param {string} admin - oracle admin
     * @param {Map<number, string>} deposits - deposits map
     */
    constructor(timestamp, contractId, admin, deposits) {
        super(UpdateType.DAO_DEPOSITS, timestamp, contractId, admin)
        if (!deposits || !deposits.size)
            throw new Error('deposits are required')
        this.deposits = deposits
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            deposits: mapToPlainObject(this.deposits)
        })
    }
}