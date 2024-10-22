
/**
 * Enum for ballot categories
 * @readonly
 * @enum {string}
 */
const BallotCategories = {
    AddNode: 0,
    AddPriceFeed: 1,
    AddAsset: 2,
    General: 3,
    isValidCategory: (category) => {
        switch (category) {
            case BallotCategories.AddNode:
            case BallotCategories.AddPriceFeed:
            case BallotCategories.AddAsset:
            case BallotCategories.General:
                return true
            default:
                return false
        }
    }
}

module.exports = BallotCategories