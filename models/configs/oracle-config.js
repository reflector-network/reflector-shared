const Asset = require('../assets/asset')
const {sortObjectKeys} = require('../../utils/serialization-helper')
const IssuesContainer = require('../issues-container')
const {areArraysEqual} = require('../../utils/comparison-helper')
const ContractConfigBase = require('./contract-config-base')

module.exports = class OracleConfig extends ContractConfigBase {
    constructor(raw) {
        super(raw)
        this.timeframe = !(raw.timeframe && raw.timeframe > 0 && !isNaN(raw.timeframe)) ? this.__addIssue(`timeframe: ${IssuesContainer.invalidOrNotDefined}`) : raw.timeframe
        if (this.timeframe % 1000 * 60 !== 0)
            this.__addIssue('timeframe: Timeframe should be minutes in milliseconds')
        this.period = !(raw.period && !isNaN(raw.period) && raw.period > raw.timeframe) ? this.__addIssue(`period: ${IssuesContainer.invalidOrNotDefined}`) : raw.period

        this.__assignDecimals(raw.decimals)

        this.__assignBaseAsset(raw.baseAsset)

        this.__assignAssets(raw.assets)

        this.__assignDataSource(raw.dataSource)

        this.__assignCacheSize(raw.cacheSize)

        this.__assignFeeConfig(raw.feeConfig)

        this.__assignInvocationCosts(raw.invocationCost)
    }

    __assignBaseAsset(asset) {
        try {
            if (!asset)
                throw new Error(IssuesContainer.notDefined)
            //check if array and length > 0
            this.baseAsset = new Asset(asset.type, asset.code)
        } catch (err) {
            this.__addIssue(`baseAsset: ${err.message}`)
        }
    }

    __assignAssets(assets) {
        try {
            if (!(assets && Array.isArray(assets) && assets.length > 0))
                throw new Error(IssuesContainer.invalidOrNotDefined)
            for (const rawAsset of assets) {
                const asset = new Asset(rawAsset.type, rawAsset.code)
                if (this.assets.findIndex(a => a.equals(asset)) >= 0)
                    throw new Error('Duplicate asset found in assets')
                this.assets.push(asset)
            }
        } catch (err) {
            this.__addIssue(`assets: ${err.message}`)
        }
    }

    __assignDataSource(dataSource) {
        try {
            if (!dataSource)
                throw new Error(IssuesContainer.notDefined)
            this.dataSource = dataSource
        } catch (err) {
            this.__addIssue(`dataSource: ${err.message}`)
        }
    }

    __assignDecimals(decimals) {
        try {
            if (!decimals && decimals !== 0)
                return
            if (decimals < 0 || isNaN(decimals))
                throw new Error('Decimals should be a positive number')
            this.decimals = decimals
            this.__decimalsSet = true
        } catch (err) {
            this.__addIssue(`decimals: ${err.message}`)
        }
    }

    __assignCacheSize(cacheSize) {
        try {
            if (!cacheSize && cacheSize !== 0) {
                this.cacheSize = 0
                return
            }
            if (cacheSize < 0 || isNaN(cacheSize))
                throw new Error('Cache size should be a positive number')
            this.cacheSize = cacheSize
            this.__cacheSizeSet = true
        } catch (err) {
            this.__addIssue(`cacheSize: ${err.message}`)
        }
    }

    __assignFeeConfig(feeConfig) {
        try {
            if (!feeConfig)
                return
            if (!feeConfig.fee || typeof feeConfig.fee !== 'string' || !BigInt(feeConfig.fee))
                throw new Error('feeConfig.fee must be a BigInt string')
            if (!feeConfig.token || typeof feeConfig.token !== 'string')
                throw new Error('feeConfig.token must be a string')
            this.feeConfig = {...feeConfig, fee: BigInt(feeConfig.fee)}
            this.__feeConfigSet = true
        } catch (err) {
            this.__addIssue(`feeConfig: ${err.message}`)
        }
    }

    __assignInvocationCosts(invocationCosts) {
        try {
            if (!invocationCosts)
                return
            if (!Array.isArray(invocationCosts) || invocationCosts.some(c => typeof c !== 'string' || !BigInt(c)) || invocationCosts.length !== 5)
                throw new Error('invocationCosts must be an array of 5 BigInt strings')
            this.invocationCosts = invocationCosts.map(c => BigInt(c))
            this.__invocationCostsSet = true
        } catch (err) {
            this.__addIssue(`invocationCosts: ${err.message}`)
        }
    }

    /**
     * @type {Asset}
     */
    baseAsset

    /**
     * @type {number}
     * @deprecated
     */
    decimals

    /**
     * @type {Asset[]}
     */
    assets = []

    /**
     * @type {number}
     */
    timeframe

    /**
     * @type {number}
     */
    period

    /**
     * @type {string}
     */
    dataSource

    /**
     * @type {{token: string, fee: BigInt}}
     */
    feeConfig

    /**
     * @type {BigInt[]}
     */
    invocationCosts

    toPlainObject(asLegacy = true) {
        return sortObjectKeys({
            ...super.toPlainObject(asLegacy),
            ...{
                baseAsset: this.baseAsset?.toPlainObject(),
                decimals: this.__decimalsSet ? this.decimals : undefined,
                assets: this.assets.map(a => a.toPlainObject()),
                timeframe: this.timeframe,
                period: this.period,
                dataSource: this.dataSource,
                cacheSize: this.__cacheSizeSet ? this.cacheSize : undefined,
                feeConfig: this.__feeConfigSet ? {
                    token: this.feeConfig.token,
                    fee: this.feeConfig.fee.toString()
                } : undefined,
                invocationCosts: this.__invocationCostsSet ? this.invocationCosts.map(c => c.toString()) : undefined
            }
        })
    }

    equals(other) {
        return super.equals(other)
            && this.baseAsset.equals(other.baseAsset)
            && this.decimals === other.decimals
            && this.assets.length === other.assets.length
            && this.assets.every((asset, index) => asset.equals(other.assets[index]))
            && this.timeframe === other.timeframe
            && this.period === other.period
            && this.dataSource === other.dataSource
            && this.cacheSize === other.cacheSize
            && this.feeConfig?.token === other.feeConfig?.token
            && this.feeConfig?.fee === other.feeConfig?.fee
            && areArraysEqual(this.invocationCosts, other.invocationCosts)
    }
}