const Asset = require('../assets/asset')
const {sortObjectKeys} = require('../../utils/serialization-helper')
const IssuesContainer = require('../issues-container')
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
            if (!decimals)
                return
            if (decimals < 0 || isNaN(decimals))
                throw new Error('Decimals should be a positive number')
            this.decimals = decimals
            this.__decimalsSet = true
        } catch (err) {
            this.__addIssue(`decimals: ${err.message}`)
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

    toPlainObject(asLegacy = true) {
        return sortObjectKeys({
            ...super.toPlainObject(asLegacy),
            ...{
                baseAsset: this.baseAsset?.toPlainObject(),
                decimals: this.__decimalsSet ? this.decimals : undefined,
                assets: this.assets.map(a => a.toPlainObject()),
                timeframe: this.timeframe,
                period: this.period,
                dataSource: this.dataSource
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
    }
}