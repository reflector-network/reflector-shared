const {StrKey} = require('stellar-sdk')
const Asset = require('../assets/asset')
const {isValidContractId} = require('../../utils/contractId-helper')
const {sortObjectKeys} = require('../../utils/index')
const IssuesContainer = require('../issues-container')

module.exports = class ContractConfig extends IssuesContainer {
    constructor(raw) {
        super()
        if (!raw) {
            this.__addIssue(`settings: ${IssuesContainer.notDefined}`)
            return
        }
        this.admin = !(raw.admin && StrKey.isValidEd25519PublicKey(raw.admin)) ? this.__addIssue(`admin: ${IssuesContainer.invalidOrNotDefined}`) : raw.admin
        this.oracleId = !(raw.oracleId && isValidContractId(raw.oracleId)) ? this.__addIssue(`oracleId: ${IssuesContainer.invalidOrNotDefined}`) : raw.oracleId
        this.decimals = !(raw.decimals && raw.decimals > 0 && !isNaN(raw.decimals)) ? this.__addIssue(`decimals: ${IssuesContainer.invalidOrNotDefined}`) : raw.decimals
        this.timeframe = !(raw.timeframe && raw.timeframe > 0 && !isNaN(raw.timeframe)) ? this.__addIssue(`timeframe: ${IssuesContainer.invalidOrNotDefined}`) : raw.timeframe
        this.period = !(raw.period && !isNaN(raw.period) && raw.period > raw.timeframe) ? this.__addIssue(`period: ${IssuesContainer.invalidOrNotDefined}`) : raw.period
        this.fee = !(raw.fee && raw.fee > 0 && !isNaN(raw.fee)) ? this.__addIssue(`fee: ${IssuesContainer.invalidOrNotDefined}`) : raw.fee

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

    /**
     * @type {string}
     */
    admin

    /**
     * @type {string}
     */
    oracleId

    /**
     * @type {Asset}
     */
    baseAsset

    /**
     * @type {number}
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
     * @type {number}
     */
    fee

    /**
     * @returns {string}
     */
    dataSource

    toPlainObject() {
        return sortObjectKeys({
            admin: this.admin,
            oracleId: this.oracleId,
            baseAsset: this.baseAsset?.toPlainObject(),
            decimals: this.decimals,
            assets: this.assets.map(a => a.toPlainObject()),
            timeframe: this.timeframe,
            period: this.period,
            fee: this.fee
        })
    }

    equals(other) {
        if (!(other instanceof ContractConfig))
            return false
        return this.admin === other.admin
            && this.oracleId === other.oracleId
            && this.baseAsset.equals(other.baseAsset)
            && this.decimals === other.decimals
            && this.assets.length === other.assets.length
            && this.assets.every((asset, index) => asset.equals(other.assets[index]))
            && this.timeframe === other.timeframe
            && this.period === other.period
            && this.fee === other.fee
    }
}