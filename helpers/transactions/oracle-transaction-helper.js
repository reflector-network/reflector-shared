const {OracleClient} = require('@reflector/oracle-client')
const OracleInitTransaction = require('../../models/transactions/oracle/init-transaction')
const PriceUpdatePendingTransaction = require('../../models/transactions/oracle/price-update-transaction')
const OracleHistoryPeriodUpdateTransaction = require('../../models/transactions/oracle/history-period-update-transaction')
const OracleAssetsUpdateTransaction = require('../../models/transactions/oracle/assets-update-transaction')
const OracleCacheSizeUpdateTransaction = require('../../models/transactions/oracle/cache-size-update-transaction')
const OracleFeeConfigUpdateTransaction = require('../../models/transactions/oracle/fee-config-update-transaction')
const OracleInvocationCostsUpdateTransaction = require('../../models/transactions/oracle/invocation-costs-update-transaction')

/**
 * @typedef {import('../../models/updates/oracle/assets-update')} OracleAssetsUpdate
 * @typedef {import('../../models/updates/oracle/history-period-update')} OraclePeriodUpdate
 * @typedef {import('../../models/updates/oracle/cache-size-update')} OracleCacheSizeUpdate
 * @typedef {import('../../models/updates/oracle/invocation-costs-update')} OracleInvocationCostsUpdate
 * @typedef {import('../../models/configs/oracle-config')} OracleConfig
 * @typedef {import('@stellar/stellar-sdk').Account} Account
 */

/**
 * @typedef {Object} InitOptions
 * @property {string} network - network
 * @property {string[]} sorobanRpc - soroban rpc urls
 * @property {OracleConfig} config - contract config
 * @property {Account} account - account
 * @property {Date} maxTime - tx max time
 * @property {number} fee - fee
 * @property {number} [decimals] - decimals, used for legacy support
 * @property {number} [protocol] - protocol version
 */

/**
 * @typedef {Object} PriceUpdateOptions
 * @property {Account} account - account
 * @property {string} network - network
 * @property {number} fee - fee
 * @property {string[]} sorobanRpc - soroban rpc urls
 * @property {string} contractId - contract id
 * @property {string} admin - contract admin
 * @property {BigInt[]} prices - prices
 * @property {number} timestamp - timestamp
 * @property {Date} maxTime - tx max time
 * @property {number} [protocol] - protocol version
 */

/**
 * @typedef {Object} OracleFeeConfigUpdate
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {{fee: BigInt, token: string}} update - fee config update
 */

/**
 * @param {InitOptions} initOptions - oracle client
 * @returns {Promise<OracleInitTransaction>}
 */
async function buildOracleInitTransaction(initOptions) {
    const {account, config, sorobanRpc, network, maxTime, fee, protocol} = initOptions
    const {admin, assets, baseAsset, decimals, contractId, period, timeframe, feeConfig, cacheSize} = config
    const oracleClient = new OracleClient(network, sorobanRpc, contractId)
    const configObject = {
        admin,
        assets: assets.map(a => a.toOracleContractAsset(network)),
        baseAsset: baseAsset.toOracleContractAsset(network),
        decimals: decimals || initOptions.decimals, //legacy support. config.decimals will be removed in the future
        historyRetentionPeriod: period,
        resolution: timeframe
    }
    let fn = "config_v1"
    if (protocol > 1) {
        fn = "config"
        configObject.cacheSize = cacheSize
        configObject.feeConfig = feeConfig
    }
    const tx = await oracleClient[fn](
        account,
        configObject,
        {fee, networkPassphrase: network, timebounds: {minTime: 0, maxTime}}
    )
    return new OracleInitTransaction(tx, 1, config)
}

/**
 * @param {PriceUpdateOptions} priceUpdateOptions - price update options
 * @returns {Promise<PriceUpdatePendingTransaction>}
 */
