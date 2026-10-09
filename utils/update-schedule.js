//The submit schedule and the switch rule of every Reflector transaction round. reflector-node builds its transactions
//with it and node-orchestrator derives the hash of a cluster update from it to confirm that it landed, so both run the
//same reflector-shared version. The module has no dependencies
const FEE_MULTIPLIER = 8
//attempt 1 has this long from the sync timestamp: worker, build, signature collection, rpc and the Stellar lookahead
const firstAttemptTimeout = 40_000
//attempt 2 pays FEE_MULTIPLIER times the base fee and runs until the next round's sync
const maxSubmitAttempts = 2
//the sync grid: the orchestrator puts every switch time on it, and both sides retry a failed round at its next tick
const syncTimeframe = 120_000
//a cluster round ends 60 s after its sync, inside the 120 s grid, so the orchestrator has a window between rounds in
//which a vote can change (isRoundInFlight)
const clusterRoundLength = 60_000

/**
 * @param {number} syncTimestamp - sync timestamp in milliseconds
 * @param {number} attempt - 0-based attempt
 * @param {number} roundLength - milliseconds from the sync to the end of the round's last attempt
 * @returns {number} - max time in seconds
 */
function getMaxTime(syncTimestamp, attempt, roundLength) {
    //a transaction signed with a NaN or inverted bound would only fail on chain; refuse it before anything is signed
    if (!Number.isFinite(roundLength) || roundLength < firstAttemptTimeout)
        throw new Error(`Invalid round length: ${roundLength}`)
    const budget = attempt === 0 ? firstAttemptTimeout : roundLength
    return (syncTimestamp + budget) / 1000
}

/**
 * Whether a scheduled update is due at a sync tick. Inclusive: the tick equal to the switch time builds the update
 * @param {number} pendingTimestamp - switch time of the scheduled update, milliseconds
 * @param {number} syncTimestamp - the sync tick, milliseconds
 * @returns {boolean}
 */
function isUpdateTimeReached(pendingTimestamp, syncTimestamp) {
    return pendingTimestamp <= syncTimestamp
}

/**
 * Whether a cluster round started at a sync tick is over before the proposal expires: its last attempt's maxTime, and
 * the orchestrator's poll a second past it. The orchestrator requires it of the switch time when an update turns
 * PENDING, and a node requires it of every round it builds, so no round is still running when the orchestrator rejects
 * the update at its expiration date. A pure function of its arguments: it reads no clock
 * @param {number} syncTimestamp - the tick the round starts at, milliseconds
 * @param {number} expirationDate - expiration date of the proposal, milliseconds
 * @returns {boolean}
 */
function endsBeforeExpiration(syncTimestamp, expirationDate) {
    return getMaxTime(syncTimestamp, maxSubmitAttempts - 1, clusterRoundLength) * 1000 + 1000 <= expirationDate
}

module.exports = {
    FEE_MULTIPLIER,
    firstAttemptTimeout,
    maxSubmitAttempts,
    syncTimeframe,
    clusterRoundLength,
    getMaxTime,
    isUpdateTimeReached,
    endsBeforeExpiration
}
