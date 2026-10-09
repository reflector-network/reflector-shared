/*eslint-disable no-undef */
const shared = require('../../index')

test('the package root exports the contract clients and the rejection code', () => {
    expect(typeof shared.OracleClient).toBe('function')
    expect(typeof shared.SubscriptionsClient).toBe('function')
    expect(typeof shared.DAOClient).toBe('function')
    expect(typeof shared.parseSorobanResult).toBe('function')
    expect(shared.simulationRejectedCode).toBe('SIMULATION_REJECTED')
})
