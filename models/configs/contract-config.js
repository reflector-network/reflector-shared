/**
 * @typedef {import('../updates/update-base').default} UpdateBase
 */

import {StrKey} from 'stellar-base'
import {buildUpdate} from '../../updates-helper.js'
import Asset from '../assets/asset.js'
import {isValidContractId} from '../../utils/contractId-helper.js'
import ConfigBase from './config-base.js'
import { sortObjectKeys } from '../../utils/index.js'

export default class ContractConfig extends ConfigBase {
    constructor(raw) {
        super()
        if (!raw) {
            this.__addConfigIssue(`settings: ${ConfigBase.notDefined}`)
            return
        }
        this.admin = !(raw.admin && StrKey.isValidEd25519PublicKey(raw.admin)) ? this.__addConfigIssue(`admin: ${ConfigBase.invalidOrNotDefined}`) : raw.admin
        this.oracleId = !(raw.oracleId && isValidContractId(raw.oracleId)) ? this.__addConfigIssue(`oracleId: ${ConfigBase.invalidOrNotDefined}`) : raw.oracleId
        this.network = !(raw.network && raw.network.length > 0) ? this.__addConfigIssue(`network: ${ConfigBase.invalidOrNotDefined}`) : raw.network
        this.decimals = !(raw.decimals && raw.decimals > 0 && !isNaN(raw.decimals)) ? this.__addConfigIssue(`decimals: ${ConfigBase.invalidOrNotDefined}`) : raw.decimals
        this.timeframe = !(raw.timeframe && raw.timeframe > 0 && !isNaN(raw.timeframe)) ? this.__addConfigIssue(`timeframe: ${ConfigBase.invalidOrNotDefined}`) : raw.timeframe
        this.period = !(raw.period && !isNaN(raw.period) && raw.period > raw.timeframe) ? this.__addConfigIssue(`period: ${ConfigBase.invalidOrNotDefined}`) : raw.period
        this.fee = !(raw.fee && raw.fee > 0 && !isNaN(raw.fee)) ? this.__addConfigIssue(`fee: ${ConfigBase.invalidOrNotDefined}`) : raw.fee

        this.__assignBaseAsset(raw.baseAsset)

        this.__assignAssets(raw.assets)
    }

    __assignBaseAsset(asset) {
        try {
            if (!asset)
                throw new Error(ConfigBase.notDefined)
            //check if array and length > 0
            this.baseAsset = new Asset(asset.type, asset.code)
        } catch (err) {
            this.__addConfigIssue(`baseAsset: ${err.message}`)
        }
    }

    __assignAssets(assets) {
        try {
            if (!(assets && Array.isArray(assets) && assets.length > 0))
                throw new Error(ConfigBase.invalidOrNotDefined)
            for (let rawAsset of assets) {
                const asset = new Asset(rawAsset.type, rawAsset.code)
                if (this.assets.findIndex(a => a.equals(asset)) >= 0)
                    throw new Error('Duplicate asset found in assets')
                this.assets.push(asset)
            }
        } catch (err) {
            this.__addConfigIssue(`assets: ${err.message}`)
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
     * @type {string}
     */
    network

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

    toPlainObject() {
        return sortObjectKeys({
            admin: this.admin,
            oracleId: this.oracleId,
            network: this.network,
            baseAsset: this.baseAsset?.toPlainObject(),
            decimals: this.decimals,
            assets: this.assets?.map(asset => asset.toPlainObject()),
            timeframe: this.timeframe,
            period: this.period,
            fee: this.fee
        })
    }

    equals(other) {
        if (!(other instanceof ContractConfig))
            return false
        return this.admin === other.admin &&
            this.oracleId === other.oracleId &&
            this.network === other.network &&
            this.baseAsset.equals(other.baseAsset) &&
            this.decimals === other.decimals &&
            this.assets.length === other.assets.length &&
            this.assets.every((asset, index) => asset.equals(other.assets[index])) &&
            this.timeframe === other.timeframe &&
            this.period === other.period &&
            this.fee === other.fee
    }
}