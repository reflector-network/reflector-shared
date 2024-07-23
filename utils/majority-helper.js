function hasMajority(totalSignersCount, signaturesCount) {
    return signaturesCount >= getMajority(totalSignersCount)
}

function getMajority(totalSignersCount) {
    return Math.floor(totalSignersCount / 2) + 1
}

/**
 * Filter removed validators. Validators that are not in the new validators list are removed.
 * @param {string[]} currentValidators - current validators
 * @param {string[]} newValidators - new validators
 * @returns {string[]}
 */
function filterRemovedValidators(currentValidators, newValidators) {
    return currentValidators.filter(node => newValidators.includes(node))
}

function isAllowedValidatorsUpdate(currentValidators, newValidators) {
    const validators = filterRemovedValidators(currentValidators, newValidators)
    //get current validators majority
    const majority = getMajority(currentValidators.length)
    return validators.length >= majority
}

module.exports = {
    hasMajority,
    getMajority,
    filterRemovedValidators,
    isAllowedValidatorsUpdate
}