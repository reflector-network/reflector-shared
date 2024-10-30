const ValidationError = require('../models/validation-error')
const OracleAssetsUpdate = require('../models/updates/oracle/assets-update')
const NodesUpdate = require('../models/updates/nodes-update')
const OraclePeriodUpdate = require('../models/updates/oracle/period-update')
const WasmUpdate = require('../models/updates/wasm-update')
const Config = require('../models/configs/config')
const ContractsUpdate = require('../models/updates/contracts-update')
const ConfigUpdate = require('../models/updates/config-update')
const ContractTypes = require('../models/configs/contract-type')
const SubscriptionsFeeUpdate = require('../models/updates/subscriptions/base-fee-update')
const DAODepositsUpdate = require('../models/updates/dao/deposits-update')
const {isAllowedValidatorsUpdate} = require('../utils/majority-helper')

/**
 * Builds updates from current config and new config
 * @param {BigInt} timestamp - timestamp of the update
 * @param {Config} currentConfig - current config
 * @param {Config} newConfig - new config
 * @returns {Map<string, NodesUpdate|WasmUpdate|ContractsUpdate|OracleAssetsUpdate|OraclePeriodUpdate|SubscriptionsFeeUpdate|null>} updates grouped by contract id
 */
function buildUpdates(timestamp, currentConfig, newConfig) {
    if (!(currentConfig instanceof Config))
        throw new ValidationError('currentConfig is not Config type')
    if (!currentConfig.isValid)
        throw new ValidationError('currentConfig is not valid')

    if (!(newConfig instanceof Config))
        throw new ValidationError('newConfig is not Config type')
    if (!newConfig.isValid)
        throw new ValidationError('newConfig is not valid')

    if (newConfig.equals(currentConfig, true))
        return new Map()


    const globalUpdate = __tryGetGlobalUpdate(timestamp, currentConfig, newConfig)
    const contractsUpdate = __tryGetContractsUpdate(timestamp, currentConfig.contracts, newConfig.contracts)
    if (globalUpdate && contractsUpdate)
        throw new ValidationError('Global update can not be combined with contracts update')
    else if (!globalUpdate && !contractsUpdate) //if no updates found, but the configs are different, return config update
        return new Map([[null, new ConfigUpdate(timestamp, newConfig, currentConfig)]])

    if (globalUpdate) {
        const updates = new Map()
        updates.set(null, globalUpdate)
        return updates
    }

    const updates = [...contractsUpdate.values()]
    const blockchainUpdates = updates.filter(u => u)
    if (blockchainUpdates.length > 1) //if multiple updates, and some require blockchain update, throw error
        throw new ValidationError('Multiple blockchain updates are not supported')
    else if (blockchainUpdates.length > 0 && updates.length > 1) //if multiple updates, and some require blockchain update, throw error
        throw new ValidationError('Combined multiple updates are not supported')

    if (contractsUpdate)
        return contractsUpdate
}

/**
 * Tries to get global update
 * @param {BigInt} timestamp
 * @param {Config} currentConfig
 * @param {Config} newConfig
 * @returns {UpdateBase}
 */
function __tryGetGlobalUpdate(timestamp, currentConfig, newConfig) {
    let globalUpdate = null
    function setGlobalUpdate(update) {
        if (!update)
            return
        if (globalUpdate)
            throw new ValidationError('Only one global update can be applied at a time')
        globalUpdate = update
    }
    setGlobalUpdate(__tryGetNodesUpdate(timestamp, currentConfig.nodes, newConfig.nodes))

    setGlobalUpdate(__tryGetWasmUpdate(timestamp, currentConfig.wasmHash, newConfig.wasmHash))

    const contractChanges = __getChanges(newConfig.contracts, currentConfig.contracts)
    if (contractChanges.added.length > 0 || contractChanges.removed.length > 0)
        setGlobalUpdate(new ContractsUpdate(timestamp, newConfig.contracts, currentConfig.contracts))

    return globalUpdate
}

/**
 * Tries to get nodes update
 * @param {BigInt} timestamp
 * @param {Map<string, Node>} currentNodes
 * @param {Map<string, Node>} newNodes
 * @returns {NodesUpdate}
 */
