const {DAOClient} = require('@reflector/oracle-client')
const DAOInitTransaction = require('../../models/transactions/dao/init-transaction')
const DAODepositsUpdateTransaction = require('../../models/transactions/dao/deposits-update-transaction')
const DAOVoteTransaction = require('../../models/transactions/dao/vote-transaction')
const DAOUnlockTransaction = require('../../models/transactions/dao/unlock-transaction')
const {mapToPlainObject} = require('../../utils/map-helper')
const {sortObjectKeys} = require('../../utils/serialization-helper')

/**
 * @typedef {import('../../models/configs/dao-config')} DAOConfig
 * @typedef {import('@stellar/stellar-sdk').Account} Account
 */


/**
 * @typedef {Object} InitOptions
 * @property {string} network - network
 * @property {string[]} sorobanRpc - soroban rpc urls
 * @property {DAOConfig} config - contract config
 * @property {Account} account - account
 * @property {Date} maxTime - tx max time
 * @property {number} fee - fee
 */

/**
 * @typedef {Object} DepositUpdateOptions
 * @property {Account} account - account
 * @property {string} network - network
 * @property {number} fee - fee
 * @property {string[]} sorobanRpc - soroban rpc urls
 * @property {string} contractId - contract id
 * @property {string} admin - contract admin
 * @property {Map<number, string>} depositParams - deposit parameters
 * @property {number} timestamp - timestamp
 * @property {Date} maxTime - tx max time
 */

/**
 * @typedef {Object} VoteOptions
 * @property {Account} account - account
 * @property {string} network - network
 * @property {number} fee - fee
 * @property {string[]} sorobanRpc - soroban rpc urls
 * @property {string} contractId - contract id
 * @property {string} ballotId - ballot id
 * @property {boolean} accepted - ballot accepted
 * @property {number} timestamp - timestamp
 * @property {Date} maxTime - tx max time
 */

/**
 * @typedef {Object} UnlockOptions
 * @property {Account} account - account
 * @property {string} network - network
 * @property {number} fee - fee
 * @property {string[]} sorobanRpc - soroban rpc urls
 * @property {string} contractId - contract id
 * @property {string} developer - developer public key
 * @property {string[]} operators - operators public keys
 * @property {number} timestamp - timestamp
 * @property {Date} maxTime - tx max time
 */

/**
 * @param {InitOptions} initOptions - oracle client
 * @returns {Promise<DAOInitTransaction>}
 */
async function buildDAOInitTransaction(initOptions) {
    const {account, config, sorobanRpc, network, maxTime, fee} = initOptions
    const {admin, token, initAmount, contractId, depositParams, startDate} = config
    const daoClient = new DAOClient(network, sorobanRpc, contractId)
    const tx = await daoClient.config(
        account,
        {
            admin,
            token,
            amount: initAmount,
            depositParams: sortObjectKeys(mapToPlainObject(depositParams, false)),
            startDate: Math.floor(startDate / 1000)
        },
        {fee, networkPassphrase: network, timebounds: {minTime: 0, maxTime}}
    )
    return new DAOInitTransaction(tx, 1, config)
}

/**
 * @param {DepositUpdateOptions} depositUpdateOptions - deposit update options
 * @returns {Promise<DAODepositsUpdateTransaction>}
 */
async function buildDAODepositsUpdateTransaction(depositUpdateOptions) {
    const {account, sorobanRpc, network, maxTime, fee, contractId, depositParams, timestamp, admin} = depositUpdateOptions
    const daoClient = new DAOClient(network, sorobanRpc, contractId)
    const tx = await daoClient.setDeposit(
        account,
        {admin, depositParams: sortObjectKeys(mapToPlainObject(depositParams, false))},
        {fee, networkPassphrase: network, timebounds: {minTime: 0, maxTime}}
    )
    return new DAODepositsUpdateTransaction(tx, timestamp, depositParams)
}

/**
 * @param {VoteOptions} voteOptions - vote options
 * @returns {Promise<DAOVoteTransaction>}
 */
async function buildDAOVoteTransaction(voteOptions) {
    const {account, sorobanRpc, network, maxTime, fee, contractId, ballotId, accepted, timestamp, admin} = voteOptions
    const daoClient = new DAOClient(network, sorobanRpc, contractId)
    const tx = await daoClient.vote(
        account,
        {admin, ballotId, accepted},
        {fee, networkPassphrase: network, timebounds: {minTime: 0, maxTime}}
    )
    return new DAOVoteTransaction(tx, timestamp, ballotId, accepted)

}


/**
 * @param {UnlockOptions} unlockOptions - vote options
 * @returns {Promise<DAOVoteTransaction>}
 */
async function buildDAOUnlockTransaction(unlockOptions) {
    const {account, sorobanRpc, network, maxTime, fee, contractId, developer, operators, timestamp, admin} = unlockOptions
    const daoClient = new DAOClient(network, sorobanRpc, contractId)
    const tx = await daoClient.unlock(
        account,
        {admin, developer, operators},
        {fee, networkPassphrase: network, timebounds: {minTime: 0, maxTime}}
    )
    return new DAOUnlockTransaction(tx, timestamp, developer, operators)

}

module.exports = {
    buildDAOInitTransaction,
    buildDAODepositsUpdateTransaction,
    buildDAOVoteTransaction,
    buildDAOUnlockTransaction
}