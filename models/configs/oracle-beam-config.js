const {sortObjectKeys} = require('../../utils/serialization-helper')
const {areArraysEqual} = require('../../utils/comparison-helper')
const OracleConfig = require('./oracle-config')

module.exports = class OracleBeamConfig extends OracleConfig {
    constructor(raw) {
        super(raw)
        this.__assignInvocationCosts(raw.invocationCost)
    }

    __assignInvocationCosts(invocationCosts) {
        try {
            if (!invocationCosts)
                return
            if (!Array.isArray(invocationCosts) || invocationCosts.some(c => typeof c !== 'string' || !BigInt(c)) || invocationCosts.length !== 5)
                throw new Error('invocationCosts must be an array of 5 BigInt strings')
            this.invocationCosts = invocationCosts.map(c => BigInt(c))
            this.__invocationCostsSet = true
        } catch (err) {
            this.__addIssue(`invocationCosts: ${err.message}`)
        }
    }

    /**
     * @type {BigInt[]}
     */
    invocationCosts

    toPlainObject(asLegacy = true) {
        return sortObjectKeys({
            ...super.toPlainObject(asLegacy),
            ...{
                invocationCosts: this.__invocationCostsSet ? this.invocationCosts.map(c => c.toString()) : undefined
            }
        })
    }

    equals(other) {
        return super.equals(other)
            && areArraysEqual(this.invocationCosts, other.invocationCosts)
    }
}