async function buildOraclePriceUpdateTransaction(priceUpdateOptions) {
    const {network, sorobanRpc, contractId, admin, prices, timestamp, fee, account, maxTime, protocol} = priceUpdateOptions
    const oracleClient = new OracleClient(network, sorobanRpc, contractId)
    const fn = protocol > 1 ? "setPrices" : "setPrices_v1"
    const tx = await oracleClient[fn](
        account,
        {
            admin,
            prices,
            timestamp
        },
        {fee, networkPassphrase: network, timebounds: {minTime: 0, maxTime}}
    )
    return new PriceUpdatePendingTransaction(tx, timestamp, prices)
}

/**
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {OraclePeriodUpdate} update - period update
 * @returns {Promise<OracleHistoryPeriodUpdateTransaction>}
 */
async function buildOracleHistoryPeriodUpdateTransaction(sorobanRpc, account, txOptions, update) {
    const oracleClient = new OracleClient(txOptions.networkPassphrase, sorobanRpc, update.contractId)
    const tx = await oracleClient.setHistoryRetentionPeriod(
        account,
        {admin: update.admin, historyRetentionPeriod: update.historyRetentionPeriod},
        txOptions
    )
    return new OracleHistoryPeriodUpdateTransaction(tx, update.timestamp, update.historyRetentionPeriod)
}

/**
 * @param {strings} sorobanRpc - soroban rpc urls
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {OracleAssetsUpdate} update - pending update
 * @returns {Promise<OracleAssetsUpdateTransaction>}
 */
async function buildOracleAssetsUpdateTransaction(sorobanRpc, account, txOptions, update) {
    const oracleClient = new OracleClient(txOptions.networkPassphrase, sorobanRpc, update.contractId)
    const tx = await oracleClient.addAssets(
        account,
        {
            admin: update.admin,
            assets: update.assets.map(a => a.toOracleContractAsset(txOptions.networkPassphrase))
        },
        txOptions
    )
    return new OracleAssetsUpdateTransaction(tx, update.timestamp, update.assets)
}

/**
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {OracleCacheSizeUpdate} update - pending update
 * @return {Promise<OracleCacheSizeUpdateTransaction>}
 */
async function buildOracleCacheSizeUpdateTransaction(sorobanRpc, account, txOptions, update) {
    const oracleClient = new OracleClient(txOptions.networkPassphrase, sorobanRpc, update.contractId)
    const tx = await oracleClient.setCacheSize(
        account,
        {admin: update.admin, cacheSize: update.cacheSize},
        txOptions
    )
    return new OracleCacheSizeUpdateTransaction(tx, update.timestamp, update.cacheSize)
}


/**
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {OracleInvocationCostsUpdate} update - pending update
 * @return {Promise<OracleInvocationCostsUpdateTransaction>}
 */
async function buildOracleInvocationCostsUpdateTransaction(sorobanRpc, account, txOptions, update) {
    const oracleClient = new OracleClient(txOptions.networkPassphrase, sorobanRpc, update.contractId)
    const tx = await oracleClient.setInvocationCosts(
        account,
        {admin: update.admin, invocationCosts: update.invocationCosts},
        txOptions
    )
    return new OracleInvocationCostsUpdateTransaction(tx, update.timestamp, update.invocationCosts)
}

/**
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {OracleFeeConfigUpdate} update - pending update
 * @returns {Promise<OracleFeeConfigUpdateTransaction>}
 */
async function buildOracleFeeConfigUpdateTransaction(sorobanRpc, account, txOptions, update) {
    const oracleClient = new OracleClient(txOptions.networkPassphrase, sorobanRpc, update.contractId)
    const tx = await oracleClient.setFeeConfig(
        account,
        {
            admin: update.admin,
            feeConfig: update.feeConfig
        },
        txOptions
    )
    return new OracleFeeConfigUpdateTransaction(tx, update.timestamp, update.feeConfig)
}

module.exports = {
    buildOracleInitTransaction,
    buildOracleHistoryPeriodUpdateTransaction,
    buildOracleAssetsUpdateTransaction,
    buildOraclePriceUpdateTransaction,
    buildOracleCacheSizeUpdateTransaction,
    buildOracleFeeConfigUpdateTransaction,
    buildOracleInvocationCostsUpdateTransaction
}