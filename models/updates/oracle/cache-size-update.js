const {sortObjectKeys} = require('../../../utils/serialization-helper')
const UpdateType = require('../update-type')
const ContractUpdateBase = require('../contract-update-base')

module.exports = class OracleCacheSizeUpdate extends ContractUpdateBase {
    /**
     * @param {number} timestamp - pending update timestamp
     * @param {string} contractId - oracle id
     * @param {string} admin - oracle admin
     * @param {number} cacheSize - pending update cache size
     */
    constructor(timestamp, contractId, admin, cacheSize) {
        super(UpdateType.ORACLE_CACHE_SIZE, timestamp, contractId, admin)
        if (!cacheSize)
            throw new Error('cacheSize is required')
        this.cacheSize = cacheSize
    }

    toPlainObject() {
        return sortObjectKeys({
            ...super.toPlainObject(),
            cacheSize: this.cacheSize
        })
    }
}