function __tryGetNodesUpdate(timestamp, currentNodes, newNodes) {
    if (!isAllowedValidatorsUpdate([...currentNodes.keys()], [...newNodes.keys()]))
        throw new ValidationError('Majority can\'t be reached with current nodes update')
    const changes = __getChanges(newNodes, currentNodes)
    if (changes.added.length === 0 && changes.removed.length === 0 && changes.modified.length === 0)
        return null
    const modified = changes.added.concat(changes.modified).concat(changes.removed)
    if (modified.length === 0)
        return null
    return new NodesUpdate(timestamp, newNodes, currentNodes)
}

/**
 * Tries to get assets update
 * @param {BigInt} timestamp - timestamp of the update
 * @param {Map<string, ContractConfigBase>} currentConfigs - current contract configs
 * @param {Map<string, ContractConfigBase>} newConfigs - new contract configs
 * @returns {Map<string, UpdateBase>}
 */
function __tryGetContractsUpdate(timestamp, currentConfigs, newConfigs) {
    const changes = __getChanges(newConfigs, currentConfigs)
    if (changes.modified.length === 0)
        return null

    const updates = new Map()
    changes.modified.forEach(({newItem: newConfig, currentItem: currentConfig}) => {
        let contractUpdate = null
        function setContractUpdate(update) {
            if (contractUpdate)
                throw new ValidationError(`Contract ${currentConfig.contractId}. Only one update can be applied at a time`)
            contractUpdate = update
            updates.set(newConfig.contractId, contractUpdate)
        }
        if (newConfig.contractId !== currentConfig.contractId)
            throw new ValidationError(`Contract ${currentConfig.contractId}. Contract id can not be modified`)
        if (newConfig.admin !== currentConfig.admin)
            throw new ValidationError(`Contract ${currentConfig.admin}. Admin can not be modified`)
        if (newConfig.type !== currentConfig.type)
            throw new ValidationError(`Contract ${currentConfig.type}. Type can not be modified`)
        if (newConfig.type === ContractTypes.ORACLE) {
            if (!newConfig.baseAsset.equals(currentConfig.baseAsset))
                throw new ValidationError(`Contract ${currentConfig.contractId}. Base asset can not be modified`)
            if (newConfig.timeframe !== currentConfig.timeframe)
                throw new ValidationError(`Contract ${currentConfig.contractId}. Timeframe can not be modified`)
            if (newConfig.decimals !== currentConfig.decimals)
                throw new ValidationError(`Contract ${currentConfig.contractId}. Decimals can not be modified`)
            setContractUpdate(
                __tryGetAssetsUpdate(timestamp, newConfig.contractId, newConfig.admin, currentConfig.assets, newConfig.assets)
            )

            if (newConfig.period !== currentConfig.period)
                setContractUpdate(new OraclePeriodUpdate(timestamp, newConfig.contractId, newConfig.admin, newConfig.period))
        } else if (newConfig.type === ContractTypes.SUBSCRIPTIONS) {
            if (newConfig.token !== currentConfig.token)
                throw new ValidationError(`Contract ${currentConfig.contractId}. Token can not be modified`)
            if (newConfig.baseFee !== currentConfig.baseFee)
                setContractUpdate(new SubscriptionsFeeUpdate(timestamp, newConfig.contractId, newConfig.admin, newConfig.baseFee))
        } else if (newConfig.type === ContractTypes.DAO) {
            if (newConfig.token !== currentConfig.token)
                throw new ValidationError(`Contract ${currentConfig.contractId}. Token can not be modified`)
            if (newConfig.initAmount !== currentConfig.initAmount)
                throw new ValidationError(`Contract ${currentConfig.contractId}. Init amount can not be modified`)
            if (newConfig.startDate !== currentConfig.startDate)
                throw new ValidationError(`Contract ${currentConfig.contractId}. Start date can not be modified`)
            setContractUpdate(
                __tryGetDepositsUpdate(
                    timestamp,
                    newConfig.contractId,
                    newConfig.admin,
                    currentConfig.depositParams,
                    newConfig.depositParams
                )
            )
        }
        updates.set(newConfig.contractId, contractUpdate)
    })

    return updates
}

/**
 * Tries to get deposits update
 * @param {BigInt} timestamp
 * @param {string} contractId
 * @param {string} admin
 * @param {Map<number, string>} currentDeposits
 * @param {Map<number, string>} newDeposits
 * @returns {DAODepositsUpdate}
 */
function __tryGetDepositsUpdate(timestamp, contractId, admin, currentDeposits, newDeposits) {
    const changes = __getChanges(newDeposits, currentDeposits)
    if (changes.added.length === 0 && changes.removed.length === 0 && changes.modified.length === 0)
        return null
    return new DAODepositsUpdate(timestamp, contractId, admin, newDeposits)
}

