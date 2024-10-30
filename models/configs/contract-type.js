
/**
 * Enum asset type
 * @readonly
 * @enum {string}
 */
const ContractTypes = {
    ORACLE: 'oracle',
    SUBSCRIPTIONS: 'subscriptions',
    DAO: 'dao',
    isValidType: (type) => {
        switch (type) {
            case ContractTypes.ORACLE:
            case ContractTypes.SUBSCRIPTIONS:
            case ContractTypes.DAO:
                return true
            default:
                return false
        }
    }
}

module.exports = ContractTypes