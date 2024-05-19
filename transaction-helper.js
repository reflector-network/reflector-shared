const {TransactionBuilder, Operation} = require('@stellar/stellar-sdk')
const OracleClient = require('@reflector/oracle-client')
const {getMajority} = require('./utils/majority-helper')
const {buildUpdates} = require('./updates-helper')
const InitPendingTransaction = require('./models/transactions/init-pending-transaction')
const PriceUpdatePendingTransaction = require('./models/transactions/price-update-pending-transaction')
const UpdateType = require('./models/updates/update-type')
const WasmPendingTransaction = require('./models/transactions/wasm-pending-transaction')
const PeriodPendingTransaction = require('./models/transactions/period-pending-transaction')
const AssetsPendingTransaction = require('./models/transactions/assets-pending-transaction')
const NodesPendingTransaction = require('./models/transactions/nodes-pending-transaction')
const {getContractState} = require('./entries-helper')

/**
 * @typedef {import('./models/updates/update-base')} UpdateBase
 * @typedef {import('./models/updates/assets-update')} AssetsUpdate
 * @typedef {import('./models/updates/nodes-update')} NodesUpdate
 * @typedef {import('./models/updates/period-update')} PeriodUpdate
 * @typedef {import('./models/updates/wasm-update')} WasmUpdate
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
 * @property {number} fee - fee
 */

/**
 * @typedef {Object} InitOptions
 * @property {string} network - network
 * @property {string[]} sorobanRpc - soroban rpc urls
 * @property {ContractConfig} config - contract config
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
 * @property {string} oracleId - oracle id
 * @property {string} admin - oracle admin
 * @property {BigInt[]} prices - prices
 * @property {number} timestamp - timestamp
 * @property {Date} maxTime - tx max time
 */

/**
 * @typedef {Object} ContractHash
 * @property {string} hash - contract hash
 * @property {string} oracleId - oracle id
 */

/**
 * @typedef {Object} WasmUpdateOptions
 * @property {Account} account - account
 * @property {string} network - network
 * @property {number} fee - fee
 * @property {string[]} sorobanRpc - soroban rpc urls
 * @property {string} newHash - new contract hash
 * @property {string} admin - oracle admin
 * @property {BigInt[]} prices - prices
 * @property {number} timestamp - timestamp
 * @property {Date} maxTime - tx max time
 */

/**
 * @param {InitOptions} initOptions - oracle client
 * @returns {Promise<InitPendingTransaction>}
 */
