const {SubscriptionsClient} = require('@reflector/oracle-client')
const SubscriptionsInitTransaction = require('../../models/transactions/subscriptions/init-transaction')
const SubscriptionsFeeUpdateTransaction = require('../../models/transactions/subscriptions/fee-update-transaction')
const SubscriptionsTriggerTransaction = require('../../models/transactions/subscriptions/trigger-transaction')
const SubscriptionsChargeTransaction = require('../../models/transactions/subscriptions/charge-transaction')

/**
 * @typedef {import('../../models/updates/subscriptions/base-fee-update')} SubscriptionsFeeUpdate
 * @typedef {import('../../models/configs/subscriptions-config')} SubscriptionsConfig
 * @typedef {import('../../models/configs/config')} Config
 * @typedef {import('../../models/configs/config-envelope')} ConfigEnvelope
 * @typedef {import('@stellar/stellar-sdk').Account} Account
 * @typedef {import('../../models/transactions/pending-transaction-base')} PendingTransactionBase
 */

/**
 * @typedef {Object} SubscriptionsInitOptions
 * @property {string} network - network
 * @property {string[]} sorobanRpc - soroban rpc urls
 * @property {SubscriptionsConfig} config - contract config
 * @property {Account} account - account
 * @property {Date} maxTime - tx max time
 * @property {number} fee - fee
 */

/**
 * @typedef {Object} TriggerOptions
 * @property {Account} account - account
 * @property {string} network - network
 * @property {number} fee - fee
 * @property {string[]} sorobanRpc - soroban rpc urls
 * @property {string} contractId - contract id
 * @property {string} admin - contract admin
 * @property {number} timestamp - timestamp
 * @property {BigInt[]} triggerIds - trigger subscription ids
 * @property {BigInt[]} heartbeatIds - heartbeat subscription ids
 * @property {Date} maxTime - tx max time
 */

/**
 * @typedef {Object} ChargeOptions
 * @property {Account} account - account
 * @property {string} network - network
 * @property {number} fee - fee
 * @property {string[]} sorobanRpc - soroban rpc urls
 * @property {string} contractId - contract id
 * @property {string} admin - contract admin
 * @property {number} timestamp - timestamp
 * @property {number[]} ids - subscription ids
 * @property {Date} maxTime - tx max time
 */

/**
 * @param {SubscriptionsInitOptions} initOptions - contract init options
 * @returns {Promise<SubscriptionsInitTransaction>}
 */
async function buildSubscriptionsInitTransaction(initOptions) {
    const {account, config, sorobanRpc, network, maxTime, fee: txFee} = initOptions
    const {admin, baseFee: fee, token, contractId} = config
    const subscriptionsClient = new SubscriptionsClient(network, sorobanRpc, contractId)
    const tx = await subscriptionsClient.config(
        account,
        {admin, fee, token},
        {fee: txFee, networkPassphrase: network, timebounds: {minTime: 0, maxTime}}
    )
    return new SubscriptionsInitTransaction(tx, 1, config)
}

/**
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {SubscriptionsFeeUpdate} update - period update
 * @returns {Promise<OraclePeriodUpdateTransaction>}
 */
async function buildSubscriptionFeeUpdateTransaction(sorobanRpc, account, txOptions, update) {
    const subscriptionsClient = new SubscriptionsClient(txOptions.networkPassphrase, sorobanRpc, update.contractId)
    const tx = await subscriptionsClient.setFee(
        account,
        {admin: update.admin, fee: update.fee},
        txOptions
    )
    return new SubscriptionsFeeUpdateTransaction(tx, update.timestamp, update.fee)
}

/**
 * @param {TriggerOptions} triggerOptions - trigger options
 * @returns {Promise<OraclePeriodUpdateTransaction>}
 */
async function buildSubscriptionTriggerTransaction(triggerOptions) {
    const {ids, triggerIds, heartbeatIds, contractId, admin, sorobanRpc, network, account, fee, maxTime, timestamp} = triggerOptions
    const subscriptionsClient = new SubscriptionsClient(network, sorobanRpc, contractId)
    const tx = await subscriptionsClient.trigger(
        account,
        {ids, timestamp, heartbeatIds, triggerIds, admin},
        {fee, networkPassphrase: network, timebounds: {minTime: 0, maxTime}}
    )
    return new SubscriptionsTriggerTransaction(tx, timestamp, heartbeatIds, triggerIds)
}

/**
 * @param {ChargeOptions} chargeOptions - charge options
 * @returns {Promise<OraclePeriodUpdateTransaction>}
 */
async function buildSubscriptionChargeTransaction(chargeOptions) {
    const {ids, contractId, admin, account, sorobanRpc, network, fee, maxTime, timestamp} = chargeOptions
    const subscriptionsClient = new SubscriptionsClient(network, sorobanRpc, contractId)
    const tx = await subscriptionsClient.charge(
        account,
        {ids, admin},
        {fee, networkPassphrase: network, timebounds: {minTime: 0, maxTime}}
    )
    return new SubscriptionsChargeTransaction(tx, timestamp, ids)
}

module.exports = {
    buildSubscriptionsInitTransaction,
    buildSubscriptionFeeUpdateTransaction,
    buildSubscriptionTriggerTransaction,
    buildSubscriptionChargeTransaction
}