/**
 * Code-unit string comparison. Canonical JSON and transaction operation order must not depend on the process
 * locale, which the locale-sensitive String comparison method would introduce.
 * @param {string} a - first string
 * @param {string} b - second string
 * @returns {number}
 */
function compareStrings(a, b) {
    if (a < b)
        return -1
    if (a > b)
        return 1
    return 0
}

/**
 * Recursively sorts object keys in code-unit order to produce a canonical, locale-independent representation.
 * @param {*} obj - value to normalize
 * @returns {*}
 */
function sortObjectKeys(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj
    }
    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys)
    }
    return Object.keys(obj).sort(compareStrings).reduce((sortedObj, key) => {
        sortedObj[key] = sortObjectKeys(obj[key])
        return sortedObj
    }, {})
}

module.exports = {sortObjectKeys, compareStrings}