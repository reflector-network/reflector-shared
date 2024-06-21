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
    }
}

module.exports = AssetType