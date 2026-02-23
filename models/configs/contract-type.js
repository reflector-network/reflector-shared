
/**
 * Enum asset type
 * @readonly
 * @enum {string}
 */
const ContractTypes = {
    ORACLE: 'oracle',
    ORACLE_BEAM: 'oracle_beam',
    SUBSCRIPTIONS: 'subscriptions',
    DAO: 'dao',
    isValidType: (type) => {
        switch (type) {
            case ContractTypes.ORACLE:
            case ContractTypes.ORACLE_BEAM:
            case ContractTypes.SUBSCRIPTIONS:
            case ContractTypes.DAO:
                return true
            default:
                return false
        }
    }
}

module.exports = ContractTypes