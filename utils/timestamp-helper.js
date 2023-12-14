/**
 * @param {number} timestamp - timestamp
 * @param {number} timeframe - timeframe
 * @returns {number}
 */
function normalizeTimestamp(timestamp, timeframe) {
    return Math.floor(timestamp / timeframe) * timeframe
}

/**
 * @param {number} timestamp - timestamp
 * @param {number} timeframe - timeframe
 * @returns {boolean}
 */
function isTimestampValid(timestamp, timeframe) {
    return timestamp % timeframe === 0
}

module.exports = {
    normalizeTimestamp,
    isTimestampValid
}