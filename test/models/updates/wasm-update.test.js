/*eslint-disable no-undef */
const WasmUpdate = require('../../../models/updates/wasm-update')
const ContractTypes = require('../../../models/configs/contract-type')

describe('WasmUpdate.toPlainObject', () => {
    test('emits only admin and contract per target, so the result is JSON-serialisable', () => {
        const update = new WasmUpdate(1, 'a'.repeat(64), ContractTypes.ORACLE)
        update.assignContractsToUpdate([
            {admin: 'GA', contract: 'CA', contractState: {lastTimestamp: 5n}, contractStatePromise: Promise.resolve()}
        ])
        const plain = update.toPlainObject()
        expect(plain.contractsToUpdate).toEqual([{admin: 'GA', contract: 'CA'}])
        expect(() => JSON.stringify(plain)).not.toThrow()
    })

    test('omits contractsToUpdate before targets are assigned', () => {
        const plain = new WasmUpdate(1, 'a'.repeat(64), ContractTypes.ORACLE).toPlainObject()
        expect(plain.contractsToUpdate).toBeUndefined()
    })
})
