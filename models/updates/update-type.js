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
    ORACLE_HISTORY_PERIOD: 'oracle_history_period',
    ORACLE_CACHE_SIZE: 'oracle_cache_size',
    ORACLE_FEE_CONFIG: 'oracle_fee_config',
    ORACLE_INVOCATION_COSTS: 'oracle_invocation_costs',

    SUBSCRIPTIONS_FEE: 'subscriptions_fee',

    DAO_DEPOSITS: 'dao_deposits'
}

module.exports = UpdateType