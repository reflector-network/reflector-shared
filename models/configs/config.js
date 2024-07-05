const {StrKey} = require('@stellar/stellar-sdk')
const Node = require('../node')
const {sortObjectKeys} = require('../../utils/serialization-helper')
const {areMapsEqual, mapToPlainObject} = require('../../utils/map-helper')
const {getDataHash, getSignaturePayloadHash} = require('../../helpers/signatures-helper')
const IssuesContainer = require('../issues-container')
const ContractTypes = require('./contract-type')
const OracleConfig = require('./oracle-config')
const SubscriptionsConfig = require('./subscriptions-config')
const WasmHash = require('./wasm-hash')

/**
 * @typedef {import('./contract-config-base')} ContractConfigBase
 */

function getContract(raw) {
    switch (raw.type) {
        case ContractTypes.ORACLE:
        case undefined:
            return new OracleConfig(raw)
        case ContractTypes.SUBSCRIPTIONS:
            return new SubscriptionsConfig(raw)
        default:
            throw new Error(`Unknown contract type: ${raw.type}`)
    }
}

function getWasmHash(raw) {
    if (!raw)
        return {}
    //check if string
    const wasmMap = new Map()
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

    toPlainObject() {
        const wasmHash = this.wasmHash.isLegacy
            ? (Object.keys(this.wasmHash).length > 0 ? this.wasmHash.get(ContractTypes.ORACLE).hash : undefined)
            : mapToPlainObject(this.wasmHash)
        return sortObjectKeys({
            contracts: mapToPlainObject(this.contracts),
            nodes: mapToPlainObject(this.nodes),
            wasmHash,
            minDate: this.minDate,
            systemAccount: this.systemAccount,
            network: this.network
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
    }
}