/**
 * Tries to get assets update
 * @param {BigInt} timestamp
 * @param {string} contractId
 * @param {string} admin
 * @param {Asset[]} currentAssets
 * @param {Asset[]} newAssets
 * @returns {OracleAssetsUpdate}
 */
function __tryGetAssetsUpdate(timestamp, contractId, admin, currentAssets, newAssets) {
    const assetsChanges = __getArrayChanges(newAssets, currentAssets, 'code', `${contractId}:assets`)
    if (assetsChanges.removed.length > 0 || assetsChanges.modified.length > 0)
        throw new ValidationError(`Contract ${contractId}. Assets can not be modified or removed`)

    if (assetsChanges.added.length === 0)
        return null
    //check that all current assets are in new assets
    for (let i = 0; i < currentAssets.length; i++) {
        if (!currentAssets[i].equals(newAssets[i]))
            throw new ValidationError(`Contract ${contractId}. Assets can not be modified or removed`)
    }
    return new OracleAssetsUpdate(timestamp, contractId, admin, assetsChanges.added)
}


/**
 * Tries to get wasm update
 * @param {BigInt} timestamp
 * @param {Map<string, string>} currentWasm
 * @param {Map<string, string>} newWasm
 * @returns {WasmUpdate}
 */
function __tryGetWasmUpdate(timestamp, currentWasm, newWasm) {
    const changes = __getChanges(newWasm, currentWasm)

    if (changes.added.length === 0 && changes.modified.length === 0 && changes.removed.length === 0)
        return null

    if (changes.removed.length > 0)
        throw new ValidationError('Wasm can not be removed')

    if (changes.added.length > 0 && changes.modified.length > 0)
        throw new ValidationError('Only one wasm update can be applied at a time')

    const newWasmHash = changes.added.length > 0 ? changes.added[0] : changes.modified[0].newItem

    return new WasmUpdate(timestamp, newWasmHash.hash, newWasmHash.type)
}

/**
 * Compares two maps and returns changes. All items must have have equals method
 * @param {Map<string, any>} newMap - array to compare
 * @param {Map<string, any>} currentMap - array to compare
 * @returns {{
 *  added: Object[],
 *  removed: Object[],
 *  modified: {newItem: Object, currentItem: Object}[],
 *  unmodified: Object[],
 *  new: Map<string, Object>,
 *  current: Map<string, Object>
 * }}
 */
function __getChanges(newMap, currentMap) {
    const changes = {
        added: [],
        removed: [],
        modified: [],
        unmodified: [],
        new: newMap,
        current: currentMap
    }

    if (changes.new.size === 0) {
        changes.removed = [...changes.current.values()]
        return changes
    }

    const allKeys = new Set([...changes.new.keys(), ...changes.current.keys()])

    allKeys.forEach(key => {
        const newItem = changes.new.get(key)
        const currentItem = changes.current.get(key)
        if (newItem && !currentItem) {
            changes.added.push(newItem)
        } else if (!newItem && currentItem) {
            changes.removed.push(currentItem)
        } else if (newItem && currentItem) {
            if (newItem.equals && newItem.equals(currentItem) || newItem === currentItem) {
                changes.unmodified.push(newItem)
            } else {
                changes.modified.push({newItem, currentItem})
            }
        }
    })

    return changes
}

/**
 * Compares two arrays and returns changes. All items must have unique key property, and have equals method
 * @param {Object[]} newArray - array to compare
 * @param {Object[]} currentArray - array to compare
 * @param {string} keyProperty - property to compare
 * @param {string} source - source of array
 * @returns {{
 *  added: Object[],
 *  removed: Object[],
 *  modified: {newItem: Object, currentItem: Object}[],
 *  unmodified: Object[],
 *  new: Map<string, Object>,
 *  current: Map<string, Object>
 * }}
 */
function __getArrayChanges(newArray, currentArray, keyProperty, source) {
    const newMap = new Map(newArray.map(item => [item[keyProperty], item]))
    const currentMap = new Map(currentArray.map(item => [item[keyProperty], item]))

    if (newMap.size !== newArray.length)
        throw new ValidationError(`Duplicated ${keyProperty} found in ${source}`)

    return __getChanges(newMap, currentMap, keyProperty, source)
}

module.exports = {
    buildUpdates
}