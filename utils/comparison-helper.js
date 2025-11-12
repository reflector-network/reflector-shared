/**
 * Compares two arrays for equality. Returns true if both are null/undefined.
 * @param {Array} arr1 - first array
 * @param {Array} arr2 - second array
 * @returns {boolean} - true if arrays are equal
 */
function areArraysEqual(arr1, arr2) {
    if (!arr1 && !arr2) //if both are null/undefined
        return true
    if (!arr1 || !arr2) //if only one is null/undefined
        return false
    if (arr1.length !== arr2.length)
        return false
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i])
            return false
    }
    return true
}

module.exports = {
    areArraysEqual
}