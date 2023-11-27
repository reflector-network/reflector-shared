import UpdateBase from './update-base.js'
import UpdateType from './update-type.js'
import { sortObjectKeys } from '../../utils/index.js'

export default class PeriodUpdate extends UpdateBase {
    /**
     * @param {BigInt} timestamp - pending update timestamp
     * @param {BigInt} period - pending update period
     */
    constructor(timestamp, period) {
        super(UpdateType.PERIOD, timestamp)
        if (!period)
            throw new Error('period is required')
        this.period = period
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            period: this.period
        })
    }
}