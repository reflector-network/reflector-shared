import UpdateBase from './update-base.js'
import UpdateType from './update-type.js'
import { sortObjectKeys } from '../../utils/index.js'

/**
 * @typedef {import('../assets/asset')} Asset
 */

export default class AssetsUpdate extends UpdateBase {
    /**
     * @param {BigInt} timestamp - pending update timestamp
     * @param {Asset[]} assets - pending update assets
     */
    constructor(timestamp, assets) {
        super(UpdateType.ASSETS, timestamp)
        if (!assets || !assets.length)
            throw new Error('assets is required')
        this.assets = assets
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            assets: this.assets.map(a => a.toPlainObject())
        })
    }
}