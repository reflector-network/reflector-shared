const {TransactionBuilder, Operation} = require('@stellar/stellar-sdk')
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
 * @typedef {import('@stellar/stellar-sdk').Account} Account
 * @typedef {import('./models/transactions/pending-transaction-base')} PendingTransactionBase
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
 */

/**
 * @typedef {Object} InitOptions
 * @property {string} network - network
 * @property {string[]} sorobanRpc - soroban rpc urls
 * @property {ContractConfig} config - contract config
 * @property {Account} account - account
 * @property {Date} maxTime - tx max time
 */

/**
 * @typedef {Object} PriceUpdateOptions
 * @property {Account} account - account
 * @property {string} network - network
 * @property {number} fee - fee
 * @property {string[]} sorobanRpc - soroban rpc urls
 * @property {string} oracleId - oracle id
 * @property {string} admin - oracle admin
 * @property {BigInt[]} prices - prices
 * @property {number} timestamp - timestamp
 * @property {Date} maxTime - tx max time
 */

/**
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @param {function(string):Promise<PendingTransactionBase>} updateFn - update function
 * @returns {Promise<PendingTransactionBase>}
 */
async function __buildUpdate(sorobanRpc, updateFn) {
    const errors = []
    for (const sorobanRpcUrl of sorobanRpc) {
        try {
            return await updateFn(sorobanRpcUrl)
        } catch (e) {
            //if soroban rpc url failed, try next one
            console.debug(`Failed to build update. Soroban RPC url: ${sorobanRpcUrl}, error: ${e.message}`)
            errors.push(e)
        }
    }
    for (const e of errors) {
        console.error(e)
    }
    throw new Error('Failed to build update.')
}

/**
 * @param {InitOptions} initOptions - oracle client
 * @returns {Promise<InitPendingTransaction>}
 */
async function buildInitTransaction(initOptions) {
    const {account, config, sorobanRpc, network, maxTime} = initOptions
    const {admin, assets, baseAsset, decimals, fee, oracleId, period, timeframe} = config
    const buildFn = async (sorobanRpcUrl) => {
        const oracleClient = new OracleClient(network, sorobanRpcUrl, oracleId)
        const tx = await oracleClient.config(
            account,
            {
                admin,
                assets: assets.map(a => a.toOracleContractAsset(network)),
                period,
                baseAsset: baseAsset.toOracleContractAsset(network),
                decimals,
                resolution: timeframe
            },
            {fee, networkPassphrase: network, timebounds: {minTime: 0, maxTime}}
        )
        return new InitPendingTransaction(tx, 1, config)
    }
    return await __buildUpdate(sorobanRpc, buildFn)
}

/**
 * @param {PriceUpdateOptions} priceUpdateOptions - price update options
 * @returns {Promise<PriceUpdatePendingTransaction>}
 */
