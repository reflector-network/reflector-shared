const OracleConfig = require('./oracle-config')

/**
 * A beam sells access to its price feeds: the fee config is the token and the daily rate per asset, so a beam without
 * one can never have an active feed. It has no per-invocation costs
 */
module.exports = class OracleBeamConfig extends OracleConfig {
    constructor(raw) {
        super(raw)
        if (!raw)
            return
        if (raw.invocationCosts !== undefined)
            this.__addIssue('invocationCosts: not supported, a beam charges for access through its fee config')
        if (!raw.feeConfig)
            this.__addIssue('feeConfig: required for a beam, it sets the access rate')
    }
}