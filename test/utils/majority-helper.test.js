/*eslint-disable no-undef */
const {areAllSignaturesPresent, getMajority, hasMajority} = require('../../utils/majority-helper')

describe('areAllSignaturesPresent', () => {
    const validators = ['GA', 'GB', 'GC']

    test('true when every retained validator accepted', () => {
        const signatures = [{pubkey: 'GA'}, {pubkey: 'GB', rejected: false}, {pubkey: 'GC'}]
        expect(areAllSignaturesPresent(validators, validators, signatures)).toBe(true)
    })

    test('false when a retained validator rejected', () => {
        const signatures = [{pubkey: 'GA'}, {pubkey: 'GB', rejected: true}, {pubkey: 'GC'}]
        expect(areAllSignaturesPresent(validators, validators, signatures)).toBe(false)
    })

    test('validators removed by the update are not required', () => {
        const signatures = [{pubkey: 'GA'}, {pubkey: 'GB'}]
        expect(areAllSignaturesPresent(validators, ['GA', 'GB'], signatures)).toBe(true)
    })
})

describe('majority arithmetic', () => {
    test('majority is floor(n/2)+1', () => {
        expect(getMajority(1)).toBe(1)
        expect(getMajority(2)).toBe(2)
        expect(getMajority(3)).toBe(2)
        expect(getMajority(4)).toBe(3)
        expect(getMajority(7)).toBe(4)
    })

    test('hasMajority compares against that threshold', () => {
        expect(hasMajority(7, 3)).toBe(false)
        expect(hasMajority(7, 4)).toBe(true)
    })
})
