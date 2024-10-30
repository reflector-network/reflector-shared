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

    SUBSCRIPTIONS_FEE: 'subscriptions_fee',

    DAO_DEPOSITS: 'dao_deposits'
}

module.exports = UpdateType