async function buildInitTransaction(initOptions) {
    const {account, config, sorobanRpc, network, maxTime, fee} = initOptions
    const {admin, assets, baseAsset, decimals, oracleId, period, timeframe} = config
    const oracleClient = new OracleClient(network, sorobanRpc, oracleId)
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

/**
 * @param {PriceUpdateOptions} priceUpdateOptions - price update options
 * @returns {Promise<PriceUpdatePendingTransaction>}
 */
async function buildPriceUpdateTransaction(priceUpdateOptions) {
    const {network, sorobanRpc, oracleId, admin, prices, timestamp, fee, account, maxTime} = priceUpdateOptions
    const oracleClient = new OracleClient(network, sorobanRpc, oracleId)
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
 * @param {UpdateOptions} updateOptions - transaction options
 * @returns {Promise<AssetsPendingTransaction|NodesPendingTransaction|PeriodPendingTransaction|WasmPendingTransaction>}
 */
async function buildUpdateTransaction(updateOptions) {
    const {network, maxTime, fee, timestamp, currentConfig, sorobanRpc, newConfig, account} = updateOptions
    const txOptions = {fee, networkPassphrase: network, timebounds: {minTime: 0, maxTime}}
    let tx = null
    const allUpdates = buildUpdates(timestamp, currentConfig, newConfig)
    if (!allUpdates || allUpdates.size === 0)
        throw new Error('No updates found')

    const updates = [...allUpdates.values()]
    const blockchainUpdates = updates.filter(u => u)
    if (blockchainUpdates.length === 0)
        return null //no updates that must bu applied on blockchain

    const update = updates[0]
    if (update.oracleId) {
        const contractConfig = currentConfig.contracts.get(update.oracleId)
        if (!contractConfig)
            throw new Error(`Contract config not found for oracle id: ${update.oracleId}`)
    }
    switch (update.type) {
        case UpdateType.ASSETS:
            tx = await buildAssetsUpdate(sorobanRpc, account, txOptions, update)
            break
        case UpdateType.NODES: {
            const admins = [
                ...[...currentConfig.contracts.values()].map(c => c.admin),
                currentConfig.systemAccount
            ]
            tx = buildNodesUpdate(
                account,
                txOptions,
                update,
                admins.sort((a, b) => a.localeCompare(b)) //sort to have same order in all transactions
            )
        }
            break
        case UpdateType.PERIOD:
            tx = await buildPeriodUpdate(sorobanRpc, account, txOptions, update)
            break
        case UpdateType.WASM: {
            const contractsData = [...currentConfig.contracts.values()]
                .sort((a, b) => a.localeCompare(b))
                .map(c => ({
                    admin: c.admin,
                    contract: c.oracleId,
                    /**
                     * @type {Promise<{hash: string, admin: string, lastTimestamp: BigInt, prices: BigInt[]}>}
                     */
                    contractStatePromise: getContractState(update.oracleId, sorobanRpc)
                }))

            await Promise.allSettled(contractsData.map(c => c.contractStatePromise))

            if (contractsData.some(c => c.contractStatePromise.status === 'rejected'))
                throw new Error(`Failed to get contract state. ${contractsData.find(c => c.contractStatePromise.status === 'rejected').reason?.message}`)

            const contractsToUpdate = contractsData.filter(c => c.contractStatePromise.value.hash !== update.wasmHash)
            if (contractsToUpdate.length === 0)
                break //no updates that must be applied on blockchain
            update.assignContractsToUpdate(contractsToUpdate)
            tx = await buildContractUpdate(sorobanRpc, account, txOptions, update)
            break
        }
        default:
            break //no updates that must be applied on blockchain
    }
    return tx
}

/**
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {WasmUpdate} update - contract update
 * @returns {Promise<WasmPendingTransaction>}
 */
async function buildContractUpdate(sorobanRpc, account, txOptions, update) {
    const contractToUpdate = update.contractsToUpdate[0]
    const orcaleClient = new OracleClient(txOptions.network, sorobanRpc, contractToUpdate.contract)
    const tx = await orcaleClient.updateContract(
        account,
        {admin: contractToUpdate.admin, wasmHash: update.wasmHash},
        txOptions
    )
    return new WasmPendingTransaction(tx, update.timestamp, update.wasmHash, update.contractsToUpdate.length > 1)
}

/**
 * @param {string[]} sorobanRpc - soroban rpc urls
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {PeriodUpdate} update - period update
 * @returns {Promise<PeriodPendingTransaction>}
 */
async function buildPeriodUpdate(sorobanRpc, account, txOptions, update) {
    const orcaleClient = new OracleClient(txOptions.networkPassphrase, sorobanRpc, update.oracleId)
    const tx = await orcaleClient.setPeriod(
        account,
        {admin: update.admin, period: update.period},
        txOptions
    )
    return new PeriodPendingTransaction(tx, update.timestamp, update.period)
}

/**
 * @param {strings} sorobanRpc - soroban rpc urls
 * @param {Account} account - account
 * @param {any} txOptions - transaction options
 * @param {AssetsUpdate} update - pending update
 * @returns {Promise<AssetsPendingTransaction>}
 */
async function buildAssetsUpdate(sorobanRpc, account, txOptions, update) {
    const orcaleClient = new OracleClient(txOptions.networkPassphrase, sorobanRpc, update.oracleId)
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