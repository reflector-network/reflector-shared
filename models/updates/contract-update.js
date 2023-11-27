import UpdateBase from './update-base.js'
import UpdateType from './update-type.js'
import { sortObjectKeys } from '../../utils/index.js'

export default class WasmUpdate extends UpdateBase {
    /**
     * @param {BigInt} timestamp - pending update timestamp
     * @param {string} wasmHash - contract wasm hash
     */
    constructor(timestamp, wasmHash) {
        super(UpdateType.WASM, timestamp)
        if (!wasmHash || wasmHash.length !== 64)
            throw new Error('wasmHash is not valid')
        this.wasmHash = wasmHash
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            wasmHash: this.wasmHash
        })
    }
}