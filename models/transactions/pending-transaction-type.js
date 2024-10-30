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
    SUBSCRIPTIONS_FEE_UPDATE: 'subscriptions_fee_update',
    SUBSCRIPTIONS_CHARGE: 'subscriptions_charge',

    DAO_INIT: 'dao_init',
    DAO_UNLOCK: 'dao_unlock',
    DAO_VOTE: 'dao_vote',
    DAO_DEPOSITS_UPDATE: 'dao_deposits_update'
}

module.exports = PendingTransactionType