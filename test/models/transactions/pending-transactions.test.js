/*eslint-disable no-undef */
const PendingTransactionType = require('../../../models/transactions/pending-transaction-type')

const OracleInitTransaction = require('../../../models/transactions/oracle/init-transaction')
const OraclePriceUpdateTransaction = require('../../../models/transactions/oracle/price-update-transaction')
const OracleAssetsUpdateTransaction = require('../../../models/transactions/oracle/assets-update-transaction')
const OracleHistoryPeriodUpdateTransaction = require('../../../models/transactions/oracle/history-period-update-transaction')
const OracleCacheSizeUpdateTransaction = require('../../../models/transactions/oracle/cache-size-update-transaction')
const OracleFeeConfigUpdateTransaction = require('../../../models/transactions/oracle/fee-config-update-transaction')
const OracleInvocationCostsUpdateTransaction = require('../../../models/transactions/oracle/invocation-costs-update-transaction')

const SubscriptionsInitTransaction = require('../../../models/transactions/subscriptions/init-transaction')
const SubscriptionsTriggerTransaction = require('../../../models/transactions/subscriptions/trigger-transaction')
const SubscriptionsChargeTransaction = require('../../../models/transactions/subscriptions/charge-transaction')
const SubscriptionsFeeUpdateTransaction = require('../../../models/transactions/subscriptions/fee-update-transaction')

const DAOInitTransaction = require('../../../models/transactions/dao/init-transaction')
const DAOVoteTransaction = require('../../../models/transactions/dao/vote-transaction')
const DAOUnlockTransaction = require('../../../models/transactions/dao/unlock-transaction')
const DAODepositsUpdateTransaction = require('../../../models/transactions/dao/deposits-update-transaction')

const NodesPendingTransaction = require('../../../models/transactions/nodes-pending-transaction')
const WasmPendingTransaction = require('../../../models/transactions/wasm-pending-transaction')

function mockTx() {
    return {hash: () => Buffer.alloc(32), signatures: []}
}

const cases = [
    ['OracleInitTransaction', () => new OracleInitTransaction(mockTx(), 1, {}), PendingTransactionType.ORACLE_INIT],
    ['OraclePriceUpdateTransaction', () => new OraclePriceUpdateTransaction(mockTx(), 1, [1n]), PendingTransactionType.ORACLE_PRICE_UPDATE],
    ['OracleAssetsUpdateTransaction', () => new OracleAssetsUpdateTransaction(mockTx(), 1, [{}]), PendingTransactionType.ORACLE_ASSETS_UPDATE],
    ['OracleHistoryPeriodUpdateTransaction', () => new OracleHistoryPeriodUpdateTransaction(mockTx(), 1, 1), PendingTransactionType.ORACLE_HISTORY_PERIOD_UPDATE],
    ['OracleCacheSizeUpdateTransaction', () => new OracleCacheSizeUpdateTransaction(mockTx(), 1, 1), PendingTransactionType.ORACLE_CACHE_SIZE_UPDATE],
    ['OracleFeeConfigUpdateTransaction', () => new OracleFeeConfigUpdateTransaction(mockTx(), 1, {}), PendingTransactionType.ORACLE_FEE_CONFIG_UPDATE],
    ['OracleInvocationCostsUpdateTransaction', () => new OracleInvocationCostsUpdateTransaction(mockTx(), 1, [1n]), PendingTransactionType.ORACLE_INVOCATION_COSTS_UPDATE],
    ['SubscriptionsInitTransaction', () => new SubscriptionsInitTransaction(mockTx(), 1, {}), PendingTransactionType.SUBSCRIPTIONS_INIT],
    ['SubscriptionsTriggerTransaction', () => new SubscriptionsTriggerTransaction(mockTx(), 1, 'abc'), PendingTransactionType.SUBSCRIPTIONS_TRIGGER],
    ['SubscriptionsChargeTransaction', () => new SubscriptionsChargeTransaction(mockTx(), 1, [1n]), PendingTransactionType.SUBSCRIPTIONS_CHARGE],
    ['SubscriptionsFeeUpdateTransaction', () => new SubscriptionsFeeUpdateTransaction(mockTx(), 1, 100), PendingTransactionType.SUBSCRIPTIONS_FEE_UPDATE],
    ['DAOInitTransaction', () => new DAOInitTransaction(mockTx(), 1, {}), PendingTransactionType.DAO_INIT],
    ['DAOVoteTransaction', () => new DAOVoteTransaction(mockTx(), 1, 'b1', true), PendingTransactionType.DAO_VOTE],
    ['DAOUnlockTransaction', () => new DAOUnlockTransaction(mockTx(), 1, 'dev', ['op']), PendingTransactionType.DAO_UNLOCK],
    ['DAODepositsUpdateTransaction', () => new DAODepositsUpdateTransaction(mockTx(), 1, new Map([[0, 100]])), PendingTransactionType.DAO_DEPOSITS_UPDATE],
    ['NodesPendingTransaction', () => new NodesPendingTransaction(mockTx(), 1, new Map([['k', {}]])), PendingTransactionType.NODES_UPDATE],
    ['WasmPendingTransaction', () => new WasmPendingTransaction(mockTx(), 1, 'a'.repeat(64), false), PendingTransactionType.CONTRACT_UPDATE]
]

describe('pending transaction types', () => {
    test.each(cases)('%s has correct type', (_, create, expectedType) => {
        expect(create().type).toBe(expectedType)
    })
})
