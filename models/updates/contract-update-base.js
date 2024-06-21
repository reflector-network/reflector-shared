const {StrKey} = require('@stellar/stellar-sdk')
const {sortObjectKeys} = require('../../utils/serialization-helper')
const {isValidContractId} = require('../../utils/contractId-helper')
const UpdateBase = require('./update-base')

module.exports = class ContractUpdateBase extends UpdateBase {
    /**
     * @param {number} type - update type
     * @param {number} timestamp - pending update timestamp
     * @param {string} contractId - contract id
     * @param {string} admin - contract admin
     * @param {number} fee - contract fee
     */
    constructor(type, timestamp, contractId, admin, fee) {
        super(type, timestamp)
        if (!isValidContractId(contractId))
            throw new Error('contractId is not valid or undefined')
        if (!StrKey.isValidEd25519PublicKey(admin))
            throw new Error('admin is not valid or undefined')
        this.contractId = contractId
        this.admin = admin
        this.fee = fee
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            contractId: this.contractId,
            admin: this.admin,
            fee: this.fee
        })
    }
}