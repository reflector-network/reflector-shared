const {StrKey} = require('@stellar/stellar-sdk')
const {isValidContractId} = require('../../utils/contractId-helper')
const {mapToPlainObject, areMapsEqual} = require('../../utils/map-helper')
const {sortObjectKeys} = require('../../utils/serialization-helper')
const IssuesContainer = require('../issues-container')
const BallotCategories = require('../ballot-categories')
const ContractConfigBase = require('./contract-config-base')


module.exports = class DAOConfig extends ContractConfigBase {
    constructor(raw) {
        super(raw)
        this.initAmount = !(raw.initAmount && !isNaN(raw.initAmount) && raw.initAmount > 0) ? this.__addIssue(`initAmount: ${IssuesContainer.invalidOrNotDefined}`) : raw.initAmount
        this.startDate = !(raw.startDate && !isNaN(raw.startDate) && raw.startDate > 0) ? this.__addIssue(`startDate: ${IssuesContainer.invalidOrNotDefined}`) : raw.startDate
        this.token = !(raw.token && isValidContractId(raw.token)) ? this.__addIssue(`token: ${IssuesContainer.invalidOrNotDefined}`) : raw.token
        this.developer = !(raw.developer && StrKey.isValidEd25519PublicKey(raw.developer)) ? this.__addIssue(`developer: ${IssuesContainer.invalidOrNotDefined}`) : raw.developer

        this.__setDepositParams(raw.depositParams)
    }

    /**
     * @type {number}
     */
    initAmount

    /**
     * @type {number}
     */
    startDate

    /**
     * @type {string}
     */
    token

    /**
     * @type {Map<number, number>}
     */
    depositParams = new Map()

    /**
     * @type {string}
     */
    developer

    __setDepositParams(depositParams) {
        try {
            if (!depositParams)
                throw new Error('Deposit params not defined')
            const allKeys = Object.keys(depositParams)
            const depositCategories = new Set(allKeys.sort((a, b) => a - b))
            if (allKeys.length !== depositCategories.size)
                throw new Error('Duplicate deposit params keys found')
            for (const category of depositCategories) {
                if (!BallotCategories.isValidCategory(Number(category))) {
                    this.__addIssue(`${category}: invalid deposit category`)
                    continue
                }
                const deposit = depositParams[category]
                if (isNaN(deposit) || deposit < 0) {
                    this.__addIssue(`${category}: invalid deposit value '${deposit}'`)
                    continue
                }
                this.depositParams.set(Number(category), deposit)
            }
        } catch (err) {
            this.__addIssue(`contracts: ${err.message}`)
        }
    }

    toPlainObject(asLegacy = true) {
        return sortObjectKeys({
            ...super.toPlainObject(asLegacy),
            ...{
                initAmount: this.initAmount,
                token: this.token,
                startDate: this.startDate,
                depositParams: mapToPlainObject(this.depositParams),
                developer: this.developer
            }
        })
    }

    equals(other) {
        return super.equals(other)
            && this.initAmount === other.initAmount
            && this.token === other.token
            && this.startDate === other.startDate
            && areMapsEqual(this.depositParams, other.depositParams)
            && this.developer === other.developer
    }
}