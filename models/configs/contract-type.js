
/**
 * Enum asset type
 * @readonly
 * @enum {string}
 */
const ContractTypes = {
    ORACLE: 'oracle',
    SUBSCRIPTIONS: 'subscriptions',
    isValidType: (type) => {
        switch (type) {
            case ContractTypes.ORACLE:
            case ContractTypes.SUBSCRIPTIONS:
                return true
            default:
                return false
        }
    }
}

module.exports = ContractTypes