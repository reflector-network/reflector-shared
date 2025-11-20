const {StrKey} = require('@stellar/stellar-sdk')
const Node = require('../node')
const {sortObjectKeys} = require('../../utils/serialization-helper')
const {areMapsEqual, mapToPlainObject} = require('../../utils/map-helper')
const {getDataHash, getSignaturePayloadHash} = require('../../helpers/signatures-helper')
const IssuesContainer = require('../issues-container')
const Asset = require('../assets/asset')
const ContractTypes = require('./contract-type')
const OracleConfig = require('./oracle-config')
const SubscriptionsConfig = require('./subscriptions-config')
const WasmHash = require('./wasm-hash')
const DAOConfig = require('./dao-config')
const OracleBeamConfig = require('./oracle-beam-config')

/**
 * @typedef {import('./contract-config-base')} ContractConfigBase
 */

function getContract(raw) {
    switch (raw.type) {
        case ContractTypes.ORACLE:
        case undefined:
            return new OracleConfig(raw)
        case ContractTypes.ORACLE_BEAM:
            return new OracleBeamConfig(raw)
        case ContractTypes.SUBSCRIPTIONS:
            return new SubscriptionsConfig(raw)
        case ContractTypes.DAO:
            return new DAOConfig(raw)
        default:
            throw new Error(`Unknown contract type: ${raw.type}`)
    }
}

function getWasmHash(raw) {
    const wasmMap = new Map()
    if (!raw)
        return wasmMap

    if (typeof raw === 'string') {//backward compatibility
        raw = {[ContractTypes.ORACLE]: new WasmHash(raw)}
        wasmMap.isLegacy = true
    }

    const keys = Object.keys(raw)

    for (const key of keys) {
        if (wasmMap.has(key))
            throw new Error(`Duplicate contract type: ${key}`)
        wasmMap.set(key, new WasmHash(raw[key]))
    }
    return wasmMap
}