async function buildPriceUpdateTransaction(priceUpdateOptions) {
    const {network, sorobanRpc, oracleId, admin, prices, timestamp, fee, account, maxTime} = priceUpdateOptions
    const buildFn = async (sorobanRpcUrl) => {
        const oracleClient = new OracleClient(network, sorobanRpcUrl, oracleId)
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
    return await __buildUpdate(sorobanRpc, buildFn)
}

/**
 * @param {UpdateOptions} updateOptions - transaction options
 * @returns {Promise<AssetsPendingTransaction|NodesPendingTransaction|PeriodPendingTransaction|ContractPendingTransaction>}
 */
async function buildUpdateTransaction(updateOptions) {
    const txOptions = {fee: 10000000, networkPassphrase: updateOptions.network, timebounds: {minTime: 0, maxTime: updateOptions.maxTime}}
    let tx = null
    const allUpdates = buildUpdates(updateOptions.timestamp, updateOptions.currentConfig, updateOptions.newConfig)
    if (!allUpdates || allUpdates.size === 0)
        throw new Error('No updates found')

    const updates = [...allUpdates.values()]
    const blockchainUpdates = updates.filter(u => u)
    if (blockchainUpdates.length === 0)
        return null //no updates that must bu applied on blockchain

    const update = updates[0]
    if (update.oracleId) {
        const contractConfig = updateOptions.currentConfig.contracts.get(update.oracleId)
        if (!contractConfig)
            throw new Error(`Contract config not found for oracle id: ${update.oracleId}`)
        txOptions.fee = contractConfig.fee
    }
    switch (update.type) {
        case UpdateType.ASSETS:
            tx = await buildAssetsUpdate(updateOptions.sorobanRpc, updateOptions.account, txOptions, update)
            break
        case UpdateType.NODES: {
            const admins = [
                ...[...updateOptions.currentConfig.contracts.values()].map(c => c.admin),
                updateOptions.currentConfig.systemAccount
            ]
            tx = buildNodesUpdate(
                updateOptions.account,
                txOptions,
                update,
                admins.sort((a, b) => a.localeCompare(b)) //sort to have same order in all transactions
            )
        }
            break
        case UpdateType.PERIOD:
            tx = await buildPeriodUpdate(updateOptions.sorobanRpc, updateOptions.account, txOptions, update)
            break
        case UpdateType.WASM:
            //TODO: create wasm update contract so we could have single tx
            //tx = await buildContractUpdate(updateOptions.sorobanRpc, account, txOptions, update)
            throw new Error('Wasm update is not supported yet')
        default:
            break //no updates that must bu applied on blockchain
    }
    return tx
}

/**
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {ContractUpdate} update - contract update
 * @returns {Promise<ContractPendingTransaction>}
 */
async function buildContractUpdate(sorobanRpc, account, txOptions, update) {
    const buildFn = async (sorobanRpcUrl) => {
        const orcaleClient = new OracleClient(txOptions.network, sorobanRpcUrl, update.oracleId)
        const tx = await orcaleClient.updateContract(
            account,
            {admin: update.admin, wasmHash: update.wasmHash},
            txOptions
        )
        return new ContractPendingTransaction(tx, update.timestamp, update.wasmHash)
    }
    return await __buildUpdate(sorobanRpc, buildFn)
}

/**
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {PeriodUpdate} update - period update
 * @returns {Promise<PeriodPendingTransaction>}
 */
async function buildPeriodUpdate(sorobanRpc, account, txOptions, update) {
    const buildFn = async (sorobanRpcUrl) => {
        const orcaleClient = new OracleClient(txOptions.networkPassphrase, sorobanRpcUrl, update.oracleId)
        const tx = await orcaleClient.setPeriod(
            account,
            {admin: update.admin, period: update.period},
            txOptions
        )
        return new PeriodPendingTransaction(tx, update.timestamp, update.period)
    }
    return await __buildUpdate(sorobanRpc, buildFn)
}

/**
 * @param {strings} sorobanRpc - soroban rpc urls
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {AssetsUpdate} update - pending update
 * @returns {Promise<AssetsPendingTransaction>}
 */
async function buildAssetsUpdate(sorobanRpc, account, txOptions, update) {
    const buildFn = async (sorobanRpcUrl) => {
        const orcaleClient = new OracleClient(txOptions.networkPassphrase, sorobanRpcUrl, update.oracleId)
        const tx = await orcaleClient.addAssets(
            account,
            {
                admin: update.admin,
                assets: update.assets.map(a => a.toOracleContractAsset(txOptions.networkPassphrase))
            },
            txOptions
        )
        return new AssetsPendingTransaction(tx, update.timestamp, update.assets)
    }
    return await __buildUpdate(sorobanRpc, buildFn)
}

/**
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {NodesUpdate} update - nodes update
 * @param {string[]} admins - oracle admins and system account
 * @returns {NodesPendingTransaction|null}
 */
function buildNodesUpdate(account, txOptions, update, admins) {
    const txBuilder = new TransactionBuilder(account, txOptions)

    let isOptionsChanged = false
    let threshold = update.currentNodes.size
    const currentNodeKeys = new Set([...update.currentNodes.keys()])
    const newNodeKeys = new Set([...update.newNodes.keys()])
    const allNodeKeys = new Set([...currentNodeKeys.values(), ...newNodeKeys.values()])
    const signerOperations = []
    for (const nodePubkey of allNodeKeys) {
        const presentInCurrent = currentNodeKeys.has(nodePubkey)
        const presentInNew = newNodeKeys.has(nodePubkey)
        if (presentInCurrent && presentInNew)
            continue //node already exists, and not removed. Skip
        const weight = presentInNew ? 1 : 0
        threshold += presentInNew ? 1 : -1
        signerOperations.push({
            ed25519PublicKey: nodePubkey,
            weight
        })
        isOptionsChanged = true
    }
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
    return new NodesPendingTransaction(txBuilder.build(), update.timestamp, update.newNodes)
}

module.exports = {
    buildInitTransaction,
    buildUpdateTransaction,
    buildPriceUpdateTransaction
}