const {StrKey} = require('@stellar/stellar-sdk')
const {sortObjectKeys} = require('../../utils/serialization-helper')
const {isValidContractId} = require('../../utils/contractId-helper')
const UpdateBase = require('./update-base')

module.exports = class OracleUpdateBase extends UpdateBase {
    /**
     * @param {number} type - update type
     * @param {BigInt} timestamp - pending update timestamp
     * @param {string} oracleId - oracle id
     * @param {string} admin - oracle admin
     */
    constructor(type, timestamp, oracleId, admin) {
        super(type, timestamp)
        if (!isValidContractId(oracleId))
            throw new Error('oracleId is not valid or undefined')
        if (!StrKey.isValidEd25519PublicKey(admin))
            throw new Error('admin is not valid or undefined')
        this.oracleId = oracleId
        this.admin = admin
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            oracleId: this.oracleId,
            admin: this.admin
        })
    }
}