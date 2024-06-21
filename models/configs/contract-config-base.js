const {StrKey} = require('@stellar/stellar-sdk')
const {isValidContractId} = require('../../utils/contractId-helper')
const {sortObjectKeys} = require('../../utils/serialization-helper')
const IssuesContainer = require('../issues-container')
const ContractTypes = require('./contract-type')

module.exports = class ContractConfigBase extends IssuesContainer {
    constructor(raw) {
        super()
        if (!raw) {
            this.__addIssue(`settings: ${IssuesContainer.notDefined}`)
            return
        }
        this.admin = !(raw.admin && StrKey.isValidEd25519PublicKey(raw.admin)) ? this.__addIssue(`admin: ${IssuesContainer.invalidOrNotDefined}`) : raw.admin
        this.contractId = !(raw.contractId && isValidContractId(raw.contractId)) ? this.__addIssue(`contractId: ${IssuesContainer.invalidOrNotDefined}`) : raw.contractId
        this.fee = !(raw.fee && raw.fee > 0 && !isNaN(raw.fee)) ? this.__addIssue(`fee: ${IssuesContainer.invalidOrNotDefined}`) : raw.fee
        this.type = !(raw.type && ContractTypes.isValidType(raw.type)) ? this.__addIssue(`type: ${IssuesContainer.invalidOrNotDefined}`) : raw.type
    }

    /**
     * @type {string}
     */
    admin

    /**
     * @type {string}
     */
    contractId

    /**
     * @type {number}
     */
    fee

    /**
     * @type {string}
     */
    type

    toPlainObject() {
        return sortObjectKeys({
            admin: this.admin,
            contractId: this.contractId,
            fee: this.fee,
            type: this.type
        })
    }

    equals(other) {
        if (!other || other.constructor !== this.constructor)
            return false
        return this.admin === other.admin
            && this.contractId === other.contractId
            && this.fee === other.fee
            && this.type === other.type
    }
}