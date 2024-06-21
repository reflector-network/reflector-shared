const {isValidContractId} = require('../../utils/contractId-helper')
const {sortObjectKeys} = require('../../utils/serialization-helper')
const IssuesContainer = require('../issues-container')
const ContractConfigBase = require('./contract-config-base')

module.exports = class SubscriptionsConfig extends ContractConfigBase {
    constructor(raw) {
        super(raw)
        this.baseFee = !(raw.baseFee && !isNaN(raw.baseFee) && raw.baseFee > 0) ? this.__addIssue(`baseFee: ${IssuesContainer.invalidOrNotDefined}`) : raw.baseFee
        this.token = !(raw.token && isValidContractId(raw.token)) ? this.__addIssue(`token: ${IssuesContainer.invalidOrNotDefined}`) : raw.token

        this.__assignDataSource(raw.dataSources)
    }

    __assignDataSource(dataSources) {
        try {

            if (!Array.isArray(dataSources) || dataSources.length === 0)
                throw new Error(IssuesContainer.invalidOrNotDefined)

            if (dataSources.length === 1 && dataSources[0] === '*') { //all contracts are data sources
                this.dataSources = dataSources
                return
            }

            for (const dataSource of dataSources) {
                if (!isValidContractId(dataSource))
                    throw new Error(`Invalid data source: ${dataSource}`)
                if (this.dataSources.findIndex(ds => ds === dataSource) >= 0)
                    throw new Error('Duplicate data source found in data sources')
            }
            this.dataSources = dataSources
        } catch (err) {
            this.__addIssue(`dataSources: ${err.message}`)
        }
    }

    /**
     * @type {number}
     */
    baseFee

    /**
     * @type {string}
     */
    token

    /**
     * @returns {string[]}
     */
    dataSources

    toPlainObject() {
        return sortObjectKeys(
            ...super.toPlainObject(),
            ...{
                baseFee: this.baseFee,
                token: this.token,
                dataSources: this.dataSources
            })
    }

    equals(other) {
        return super.equals(other)
            && this.baseFee === other.baseFee
            && this.token === other.token
            && this.dataSources.every((dataSource, index) => dataSource === other.dataSources[index])
    }
}