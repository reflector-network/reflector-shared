import ConfigBase from './config-base.js'
import ContractConfig from './contract-config.js'
import Node from '../node.js'
import { sortObjectKeys } from '../../utils/index.js'

export default class Config extends ConfigBase {
    constructor(raw) {
        super()
        if (!raw) {
            this.__addConfigIssue(`config: ${ConfigBase.notDefined}`)
            return
        }
        this.__setContracts(raw.contracts)
        this.__setNodes(raw.nodes)
        this.__setWasm(raw.wasmHash)
        this.__setMinDate(raw.minDate)
    }

    /**
     * @type {ContractConfig[]}
     */
    contracts = []

    /**
     * @type {Node[]}
     */
    nodes = []

    __setContracts(contracts) {
        try {
            if (!contracts)
                throw new Error(ConfigBase.notDefined)
            for (let i = 0; i < contracts.length; i++) {
                const contractRaw = contracts[i]
                if (this.contracts.findIndex(c => c.oracleId === contractRaw.oracleId) >= 0)
                    throw new Error('Duplicate oracleId found in contracts')
                const contract = new ContractConfig(contractRaw)
                if (!contract.isValid) {
                    for (const issue of contract?.issues || [])
                        this.__addConfigIssue(`contracts[${i}]: ${issue}`)
                    continue
                }
                this.contracts.push(contract)
            }
        } catch (err) {
            this.__addConfigIssue(`contracts: ${err.message}`)
        }
    }

    __setNodes(nodes) {
        try {
            if (!nodes)
                throw new Error(ConfigBase.notDefined)
            for (let i = 0; i < nodes.length; i++) {
                const rawNode = nodes[i]
                try {
                    if (this.nodes.findIndex(n => n.pubkey === rawNode.pubkey) >= 0)
                        throw new Error('Duplicate pubkey found in nodes')
                    const node = new Node(rawNode)
                    this.nodes.push(node)
                } catch (err) {
                    this.__addConfigIssue(`nodes[${i}]: ${err.message}`)
                }
            }
        } catch (err) {
            this.__addConfigIssue(`nodes: ${err.message}`)
        }
    }

    __setWasm(wasmHash) {
        try {
            if (wasmHash && wasmHash.length != 64)
                throw new Error('Wasm code is invalid')
            this.wasmHash = wasmHash
        } catch (err) {
            this.__addConfigIssue(`wasm: ${err.message}`)
        }
    }

    __setMinDate(minDate) {
        try {
            if (!minDate)
                throw new Error(ConfigBase.notDefined)
            this.minDate = minDate
        } catch (err) {
            this.__addConfigIssue(`minDate: ${err.message}`)
        }
    }

    toPlainObject() {
        return sortObjectKeys({
            contracts: this.contracts.map(contract => contract.toPlainObject()),
            nodes: this.nodes.map(node => node.toPlainObject()),
            wasmHash: this.wasmHash,
            minDate: this.minDate
        })
    }

    equals(other) {
        if (!(other instanceof Config))
            return false
        return this.contracts.length === other.contracts.length
            && this.nodes.length === other.nodes.length
            && this.contracts.every((contract, i) => contract.equals(other.contracts[i]))
            && this.nodes.every((node, i) => node.equals(other.nodes[i]))
            && this.wasmHash === other.wasmHash
            && this.minDate === other.minDate
    }
}