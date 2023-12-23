const {TransactionBuilder, Operation} = require('stellar-sdk')
const OracleClient = require('@reflector/oracle-client')
const {getMajority} = require('./utils/majority-helper')
const {buildUpdates} = require('./updates-helper')
const InitPendingTransaction = require('./models/transactions/init-pending-transaction')
const PriceUpdatePendingTransaction = require('./models/transactions/price-update-pending-transaction')
const UpdateType = require('./models/updates/update-type')
const ContractPendingTransaction = require('./models/transactions/contract-pending-transaction')
const PeriodPendingTransaction = require('./models/transactions/period-pending-transaction')
const AssetsPendingTransaction = require('./models/transactions/assets-pending-transaction')
const NodesPendingTransaction = require('./models/transactions/nodes-pending-transaction')

/**
 * @typedef {import('./models/updates/update-base')} UpdateBase
 * @typedef {import('./models/updates/assets-update')} AssetsUpdate
 * @typedef {import('./models/updates/nodes-update')} NodesUpdate
 * @typedef {import('./models/updates/period-update')} PeriodUpdate
 * @typedef {import('./models/updates/wasm-update')} ContractUpdate
 * @typedef {import('./models/configs/contract-config')} ContractConfig
 * @typedef {import('./models/configs/config')} Config
 * @typedef {import('./models/configs/config-envelope')} ConfigEnvelope
 * @typedef {import('stellar-sdk').Account} Account
 */


/**
 * @typedef {Object} UpdateOptions
 * @property {string} network - network
 * @property {string} horizonUrl - horizon url
 * @property {Config} currentConfig - current contract config
 * @property {Config} newConfig - pending contract config
 * @property {Account} account - account
 * @property {number} timestamp - timestamp
 */

/**
 * @typedef {Object} InitOptions
 * @property {string} network - network
 * @property {horizonUrl} horizonUrl - horizon url
 * @property {ContractConfig} config - contract config
 * @property {Account} account - account
 */

/**
 * @typedef {Object} PriceUpdateOptions
 * @property {Account} account - account
 * @property {string} network - network
 * @property {number} fee - fee
 * @property {horizonUrl} horizonUrl - horizon url
 * @property {string} oracleId - oracle id
 * @property {string} admin - oracle admin
 * @property {BigInt[]} prices - prices
 * @property {number} timestamp - timestamp
 */

/**
 * @param {InitOptions} initOptions - oracle client
 * @returns {Promise<InitPendingTransaction>}
 */
async function buildInitTransaction(initOptions) {
    const {account, config, horizonUrl, network} = initOptions
    const {admin, assets, baseAsset, decimals, fee, oracleId, period, timeframe} = config
    const oracleClient = new OracleClient(network, horizonUrl, oracleId)
    const transaction = new InitPendingTransaction(
        await oracleClient.config(
            account,
            {
                admin,
                assets: assets.map(a => a.toOracleContractAsset(network)),
                period,
                baseAsset: baseAsset.toOracleContractAsset(network),
                decimals,
                resolution: timeframe
            },
            {fee, minAccountSequence: '0', networkPassphrase: network}
        ),
        1,
        config)
    return transaction
}

/**
 * @param {PriceUpdateOptions} priceUpdateOptions - price update options
 * @returns {Promise<PriceUpdatePendingTransaction>}
 */
async function buildPriceUpdateTransaction(priceUpdateOptions) {
    const {network, horizonUrl, oracleId, admin, prices, timestamp, fee, account} = priceUpdateOptions
    const txOptions = {fee, minAccountSequence: '0', networkPassphrase: network}
    const oracleClient = new OracleClient(network, horizonUrl, oracleId)
    const tx = await oracleClient.setPrice(
        account,
        {
            admin,
            prices,
            timestamp
        },
        txOptions
    )
    return new PriceUpdatePendingTransaction(tx, timestamp, prices)
}

/**
 * @param {UpdateOptions} updateOptions - transaction options
 * @returns {Promise<AssetsPendingTransaction|NodesPendingTransaction|PeriodPendingTransaction|ContractPendingTransaction>}
 */
