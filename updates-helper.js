import { StrKey } from 'stellar-base'
import ValidationError from './models/validation-error.js'
import AssetsUpdate from './models/updates/assets-update.js'
import NodesUpdate from './models/updates/nodes-update.js'
import UpdateType from './models/updates/update-type.js'
import PeriodUpdate from './models/updates/period-update.js'
import WasmUpdate from './models/updates/contract-update.js'
import Asset from './models/assets/asset.js'
import { ContractConfig, Config, Node, UpdateBase } from './models/index.js'

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
function getChanges(newArray, currentArray, keyProperty, source) {
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
                changes.modified.push({ newItem, currentItem })
            }
        }
    })

    return changes
}

/**
 * Builds and validates update
 * @param {Object} rawUpdate
 * @param {ContractConfig} contractConfig
 * @returns {UpdateBase}
 */
export function buildAndValidateUpdate(rawUpdate, contractConfig) {
    if (contractConfig.pendingUpdate)
        throw new ValidationError('Pending update already exist')
    if (!rawUpdate.timestamp)
        throw new ValidationError('Timestamp is not defined')
    const update = buildUpdate(rawUpdate, contractConfig.network)
    switch (update.type) {
        case UpdateType.ASSETS:
            update.assets.forEach(asset => {
                if (update.assets.filter(a => a.type === asset.type && a.code === asset.code) > 1)
                    throw new ValidationError(`Asset ${asset.code} is duplicated`)
                if (contractConfig.assets.findIndex(a => a.type === asset.type && a.code === asset.code) >= 0)
                    throw new ValidationError(`Asset ${asset.code} already exist`)
                if (contractConfig.baseAsset.type === asset.type
                    && contractConfig.baseAsset.code === asset.code)
                    throw new ValidationError(`Asset ${asset.code} is base asset`)
            })
            break
        case UpdateType.NODES: {
            update.nodes.forEach(node => {
                if (!StrKey.isValidEd25519PublicKey(node.pubkey))
                    throw new ValidationError(`Node ${node.pubkey} is invalid`)
                if (update.nodes.filter(n => n.pubkey === node.pubkey) > 1)
                    throw new ValidationError(`Node ${node.pubkey} is duplicated`)
            })
            break
        }
        case UpdateType.PERIOD:
            if (update.period <= contractConfig.timeframe)
                throw new ValidationError('Invalid period')
            break
        case UpdateType.WASM:
            if (!update.wasmHash || update.wasmHash.length !== 64)
                throw new ValidationError('Invalid wasm hash')
            break
        default:
            throw new ValidationError('Invalid update type')
    }
    return update
}

/**
 * Sets pending update to contract config
 * @param {Object} rawUpdate
 * @param {ContractConfig} contractConfig
 * @returns {ContractConfig}
 */
export function setUpdate(update, contractConfig) {
    buildAndValidateUpdate(update, contractConfig)
    contractConfig.pendingUpdate = update
    return contractConfig
}

/**
 * Applies pending update to contract config
 * @param {ContractConfig} contractConfig
 * @returns {ContractConfig}
 */
export function applyUpdate(contractConfig) {
    if (!contractConfig.pendingUpdate)
        throw new ValidationError('Pending update do not exist')
    switch (contractConfig.pendingUpdate.type) {
        case UpdateType.ASSETS: {
            contractConfig.assets.push(...contractConfig.pendingUpdate.assets)
            break
        }
        case UpdateType.PERIOD: {
            contractConfig.period = contractConfig.pendingUpdate.period
            break
        }
        case UpdateType.NODES: {
            const updateNodes = contractConfig.pendingUpdate.nodes
            const currentNodes = contractConfig.nodes
            const nodeAddresses = config.nodes
            updateNodes.forEach(node => {
                if (node.remove) {
                    //try remove from contract settings
                    const index = currentNodes.findIndex(pubkey => pubkey === node.pubkey)
                    if (index >= 0)
                        currentNodes.splice(index, 1)
                    const nodeAddress = nodeAddresses.findIndex(n => n.pubkey === node.pubkey)
                    if (nodeAddress >= 0)
                        nodeAddresses.splice(nodeAddress, 1)
                    return
                }
                if (!currentNodes.includes(node.pubkey)) {
                    currentNodes.push(node.pubkey)
                }
                //try add to addresses
                const nodeAddress = nodeAddresses.find(n => n.pubkey === node.pubkey)
                if (!nodeAddress)
                    nodeAddresses.push({ pubkey: node.pubkey, url: node.url })
                else if (nodeAddress.url !== node.url)
                    nodeAddress.url = node.url
            })
            break
        }
        case UpdateType.WASM:
            break
        default:
            throw new ValidationError('Invalid update type')
    }
    contractConfig.pendingUpdate = null
    return contractConfig
}

