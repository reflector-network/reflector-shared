/**
 * Enum asset type
 * @readonly
 * @enum {number}
 */
const AssetType = {
    STELLAR: 1,
    OTHER: 2,
    isValidType: (type) => {
        switch (type) {
            case AssetType.STELLAR:
            case AssetType.OTHER:
            case 'STELLAR':
            case 'OTHER':
                return true
            default:
                return false
        }
    },
    getType: (type) => {
        switch (type.toUpperCase()) {
            case AssetType.STELLAR:
            case 'STELLAR':
                return AssetType.STELLAR
            case AssetType.OTHER:
            case 'OTHER':
                return AssetType.OTHER
            default:
                throw new Error(`Asset type ${type} is not supported`)
        }
    }
}

module.exports = AssetType