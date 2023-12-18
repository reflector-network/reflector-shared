const ValidationError = require('./models/validation-error')
const AssetsUpdate = require('./models/updates/assets-update')
const NodesUpdate = require('./models/updates/nodes-update')
const PeriodUpdate = require('./models/updates/period-update')
const WasmUpdate = require('./models/updates/wasm-update')
const Config = require('./models/configs/config')

/**
 * Builds updates from current config and new config
 * @param {BigInt} timestamp
 * @param {Config} currentConfig
 * @param {Config} newConfig
 * @returns {Map<string, UpdateBase} updates grouped by contract id
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

    if (newConfig.equals(currentConfig))
        return new Map()

    /**
     * @type {Map<string, UpdateBase>}
     */
    const globalUpdate = __tryGetGlobalUpdate(timestamp, currentConfig, newConfig)
    const contractsUpdate = __tryGetContractsUpdate(timestamp, currentConfig.contracts, newConfig.contracts)
    if (globalUpdate && contractsUpdate && contractsUpdate.size > 0)
        throw new ValidationError('Global update can not be combined with contracts update')
    if (globalUpdate) {
        const updates = new Map()
        updates.set(null, globalUpdate)
        return updates
    }
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
        if (globalUpdate)
            throw new ValidationError('Only one global update can be applied at a time')
        globalUpdate = update
    }
    setGlobalUpdate(__tryGetNodesUpdate(timestamp, currentConfig.nodes, newConfig.nodes))

    setGlobalUpdate(__tryGetWasmUpdate(timestamp, currentConfig.wasmHash, newConfig.wasmHash))
    return globalUpdate
}

/**
 * Tries to get wasm update
 * @param {BigInt} timestamp
 * @param {string} currentWasm
 * @param {string} newWasm
 * @returns {WasmUpdate}
 */
function __tryGetWasmUpdate(timestamp, currentWasm, newWasm) {
    if (currentWasm === newWasm)
        return null
    if (!newWasm)
        throw new ValidationError('Wasm can not be removed')
    return new WasmUpdate(timestamp, newWasm)
}

/**
 * Tries to get nodes update
 * @param {BigInt} timestamp
 * @param {Map<string, Node>} currentNodes
 * @param {Map<string, Node>} newNodes
 * @returns {NodesUpdate}
 */
function __tryGetNodesUpdate(timestamp, currentNodes, newNodes) {
    const changes = __getChanges(newNodes.values(), currentNodes.values(), 'pubkey', 'nodes')
    if (changes.added.length === 0 && changes.removed.length === 0 && changes.modified.length === 0)
        return null
    const modified = changes.added.concat(changes.modified)
    if (modified.length === 0)
        return null
    return new NodesUpdate(timestamp, newNodes)
}

/**
 * Tries to get assets update
 * @param {BigInt} timestamp
 * @param {Map<string, ContractConfig>} currentConfigs
 * @param {Map<string, ContractConfig>} newConfigs
 * @returns {Map<string, UpdateBase>}
 */
function __tryGetContractsUpdate(timestamp, currentConfigs, newConfigs) {
    const changes = __getChanges(newConfigs, currentConfigs, 'oracleId', 'contracts')
    if (changes.added.length === 0 && changes.removed.length === 0 && changes.modified.length === 0)
        return null

    const updates = new Map()
    changes.modified.forEach(({newItem: newConfig, currentItem: currentConfig}) => {
        if (newConfig.oracleId !== currentConfig.oracleId)
            throw new ValidationError(`Contract ${currentConfig.oracleId}. OracleId can not be modified`)
        if (!newConfig.baseAsset.equals(currentConfig.baseAsset))
            throw new ValidationError(`Contract ${currentConfig.oracleId}. Base asset can not be modified`)
        if (newConfig.timeframe !== currentConfig.timeframe)
            throw new ValidationError(`Contract ${currentConfig.oracleId}. Timeframe can not be modified`)
        if (newConfig.decimals !== currentConfig.decimals)
            throw new ValidationError(`Contract ${currentConfig.oracleId}. Decimals can not be modified`)

        let contractUpdate = null
        function setContractUpdate(update) {
            if (contractUpdate)
                throw new ValidationError(`Contract ${currentConfig.oracleId}. Only one update can be applied at a time`)
            contractUpdate = update
            updates.set(newConfig.oracleId, contractUpdate)
        }
        setContractUpdate(__tryGetAssetsUpdate(timestamp, newConfig.oracleId, newConfig.admin, currentConfig.assets, newConfig.assets))

        if (newConfig.period !== currentConfig.period)
            setContractUpdate(new PeriodUpdate(timestamp, newConfig.oracleId, newConfig.admin, newConfig.period))

        updates.set(newConfig.oracleId, contractUpdate)
    })
    return updates
}

/**
 * Tries to get assets update
 * @param {BigInt} timestamp
 * @param {string} oracleId
 * @param {string} admin
 * @param {Asset[]} currentAssets
 * @param {Asset[]} newAssets
 * @returns {AssetsUpdate}
 */
function __tryGetAssetsUpdate(timestamp, oracleId, admin, currentAssets, newAssets) {
    const assetsChanges = __getChanges(newAssets, currentAssets, 'code', `${oracleId}:assets`)
    if (assetsChanges.removed.length > 0 || assetsChanges.modified.length > 0)
        throw new ValidationError(`Contract ${oracleId}. Assets can not be modified or removed`)

    if (assetsChanges.added.length === 0)
        return null
    //check that all current assets are in new assets
    for (let i = 0; i < currentAssets.length; i++) {
        if (!currentAssets[i].equals(newAssets[i]))
            throw new ValidationError(`Contract ${oracleId}. Assets can not be modified or removed`)
    }
    return new AssetsUpdate(timestamp, oracleId, admin, assetsChanges.added)
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
function __getChanges(newArray, currentArray, keyProperty, source) {
    const changes = {
        added: [],
        removed: [],
        modified: [],
        unmodified: [],
        new: new Map(newArray.map(item => [item[keyProperty], item])),
        current: new Map(currentArray.map(item => [item[keyProperty], item]))
    }

    if (changes.new.size !== newArray.length)
        throw new ValidationError(`Duplicated ${keyProperty} found in ${source}`)

    const allKeys = new Set([...changes.new.keys(), ...changes.current.keys()])

    allKeys.forEach(key => {
        const newItem = changes.new.get(key)
        const currentItem = changes.current.get(key)
        if (newItem && !currentItem) {
            changes.added.push(newItem)
        } else if (!newItem && currentItem) {
            changes.removed.push(currentItem)
        } else if (newItem && currentItem) {
            if (newItem.equals(currentItem)) {
                changes.unmodified.push(newItem)
            } else {
                changes.modified.push({newItem, currentItem})
            }
        }
    })

    return changes
}

module.exports = {
    buildUpdates
}