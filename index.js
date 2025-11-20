const UpdateType = require('./models/updates/update-type')
const UpdateBase = require('./models/updates/update-base')
const OracleAssetsUpdate = require('./models/updates/oracle/assets-update')
const NodesUpdate = require('./models/updates/nodes-update')
const OracleHistoryPeriodUpdate = require('./models/updates/oracle/history-period-update')
const OracleCacheSizeUpdate = require('./models/updates/oracle/cache-size-update')
const OracleRetentionConfigUpdate = require('./models/updates/oracle/fee-config-update')
const WasmUpdate = require('./models/updates/wasm-update')
const ValidationError = require('./models/validation-error')
const AssetType = require('./models/assets/asset-type')
const Asset = require('./models/assets/asset')
const IssuesContainer = require('./models/issues-container')
const ContractConfigBase = require('./models/configs/contract-config-base')
const OracleConfig = require('./models/configs/oracle-config')
const OracleBeamConfig = require('./models/configs/oracle-beam-config')
const SubscriptionsConfig = require('./models/configs/subscriptions-config')
const DAOConfig = require('./models/configs/dao-config')
const BallotCategories = require('./models/ballot-categories')
const ConfigEnvelope = require('./models/configs/config-envelope')
const Config = require('./models/configs/config')
const Node = require('./models/node')
const PendingTransactionBase = require('./models/transactions/pending-transaction-base')
const PendingTransactionType = require('./models/transactions/pending-transaction-type')
const OracleAssetsUpdateTransaction = require('./models/transactions/oracle/assets-update-transaction')
const OracleInitTransaction = require('./models/transactions/oracle/init-transaction')
const WasmPendingTransaction = require('./models/transactions/wasm-pending-transaction')
const NodesPendingTransaction = require('./models/transactions/nodes-pending-transaction')
const OracleHistoryRetentionTransaction = require('./models/transactions/oracle/history-period-update-transaction')
const OracleCacheSizeUpdateTransaction = require('./models/transactions/oracle/cache-size-update-transaction')
const OracleFeeConfigUpdateTransaction = require('./models/transactions/oracle/fee-config-update-transaction')
const OracleInvocationCostsUpdateTransaction = require('./models/transactions/oracle/invocation-costs-update-transaction')
const PriceUpdatePendingTransaction = require('./models/transactions/oracle/price-update-transaction')
const ContractTypes = require('./models/configs/contract-type')

const {
    isValidContractId,
    encodeAssetContractId,
    getNetworkIdHash
} = require('./utils/contractId-helper')

const {
    getMajority,
    hasMajority,
    isAllowedValidatorsUpdate,
    filterRemovedValidators,
    areAllSignaturesPresent
} = require('./utils/majority-helper')

const {
    areMapsEqual,
    mapToPlainObject
} = require('./utils/map-helper')

const {sortObjectKeys} = require('./utils/serialization-helper')

const {
    isTimestampValid,
    normalizeTimestamp
} = require('./utils/timestamp-helper')

const {
    getDecoratedSignature,
    verifySignature,
    getSignaturePayloadHash,
    getDataHash
} = require('./helpers/signatures-helper')

const {
    buildUpdateTransaction
} = require('./helpers/transactions/shared-transaction-helper')

const {buildOracleInitTransaction, buildOraclePriceUpdateTransaction} = require('./helpers/transactions/oracle-transaction-helper')
const {buildSubscriptionsInitTransaction, buildSubscriptionChargeTransaction, buildSubscriptionTriggerTransaction} = require('./helpers/transactions/subscriptions-transaction-helper')
const {buildDAOInitTransaction, buildDAODepositsUpdateTransaction, buildDAOVoteTransaction, buildDAOUnlockTransaction} = require('./helpers/transactions/dao-transaction-helper')
const {getContractState, getOracleContractState, getSubscriptionsContractState, getSubscriptions, getSubscriptionById} = require('./helpers/entries-helper')

const {buildUpdates} = require('./helpers/updates-helper')

