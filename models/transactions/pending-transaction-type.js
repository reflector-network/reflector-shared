const {SUBSCRIPTIONS} = require('../configs/contract-type')

/**
 * Enum asset type
 * @readonly
 * @enum {string}
 */
const PendingTransactionType = {
    CONTRACT_UPDATE: 'contract_update',
    NODES_UPDATE: 'nodes_update',

    ORACLE_INIT: 'oracle_init',
    ORACLE_ASSETS_UPDATE: 'oracle_assets_update',
    ORACLE_PERIOD_UPDATE: 'oracle_period_update',
    ORACLE_PRICE_UPDATE: 'price_update',

    SUBSCRIPTIONS_INIT: 'subscriptions_init',
    SUBSCRIPTIONS_CREATE: 'subscriptions_create',
    SUBSCRIPTIONS_HEARTBEAT: 'subscriptions_heartbeat',
    SUBSCRIPTIONS_TRIGGER: 'subscriptions_trigger',
    SUBSCRIPTIONS_UPDATE_FEE: 'subscriptions_update_fee',
    SUBSCRIPTIONS_CHARGE: 'subscriptions_charge'
}

module.exports = PendingTransactionType