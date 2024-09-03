const {OracleClient} = require('@reflector/oracle-client')
const OracleInitTransaction = require('../../models/transactions/oracle/init-transaction')
const PriceUpdatePendingTransaction = require('../../models/transactions/oracle/price-update-transaction')
const OraclePeriodUpdateTransaction = require('../../models/transactions/oracle/period-update-transaction')
const OracleAssetsUpdateTransaction = require('../../models/transactions/oracle/assets-update-transaction')

/**
 * @typedef {import('../../models/updates/oracle/assets-update')} OracleAssetsUpdate
 * @typedef {import('../../models/updates/nodes-update')} NodesUpdate
 * @typedef {import('../../models/updates/oracle/period-update')} OraclePeriodUpdate
 * @typedef {import('../../models/updates/wasm-update')} WasmUpdate
 * @typedef {import('../../models/configs/oracle-config')} OracleConfig
 * @typedef {import('../../models/configs/config')} Config
 * @typedef {import('../../models/configs/config-envelope')} ConfigEnvelope
 * @typedef {import('@stellar/stellar-sdk').Account} Account
 * @typedef {import('../../models/transactions/pending-transaction-base')} PendingTransactionBase
 */


/**
 * @typedef {Object} UpdateOptions
 * @property {string} network - network
 * @property {string[]} sorobanRpc - soroban rpc urls
 * @property {Config} currentConfig - current contract config
 * @property {Config} newConfig - pending contract config
 * @property {Account} account - account
 * @property {number} timestamp - timestamp
 * @property {Date} maxTime - tx max time
 * @property {number} fee - fee
 */

/**
 * @typedef {Object} InitOptions
 * @property {string} network - network
 * @property {string[]} sorobanRpc - soroban rpc urls
 * @property {OracleConfig} config - contract config
 * @property {Account} account - account
 * @property {Date} maxTime - tx max time
 * @property {number} fee - fee
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
 */

/**
 * @param {InitOptions} initOptions - oracle client
 * @returns {Promise<OracleInitTransaction>}
 */
async function buildOracleInitTransaction(initOptions) {
    const {account, config, sorobanRpc, network, maxTime, fee} = initOptions
    const {admin, assets, baseAsset, decimals, contractId, period, timeframe} = config
    const oracleClient = new OracleClient(network, sorobanRpc, contractId)
    const tx = await oracleClient.config(
        account,
        {
            admin,
            assets: assets.map(a => a.toOracleContractAsset(network)),
            period,
            baseAsset: baseAsset.toOracleContractAsset(network),
            decimals: decimals || initOptions.decimals, //legacy support. config.decimals will be removed in the future
            resolution: timeframe
        },
        {fee, networkPassphrase: network, timebounds: {minTime: 0, maxTime}}
    )
    return new OracleInitTransaction(tx, 1, config)
}

/**
 * @param {PriceUpdateOptions} priceUpdateOptions - price update options
 * @returns {Promise<PriceUpdatePendingTransaction>}
 */
async function buildOraclePriceUpdateTransaction(priceUpdateOptions) {
    const {network, sorobanRpc, contractId, admin, prices, timestamp, fee, account, maxTime} = priceUpdateOptions
    const oracleClient = new OracleClient(network, sorobanRpc, contractId)
    const tx = await oracleClient.setPrice(
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
 * @returns {Promise<OraclePeriodUpdateTransaction>}
 */
async function buildOraclePeriodUpdateTransaction(sorobanRpc, account, txOptions, update) {
    const orcaleClient = new OracleClient(txOptions.networkPassphrase, sorobanRpc, update.contractId)
    const tx = await orcaleClient.setPeriod(
        account,
        {admin: update.admin, period: update.period},
        txOptions
    )
    return new OraclePeriodUpdateTransaction(tx, update.timestamp, update.period)
}

/**
 * @param {strings} sorobanRpc - soroban rpc urls
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {OracleAssetsUpdate} update - pending update
 * @returns {Promise<OracleAssetsUpdateTransaction>}
 */
async function buildOracleAssetsUpdateTransaction(sorobanRpc, account, txOptions, update) {
    const orcaleClient = new OracleClient(txOptions.networkPassphrase, sorobanRpc, update.contractId)
    const tx = await orcaleClient.addAssets(
        account,
        {
            admin: update.admin,
            assets: update.assets.map(a => a.toOracleContractAsset(txOptions.networkPassphrase))
        },
        txOptions
    )
    return new OracleAssetsUpdateTransaction(tx, update.timestamp, update.assets)
}

module.exports = {
    buildOracleInitTransaction,
    buildOraclePeriodUpdateTransaction,
    buildOracleAssetsUpdateTransaction,
    buildOraclePriceUpdateTransaction
}