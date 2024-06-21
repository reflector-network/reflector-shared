const {TransactionBuilder, Operation} = require('@stellar/stellar-sdk')
const {OracleClient, SubscriptionsClient} = require('@reflector/oracle-client')
const {getMajority} = require('../../utils/majority-helper')
const {buildUpdates} = require('../updates-helper')
const UpdateType = require('../../models/updates/update-type')
const WasmPendingTransaction = require('../../models/transactions/wasm-pending-transaction')
const NodesPendingTransaction = require('../../models/transactions/nodes-pending-transaction')
const {getContractState} = require('../entries-helper')
const ContractTypes = require('../../models/configs/contract-type')
const {buildOracleAssetsUpdateTransaction, buildOraclePeriodUpdateTransaction} = require('./oracle-transaction-helper')
const {buildSubscriptionFeeUpdateTransaction} = require('./subscriptions-transaction-helper')

/**
 * @typedef {import('../../models/updates/nodes-update')} NodesUpdate
 * @typedef {import('../../models/updates/wasm-update')} WasmUpdate
 * @typedef {import('../../models/configs/config')} Config
 * @typedef {import('@stellar/stellar-sdk').Account} Account
 * @typedef {import('../../models/transactions/oracle/period-update-transaction')} OraclePeriodUpdateTransaction
 * @typedef {import('../../models/transactions/oracle/assets-update-transaction')} OracleAssetsUpdateTransaction
 * @typedef {import('../../models/transactions/subscriptions/fee-update-transaction')} SubscriptionsFeeUpdateTransaction
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
 * @param {UpdateOptions} updateOptions - transaction options
 * @returns {Promise<OracleAssetsUpdateTransaction|NodesPendingTransaction|OraclePeriodUpdateTransaction|WasmPendingTransaction|SubscriptionsFeeUpdateTransaction>}
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
    if (update.contractId) {
        const oracleConfig = currentConfig.contracts.get(update.contractId)
        if (!oracleConfig)
            throw new Error(`Contract config not found for oracle id: ${update.contractId}`)
    }
    switch (update.type) {
        case UpdateType.WASM: {
            const contractsData = [...currentConfig.contracts.values()]
                .filter(c => c.type === update.contractType)
                .sort((a, b) => a.contractId.localeCompare(b.contractId))
                .map(c => ({
                    admin: c.admin,
                    contract: c.contractId
                }))
            for (const conractData of contractsData)
                conractData.contractStatePromise = getContractState(conractData.contract, sorobanRpc)
                    .then(result => {
                        conractData.contractState = result
                    })
                    .catch(error => {
                        conractData.error = error
                        throw new Error(`Failed to get contract state for ${conractData.contract}. ${error.message}`)
                    })

            await Promise.allSettled(contractsData.map(c => c.contractStatePromise))

            if (contractsData.some(c => c.error))
                throw new Error(`Failed to get contract state. ${contractsData.find(c => c.error).error?.message}`)

            const contractsToUpdate = contractsData.filter(c => c.contractState.hash !== update.wasmHash)
            if (contractsToUpdate.length === 0)
                break //no updates that must be applied on blockchain
            update.assignContractsToUpdate(contractsToUpdate)
            tx = await buildContractUpdate(sorobanRpc, account, txOptions, update)
        }
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
        case UpdateType.ORACLE_ASSETS:
            tx = await buildOracleAssetsUpdateTransaction(sorobanRpc, account, txOptions, update)
            break
        case UpdateType.ORACLE_PERIOD:
            tx = await buildOraclePeriodUpdateTransaction(sorobanRpc, account, txOptions, update)
            break
        case UpdateType.SUBSCRIPTIONS_FEE:
            tx = await buildSubscriptionFeeUpdateTransaction(sorobanRpc, account, txOptions, update)
            break
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
    const client = getClientByType(ContractTypes.ORACLE, txOptions.networkPassphrase, sorobanRpc, contractToUpdate.contract)
    const tx = await client.updateContract(
        account,
        {admin: contractToUpdate.admin, wasmHash: update.wasmHash},
        txOptions
    )
    return new WasmPendingTransaction(tx, update.timestamp, update.wasmHash.hash, update.contractsToUpdate.length > 1)
}

function getClientByType(contractType, network, sorobanRpc, contractId) {
    switch (contractType) {
        case ContractTypes.ORACLE:
            return new OracleClient(network, sorobanRpc, contractId)
        case ContractTypes.SUBSCRIPTIONS:
            return new SubscriptionsClient(network, sorobanRpc, contractId)
        default:
            throw new Error(`Unsupported contract type: ${contractType}`)
    }
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
    buildUpdateTransaction
}