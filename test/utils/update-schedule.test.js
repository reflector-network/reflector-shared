/*eslint-disable no-undef */
const schedule = require('../../utils/update-schedule')
const shared = require('../../index')

describe('the submit schedule', () => {
    const sync = 1_800_000_000_000

    test('a round has two attempts, the retry paying eight times the base fee', () => {
        expect(schedule.maxSubmitAttempts).toBe(2)
        expect(schedule.FEE_MULTIPLIER).toBe(8)
    })

    test('attempt 1 ends 40 s after the sync, whatever the round length', () => {
        expect(schedule.getMaxTime(sync, 0, 60_000)).toBe((sync + 40_000) / 1000)
        expect(schedule.getMaxTime(sync, 0, 300_000)).toBe((sync + 40_000) / 1000)
    })

    test('attempt 2 runs until the next round: one round length after the sync', () => {
        expect(schedule.getMaxTime(sync, 1, 60_000)).toBe((sync + 60_000) / 1000)
        expect(schedule.getMaxTime(sync, 1, 300_000)).toBe((sync + 300_000) / 1000)
    })

    test('a round length that is missing or shorter than the first attempt is refused', () => {
        for (const roundLength of [undefined, NaN, Infinity, 39_999, 0, -60_000])
            expect(() => schedule.getMaxTime(sync, 1, roundLength)).toThrow(/round length/i)
        expect(() => schedule.getMaxTime(sync, 0, 40_000)).not.toThrow()
    })

    test('cluster rounds keep a 60 s envelope inside the 120 s sync grid', () => {
        expect(schedule.syncTimeframe).toBe(120_000)
        expect(schedule.clusterRoundLength).toBe(60_000)
    })

    test('the switch is inclusive: the tick equal to the switch time is due', () => {
        expect(schedule.isUpdateTimeReached(sync, sync)).toBe(true)
        expect(schedule.isUpdateTimeReached(sync, sync + 1)).toBe(true)
        expect(schedule.isUpdateTimeReached(sync, sync - 1)).toBe(false)
    })

    test('a round ends before expiry only when its last attempt and the poll a second past it are over by then', () => {
        expect(schedule.endsBeforeExpiration(sync, sync + 61_000)).toBe(true)
        expect(schedule.endsBeforeExpiration(sync, sync + 61_001)).toBe(true)
        expect(schedule.endsBeforeExpiration(sync, sync + 60_999)).toBe(false)
        expect(schedule.endsBeforeExpiration(sync, sync)).toBe(false)
        expect(schedule.endsBeforeExpiration(sync + 120_000, sync + 181_000)).toBe(true)
        expect(schedule.endsBeforeExpiration(sync + 120_000, sync + 180_999)).toBe(false)
    })

    test('the package exports the schedule itself', () => {
        for (const name of ['FEE_MULTIPLIER', 'firstAttemptTimeout', 'maxSubmitAttempts', 'syncTimeframe', 'clusterRoundLength',
            'getMaxTime', 'isUpdateTimeReached', 'endsBeforeExpiration'])
            expect(shared[name]).toBe(schedule[name])
    })
})
