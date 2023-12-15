const {StrKey} = require('stellar-sdk')
const Node = require('../node')
const {sortObjectKeys} = require('../../utils/index')
const {areMapsEqual, mapToPlainObject} = require('../../utils/map-helper')
const {getDataHash, getSignaturePayloadHash} = require('../../signatures-helper')
const IssuesContainer = require('../issues-container')
const ContractConfig = require('./contract-config')

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
     * @type {Map<string, ContractConfig>}
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
     * @type {string}
     */
    wasmHash = null

    /**
     * @type {number}
     */
    minDate = null

    /**
     * @type {string}
     */
    network = null

    __setContracts(contracts) {
        try {
            if (!contracts)
                throw new Error(IssuesContainer.notDefined)
            const allKeys = Object.keys(contracts)
            const oracleIds = new Set(allKeys)
            if (allKeys.length !== oracleIds.size)
                throw new Error('Duplicate oracleId found in contracts')
            for (const oracleId of oracleIds) {
                const contractRaw = contracts[oracleId]
                const contract = new ContractConfig(contractRaw)
                if (contract.oracleId !== oracleId)
                    this.__addIssue(`contracts.${oracleId}: oracleId '${contract.oracleId}' does not match key '${oracleId}'`)
                if (!contract.isValid) {
                    for (const issue of contract?.issues || [])
                        this.__addIssue(`contracts.${oracleId}: ${issue}`)
                    continue
                }
                this.contracts.set(oracleId, contract)
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
            if (wasmHash && wasmHash.length != 64)
                throw new Error('Wasm code is invalid')
            this.wasmHash = wasmHash
        } catch (err) {
            this.__addIssue(`wasm: ${err.message}`)
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
        return sortObjectKeys({
            contracts: mapToPlainObject(this.contracts),
            nodes: mapToPlainObject(this.nodes),
            wasmHash: this.wasmHash,
            minDate: this.minDate,
            systemAccount: this.systemAccount,
            network: this.network
        })
    }

    equals(other) {
        if (!(other instanceof Config))
            return false
        return areMapsEqual(this.contracts, other.contracts)
            && areMapsEqual(this.nodes, other.nodes)
            && this.wasmHash === other.wasmHash
            && this.minDate === other.minDate
            && this.systemAccount === other.systemAccount
            && this.network === other.network
    }
}