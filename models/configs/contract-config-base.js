const {StrKey} = require('@stellar/stellar-sdk')
const {isValidContractId} = require('../../utils/contractId-helper')
const {sortObjectKeys} = require('../../utils/serialization-helper')
const IssuesContainer = require('../issues-container')
const ContractTypes = require('./contract-type')

function isLegacyContract(raw) {
    return raw.oracleId || !raw.contractId || !raw.type
}

function normalizeContract(raw) {
    const rawClone = {...raw}
    if (rawClone.oracleId && rawClone.type || rawClone.oracleId && rawClone.contractId)
        throw new Error(`Cannot mix legacy and new contract format. ${rawClone.oracleId || rawClone.contractId}`)
    if (!rawClone.type)
        rawClone.type = ContractTypes.ORACLE
    if (!rawClone.contractId)
        rawClone.contractId = rawClone.oracleId
    return rawClone
}

module.exports = class ContractConfigBase extends IssuesContainer {
    constructor(raw) {
        super()
        if (!raw) {
            this.__addIssue(`settings: ${IssuesContainer.notDefined}`)
            return
        }
        if (isLegacyContract(raw)) {
            raw = normalizeContract(raw)
            this.isLegacy = true
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

    /**
     * @type {boolean}
     */
    isLegacy = false

    toPlainObject() {
        const plainObject = {
            admin: this.admin,
            contractId: this.contractId,
            fee: this.fee,
            type: this.type
        }
        if (this.isLegacy) {
            plainObject.oracleId = this.contractId
            delete plainObject.contractId
            delete plainObject.type
        }
        return sortObjectKeys(plainObject)
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