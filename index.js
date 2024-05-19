const UpdateType = require('./models/updates/update-type')
const UpdateBase = require('./models/updates/update-base')
const AssetsUpdate = require('./models/updates/assets-update')
const NodesUpdate = require('./models/updates/nodes-update')
const PeriodUpdate = require('./models/updates/period-update')
const WasmUpdate = require('./models/updates/wasm-update')
const ValidationError = require('./models/validation-error')
const AssetType = require('./models/assets/asset-type')
const Asset = require('./models/assets/asset')
const IssuesContainer = require('./models/issues-container')
const ContractConfig = require('./models/configs/contract-config')
const ConfigEnvelope = require('./models/configs/config-envelope')
const Config = require('./models/configs/config')
const Node = require('./models/node')
const PendingTransactionBase = require('./models/transactions/pending-transaction-base')
const PendingTransactionType = require('./models/transactions/pending-transaction-type')
const AssetsPendingTransaction = require('./models/transactions/assets-pending-transaction')
const InitPendingTransaction = require('./models/transactions/init-pending-transaction')
const WasmPendingTransaction = require('./models/transactions/wasm-pending-transaction')
const NodesPendingTransaction = require('./models/transactions/nodes-pending-transaction')
const PeriodPendingTransaction = require('./models/transactions/period-pending-transaction')
const PriceUpdatePendingTransaction = require('./models/transactions/price-update-pending-transaction')

const {
    isValidContractId,
    encodeAssetContractId,
    getNetworkIdHash
} = require('./utils/contractId-helper')

const {
    getMajority,
    hasMajority
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
} = require('./signatures-helper')

const {
    buildInitTransaction,
    buildUpdateTransaction,
    buildPriceUpdateTransaction
} = require('./transaction-helper')

const {buildUpdates} = require('./updates-helper')

module.exports.UpdateType = UpdateType
module.exports.UpdateBase = UpdateBase
module.exports.AssetsUpdate = AssetsUpdate
module.exports.NodesUpdate = NodesUpdate
module.exports.PeriodUpdate = PeriodUpdate
module.exports.WasmUpdate = WasmUpdate
module.exports.ValidationError = ValidationError
module.exports.AssetType = AssetType
module.exports.Asset = Asset
module.exports.IssuesContainer = IssuesContainer
module.exports.ContractConfig = ContractConfig
module.exports.Config = Config
module.exports.ConfigEnvelope = ConfigEnvelope
module.exports.Node = Node
module.exports.PendingTransactionBase = PendingTransactionBase
module.exports.PendingTransactionType = PendingTransactionType
module.exports.AssetsPendingTransaction = AssetsPendingTransaction
module.exports.InitPendingTransaction = InitPendingTransaction
module.exports.WasmPendingTransaction = WasmPendingTransaction
module.exports.NodesPendingTransaction = NodesPendingTransaction
module.exports.PeriodPendingTransaction = PeriodPendingTransaction
module.exports.PriceUpdatePendingTransaction = PriceUpdatePendingTransaction

module.exports.isValidContractId = isValidContractId
module.exports.encodeAssetContractId = encodeAssetContractId
module.exports.getNetworkIdHash = getNetworkIdHash
module.exports.getMajority = getMajority
module.exports.hasMajority = hasMajority
module.exports.areMapsEqual = areMapsEqual
module.exports.mapToPlainObject = mapToPlainObject
module.exports.sortObjectKeys = sortObjectKeys
module.exports.isTimestampValid = isTimestampValid
module.exports.normalizeTimestamp = normalizeTimestamp

module.exports.getDecoratedSignature = getDecoratedSignature
module.exports.verifySignature = verifySignature
module.exports.getSignaturePayloadHash = getSignaturePayloadHash
module.exports.getDataHash = getDataHash

module.exports.buildInitTransaction = buildInitTransaction
module.exports.buildUpdateTransaction = buildUpdateTransaction
module.exports.buildPriceUpdateTransaction = buildPriceUpdateTransaction

module.exports.buildUpdates = buildUpdates