async function buildUpdateTransaction(updateOptions) {
    const txOptions = {fee: 1000000, minAccountSequence: '0', networkPassphrase: updateOptions.network}
    let tx = null
    const updates = buildUpdates(updateOptions.timestamp, updateOptions.currentConfig, updateOptions.newConfig)
    if (updates.size === 0)
        return null
    else if (updates.size > 1)
        throw new Error('Multiple updates are not supported')
    const update = [...updates.values()][0]
    if (update.oracleId) {
        const contractConfig = updateOptions.currentConfig.contracts.get(update.oracleId)
        if (!contractConfig)
            throw new Error(`Contract config not found for oracle id: ${update.oracleId}`)
        txOptions.fee = contractConfig.fee
    }
    switch (update.type) {
        case UpdateType.ASSETS:
            tx = await buildAssetsUpdate(updateOptions.horizonUrl, updateOptions.account, txOptions, update)
            break
        case UpdateType.NODES:
            tx = buildNodesUpdate(
                updateOptions.account,
                txOptions,
                update,
                [...updateOptions.currentConfig.contracts.values()].map(c => c.admin)
            )
            break
        case UpdateType.PERIOD:
            tx = await buildPeriodUpdate(updateOptions.horizonUrl, updateOptions.account, txOptions, update)
            break
        case UpdateType.WASM:
            //TODO: create wasm update contract so we could have single tx
            //tx = await buildContractUpdate(updateOptions.horizonUrl, account, txOptions, update)
            throw new Error('Wasm update is not supported yet')
        default:
            throw new Error(`Update type ${update.type} is not supported`)
    }
    return tx
}

/**
 * @param {string} horizonUrl - horizon url
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {ContractUpdate} update - contract update
 * @returns {Promise<ContractPendingTransaction>}
 */
async function buildContractUpdate(horizonUrl, account, txOptions, update) {
    const orcaleClient = new OracleClient(txOptions.network, horizonUrl, update.oracleId)
    const tx = await orcaleClient.updateContract(
        account,
        {admin: account.accountId(), wasmHash: update.wasmHash},
        txOptions
    )
    return new ContractPendingTransaction(tx, update.timestamp, update.wasmHash)
}

/**
 * @param {string} horizonUrl - horizon url
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {PeriodUpdate} update - period update
 * @returns {Promise<PeriodPendingTransaction>}
 */
async function buildPeriodUpdate(horizonUrl, account, txOptions, update) {
    const orcaleClient = new OracleClient(txOptions.networkPassphrase, horizonUrl, update.oracleId)
    const tx = await orcaleClient.setPeriod(
        account,
        {admin: account.accountId(), period: update.period},
        txOptions
    )
    return new PeriodPendingTransaction(tx, update.timestamp, update.period)
}

/**
 * @param {string} horizonUrl - horizon url
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {AssetsUpdate} update - pending update
 * @returns {Promise<AssetsPendingTransaction>}
 */
async function buildAssetsUpdate(horizonUrl, account, txOptions, update) {
    const orcaleClient = new OracleClient(txOptions.networkPassphrase, horizonUrl, update.oracleId)
    try {
        const tx = await orcaleClient.addAssets(
            account,
            {
                admin: update.admin,
                assets: update.assets.map(a => a.toOracleContractAsset(txOptions.networkPassphrase))
            },
            txOptions
        )
        return new AssetsPendingTransaction(tx, update.timestamp, update.assets)
    } catch (e) {
        console.error('Error on building adding assets transaction')
        console.error(e)
        return null
    }
}

/**
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {NodesUpdate} update - nodes update
 * @param {string[]} admins - oracle admins
 * @returns {NodesPendingTransaction|null}
 */
function buildNodesUpdate(account, txOptions, update, admins) {
    const txBuilder = new TransactionBuilder(account, txOptions)

    let isOptionsChanged = false
    let threshold = update.currentNodes.length
    const currentNodeKeys = new Set(...update.currentNodes.keys())
    const newNodeKeys = new Set(...update.newNodes.keys())
    const allNodeKeys = new Set(...currentNodeKeys.values(), ...newNodeKeys.values())
    const signerOperations = []
    for (const nodePubkey of allNodeKeys) {
        const presentInCurrent = update.currentNodes.find(n => n.pubkey === nodePubkey)
        const presentInNew = update.newNodes.find(n => n.pubkey === nodePubkey)
        if (presentInCurrent && presentInNew)
            continue //node already exists, and not removed. Skip
        const weight = presentInNew ? 1 : 0
        threshold += presentInNew ? 1 : -1
        signerOperations.push({
            ed25519PublicKey: nodePubkey,
            weight
        })
    }
    isOptionsChanged = true
    if (!isOptionsChanged)
        return null
    const currentMajority = getMajority(threshold)


    for (const admin of admins) {
        for (const signerOperation of signerOperations) {
            txBuilder.addOperation(Operation.setOptions({
                source: admin,
                signer: signerOperation
            }))
        }
        txBuilder.addOperation(Operation.setOptions({
            source: admin,
            lowThreshold: currentMajority,
            medThreshold: currentMajority,
            highThreshold: currentMajority
        }))
    }
    return new NodesPendingTransaction(txBuilder.setTimeout(0).build(), update.timestamp, update.newNodes)
}

module.exports = {
    buildInitTransaction,
    buildUpdateTransaction,
    buildPriceUpdateTransaction
}