module.exports = class Config extends IssuesContainer {
    constructor(raw) {
        super()
        if (!raw) {
            this.__addIssue(`config: ${IssuesContainer.notDefined}`)
            return
        }
        this.__setContracts(raw.contracts)
        this.__setNodes(raw.nodes)
        this.__setWasm(raw.wasmHash)
        this.__setMinDate(raw.minDate)
        this.__setSystemAccount(raw.systemAccount)
        this.__setNetwork(raw.network)
        this.__setDecimals(raw.decimals)
        this.__setBaseAssets(raw.baseAssets)
        this.clusterSecret = raw.clusterSecret
    }

    /**
     * @type {Map<string, ContractConfigBase>}
     */
    contracts = new Map()

    /**
     * @type {Map<string, Node>}
     */
    nodes = new Map()

    /**
     * @type {string}
     */
    systemAccount = null

    /**
     * @type {Map<string, string>}
     */
    wasmHash = new Map()

    /**
     * @type {number}
     */
    minDate = null

    /**
     * @type {string}
     */
    network = null

    /**
     * @type {number}
     * @optional
     */
    decimals = undefined

    /**
     * Default base assets for different data sources
     * @type {Map<string, string>}
     * @optional
     */
    baseAssets = undefined

    /**
     * @type {string} - base64 encoded RSA private key
     */
    clusterSecret

    /**
     * @type {boolean}
     */
    get isLegacy() {
        return [...this.wasmHash.values()].some(wasm => wasm.isLegacy) || [...this.contracts.values()].some(contract => contract.isLegacy)
    }

    __setContracts(contracts) {
        try {
            const allKeys = Object.keys(contracts)
            const contractIds = new Set(allKeys)
            if (allKeys.length !== contractIds.size)
                throw new Error('Duplicate contractId found in contracts')
            for (const contractId of contractIds) {
                const contractRaw = contracts[contractId]
                if (!contractRaw) {
                    this.__addIssue(`contracts.${contractId}: ${IssuesContainer.notDefined}`)
                    continue
                }
                const contract = getContract(contractRaw)
                if (contract.contractId !== contractId)
                    this.__addIssue(`contracts.${contractId}: contractId '${contract.contractId}' does not match key '${contractId}'`)
                if (!contract.isValid) {
                    for (const issue of contract?.issues || [])
                        this.__addIssue(`contracts.${contractId}: ${issue}`)
                    continue
                }
                this.contracts.set(contractId, contract)
            }
        } catch (err) {
            this.__addIssue(`contracts: ${err.message}`)
        }
    }

    __setNodes(nodes) {
        try {
            if (!nodes)
                throw new Error(IssuesContainer.notDefined)
            const allKeys = Object.keys(nodes)
            const pubkeys = new Set(allKeys)
            if (allKeys.length !== pubkeys.size)
                throw new Error('Duplicate pubkey found in nodes')
            for (const pubkey of pubkeys) {
                const rawNode = nodes[pubkey]
                try {
                    const node = new Node(rawNode)
                    if (node.pubkey !== pubkey)
                        this.__addIssue(`nodes.${pubkey}: pubkey '${node.pubkey}' does not match key '${pubkey}'`)
                    this.nodes.set(pubkey, node)
                } catch (err) {
                    this.__addIssue(`nodes.${pubkey}: ${err.message}`)
                }
            }
        } catch (err) {
            this.__addIssue(`nodes: ${err.message}`)
        }
    }

    __setWasm(wasmHash) {
        try {
            this.wasmHash = getWasmHash(wasmHash)
        } catch (err) {
            this.__addIssue(`wasmHash: ${err.message}`)
        }
    }

    __setMinDate(minDate) {
        try {
            if (!minDate && minDate !== 0)
                throw new Error(IssuesContainer.notDefined)
            minDate = parseInt(minDate, 10)
            if (isNaN(minDate))
                throw new Error(IssuesContainer.invalidOrNotDefined)
            this.minDate = minDate
        } catch (err) {
            this.__addIssue(`minDate: ${err.message}`)
        }
    }

    __setSystemAccount(systemAccount) {
        try {
            if (!StrKey.isValidEd25519PublicKey(systemAccount))
                throw new Error(IssuesContainer.invalidOrNotDefined)
            this.systemAccount = systemAccount
        } catch (err) {
            this.__addIssue(`systemAccount: ${err.message}`)
        }
    }

    __setNetwork(network) {
        try {
            if (!network)
                throw new Error(IssuesContainer.notDefined)
            this.network = network
        } catch (err) {
            this.__addIssue(`network: ${err.message}`)
        }
    }

    __setDecimals(decimals) {
        try {
            if (!decimals)
                return
            if (decimals < 0 || isNaN(decimals))
                throw new Error('Decimals should be a number')
            this.decimals = decimals
        } catch (err) {
            this.__addIssue(`decimals: ${err.message}`)
        }
    }

    __setBaseAssets(baseAssets) {
        try {
            if (!baseAssets)
                return
            const allKeys = Object.keys(baseAssets)
            const dataSources = new Set(allKeys)
            if (allKeys.length !== dataSources.size)
                throw new Error('Duplicate asset code found in baseAssets')
            this.baseAssets = new Map()
            for (const dataSource of dataSources) {
                const asset = baseAssets[dataSource]
                if (!asset)
                    throw new Error(`baseAssets.${dataSource}: ${IssuesContainer.notDefined}`)
                this.baseAssets.set(dataSource, new Asset(asset.type, asset.code))
            }
        } catch (err) {
            this.__addIssue(`baseAssets: ${err.message}`)
        }
    }

    getHash() {
        const rawConfig = this.toPlainObject()
        const hash = getDataHash(rawConfig)
        return hash
    }

    getSignaturePayloadHash(pubkey, nonce, rejected) {
        if (!pubkey)
            throw new Error('pubkey is required')
        if (!nonce)
            throw new Error('nonce is required')
        const hash = getSignaturePayloadHash(this.toPlainObject(), pubkey, nonce, rejected)
        return hash
    }

    toPlainObject(asLegacy = true) {
        const wasmHash = this.wasmHash.isLegacy && asLegacy
            ? (Object.keys(this.wasmHash).length > 0 ? this.wasmHash.get(ContractTypes.ORACLE).hash : undefined)
            : mapToPlainObject(this.wasmHash)
        return sortObjectKeys({
            contracts: mapToPlainObject(this.contracts, asLegacy),
            nodes: mapToPlainObject(this.nodes, asLegacy),
            wasmHash,
            minDate: this.minDate,
            systemAccount: this.systemAccount,
            network: this.network,
            decimals: this.decimals,
            baseAssets: this.baseAssets ? mapToPlainObject(this.baseAssets) : undefined,
            clusterSecret: this.clusterSecret
        })
    }

    equals(other, ignoreMinDate = false) {
        if (!(other instanceof Config))
            return false
        return areMapsEqual(this.contracts, other.contracts)
            && areMapsEqual(this.nodes, other.nodes)
            && areMapsEqual(this.wasmHash, other.wasmHash)
            && (ignoreMinDate ? true : this.minDate === other.minDate)
            && this.systemAccount === other.systemAccount
            && this.network === other.network
            && this.decimals === other.decimals
            && (this.baseAssets === other.baseAssets || areMapsEqual(this.baseAssets, other.baseAssets)) //baseAssets is optional
            && this.clusterSecret === other.clusterSecret
    }
}