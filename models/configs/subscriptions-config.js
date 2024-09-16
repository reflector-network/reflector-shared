const {isValidContractId} = require('../../utils/contractId-helper')
const {sortObjectKeys} = require('../../utils/serialization-helper')
const IssuesContainer = require('../issues-container')
const ContractConfigBase = require('./contract-config-base')

module.exports = class SubscriptionsConfig extends ContractConfigBase {
    constructor(raw) {
        super(raw)
        this.baseFee = !(raw.baseFee && !isNaN(raw.baseFee) && raw.baseFee > 0) ? this.__addIssue(`baseFee: ${IssuesContainer.invalidOrNotDefined}`) : raw.baseFee
        this.token = !(raw.token && isValidContractId(raw.token)) ? this.__addIssue(`token: ${IssuesContainer.invalidOrNotDefined}`) : raw.token
    }

    /**
     * @type {number}
     */
    baseFee

    /**
     * @type {string}
     */
    token

    toPlainObject(asLegacy = true) {
        return sortObjectKeys({
            ...super.toPlainObject(asLegacy),
            ...{
                baseFee: this.baseFee,
                token: this.token
            }
        })
    }

    equals(other) {
        return super.equals(other)
            && this.baseFee === other.baseFee
            && this.token === other.token
    }
}