/**
 * Pending update type
 * @readonly
 * @enum {number}
 */
const UpdateType = {
    NODES: 'nodes',
    WASM: 'wasm',
    CONTRACTS: 'contracts',
    CONFIG: 'config',

    ORACLE_ASSETS: 'oracle_assets',
    ORACLE_PERIOD: 'oracle_period',
    ORACLE_CACHE_SIZE: 'oracle_cache_size',
    ORACLE_RETENTION: 'oracle_retention',

    SUBSCRIPTIONS_FEE: 'subscriptions_fee',

    DAO_DEPOSITS: 'dao_deposits'
}

module.exports = UpdateType