/**
 * Builds update from raw update
 * @param {Object} rawUpdate
 * @returns {UpdateBase}
 */
export function buildUpdate(rawUpdate) {
    switch (rawUpdate.type) {
        case UpdateType.NODES:
            return new NodesUpdate(rawUpdate.timestamp, rawUpdate.nodes)
        case UpdateType.ASSETS:
            return new AssetsUpdate(
                rawUpdate.timestamp,
                rawUpdate.assets.map(a => new Asset(a.type, a.code))
            )
        case UpdateType.PERIOD:
            return new PeriodUpdate(rawUpdate.timestamp, rawUpdate.period)
        case UpdateType.WASM:
            return new WasmUpdate(rawUpdate.timestamp, rawUpdate.wasmHash)
        default:
            throw new ValidationError('Invalid update type')
    }
}

/**
 * Builds updates from current config and new config
 * @param {BigInt} timestamp
 * @param {Config} currentConfig
 * @param {Config} newConfig
 * @returns {Map<string, UpdateBase[]} updates grouped by contract id
 */
export function buildUpdates(timestamp, currentConfig, newConfig) {
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
 * @param {Node[]} currentNodes
 * @param {Node[]} newNodes
 * @returns {NodesUpdate}
 */
function __tryGetNodesUpdate(timestamp, currentNodes, newNodes) {
    const changes = getChanges(newNodes, currentNodes, 'pubkey', 'nodes')
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
 * @param {ContractConfig[]} currentConfigs
 * @param {ContractConfig[]} newConfigs
 * @returns {Map<string, UpdateBase>}
 */
function __tryGetContractsUpdate(timestamp, currentConfigs, newConfigs) {
    const changes = getChanges(newConfigs, currentConfigs, 'oracleId', 'contracts')
    if (changes.added.length === 0 && changes.removed.length === 0 && changes.modified.length === 0)
        return null

    const updates = new Map()
    changes.modified.forEach(({ newItem: newConfig, currentItem: currentConfig }) => {

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
        setContractUpdate(__tryGetAssetsUpdate(timestamp, currentConfig.assets, newConfig.assets, newConfig.oracleId))

        if (newConfig.period !== currentConfig.period)
            setContractUpdate(new PeriodUpdate(timestamp, newConfig.period))

        updates.set(newConfig.oracleId, contractUpdate)
    })
    return updates
}

/**
 * Tries to get assets update
 * @param {BigInt} timestamp
 * @param {Asset[]} currentAssets
 * @param {Asset[]} newAssets
 * @param {string} oracleId
 * @returns {AssetsUpdate}
 */
function __tryGetAssetsUpdate(timestamp, currentAssets, newAssets, oracleId) {
    const assetsChanges = getChanges(newAssets, currentAssets, 'code', `${oracleId}:assets`)
    if (assetsChanges.removed.length > 0 || assetsChanges.modified.length > 0)
        throw new ValidationError(`Contract ${oracleId}. Assets can not be modified or removed`)

    if (assetsChanges.added.length === 0)
        return null
    //check that all current assets are in new assets
    for (let i = 0; i < currentAssets.length; i++) {
        if (!currentAssets[i].equals(newAssets[i]))
            throw new ValidationError(`Contract ${oracleId}. Assets can not be modified or removed`)
    }
    return new AssetsUpdate(timestamp, assetsChanges.added)
}