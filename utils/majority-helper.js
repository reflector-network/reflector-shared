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

/**
 * Check if the validators update is allowed
 * @param {string[]} currentValidators - current validators
 * @param {string[]} newValidators - new validators
 * @returns {boolean}
 */
function isAllowedValidatorsUpdate(currentValidators, newValidators) {
    const validators = filterRemovedValidators(currentValidators, newValidators)
    //get current validators majority
    const majority = getMajority(currentValidators.length)
    return validators.length >= majority
}

/**
 * Check if all signatures are present
 * @param {string[]} currentValidators - current validators
 * @param {string[]} newValidators - new validators
 * @param {{pubkey:string}[]} signatures - signatures to check
 * @returns {boolean}
 */
function areAllSignaturesPresent(currentValidators, newValidators, signatures) {
    const requiredNodes = filterRemovedValidators(currentValidators, newValidators)
    return requiredNodes
        .every(node =>
            signatures.some(signature => signature.pubkey === node)
        )
}

module.exports = {
    hasMajority,
    getMajority,
    filterRemovedValidators,
    isAllowedValidatorsUpdate,
    areAllSignaturesPresent
}