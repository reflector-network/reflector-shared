export function hasMajority(totalSignersCount, signaturesCount) {
    return signaturesCount >= getMajority(totalSignersCount)
}

export function getMajority(totalSignersCount) {
    return Math.floor(totalSignersCount / 2) + 1
}