module.exports.UpdateType = UpdateType
module.exports.UpdateBase = UpdateBase
module.exports.OracleAssetsUpdate = OracleAssetsUpdate
module.exports.NodesUpdate = NodesUpdate
module.exports.OracleHistoryPeriodUpdate = OracleHistoryPeriodUpdate
module.exports.OracleCacheSizeUpdate = OracleCacheSizeUpdate
module.exports.OracleRetentionConfigUpdate = OracleRetentionConfigUpdate
module.exports.WasmUpdate = WasmUpdate
module.exports.ValidationError = ValidationError
module.exports.AssetType = AssetType
module.exports.Asset = Asset
module.exports.IssuesContainer = IssuesContainer
module.exports.OracleConfig = OracleConfig
module.exports.OracleBeamConfig = OracleBeamConfig
module.exports.SubscriptionsConfig = SubscriptionsConfig
module.exports.DAOConfig = DAOConfig
module.exports.ContractConfigBase = ContractConfigBase
module.exports.Config = Config
module.exports.ConfigEnvelope = ConfigEnvelope
module.exports.Node = Node
module.exports.PendingTransactionBase = PendingTransactionBase
module.exports.PendingTransactionType = PendingTransactionType

module.exports.ContractTypes = ContractTypes
module.exports.BallotCategories = BallotCategories

module.exports.OracleAssetsUpdateTransaction = OracleAssetsUpdateTransaction
module.exports.OracleInitTransaction = OracleInitTransaction
module.exports.OracleFeeConfigUpdateTransaction = OracleFeeConfigUpdateTransaction
module.exports.OracleCacheSizeUpdateTransaction = OracleCacheSizeUpdateTransaction
module.exports.WasmPendingTransaction = WasmPendingTransaction
module.exports.NodesPendingTransaction = NodesPendingTransaction
module.exports.OracleHistoryRetentionTransaction = OracleHistoryRetentionTransaction
module.exports.PriceUpdatePendingTransaction = PriceUpdatePendingTransaction
module.exports.OracleInvocationCostsUpdateTransaction = OracleInvocationCostsUpdateTransaction

module.exports.isValidContractId = isValidContractId
module.exports.encodeAssetContractId = encodeAssetContractId
module.exports.getNetworkIdHash = getNetworkIdHash
module.exports.getMajority = getMajority
module.exports.hasMajority = hasMajority
module.exports.isAllowedValidatorsUpdate = isAllowedValidatorsUpdate
module.exports.filterRemovedValidators = filterRemovedValidators
module.exports.areAllSignaturesPresent = areAllSignaturesPresent
module.exports.areMapsEqual = areMapsEqual
module.exports.mapToPlainObject = mapToPlainObject
module.exports.sortObjectKeys = sortObjectKeys
module.exports.isTimestampValid = isTimestampValid
module.exports.normalizeTimestamp = normalizeTimestamp

module.exports.getDecoratedSignature = getDecoratedSignature
module.exports.verifySignature = verifySignature
module.exports.getSignaturePayloadHash = getSignaturePayloadHash
module.exports.getDataHash = getDataHash

module.exports.buildUpdateTransaction = buildUpdateTransaction

module.exports.buildOracleInitTransaction = buildOracleInitTransaction
module.exports.buildOraclePriceUpdateTransaction = buildOraclePriceUpdateTransaction

module.exports.buildSubscriptionsInitTransaction = buildSubscriptionsInitTransaction
module.exports.buildSubscriptionChargeTransaction = buildSubscriptionChargeTransaction
module.exports.buildSubscriptionTriggerTransaction = buildSubscriptionTriggerTransaction

module.exports.buildDAOInitTransaction = buildDAOInitTransaction
module.exports.buildDAODepositsUpdateTransaction = buildDAODepositsUpdateTransaction
module.exports.buildDAOVoteTransaction = buildDAOVoteTransaction
module.exports.buildDAOUnlockTransaction = buildDAOUnlockTransaction

module.exports.buildUpdates = buildUpdates

module.exports.getOracleContractState = getOracleContractState
module.exports.getContractState = getContractState
module.exports.getSubscriptionsContractState = getSubscriptionsContractState
module.exports.getSubscriptions = getSubscriptions
module.exports.getSubscriptionById = getSubscriptionById