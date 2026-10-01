/*eslint-disable no-undef */
const fs = require('fs')
const path = require('path')
const {Account, Keypair} = require('@stellar/stellar-sdk')
const Config = require('../models/configs/config')
const {sortObjectKeys, compareStrings} = require('../utils/serialization-helper')
const {getDataHash} = require('../helpers/signatures-helper')
const {buildUpdateTransaction} = require('../index')
const {legacyConfig} = require('./constants')

//Computed with the serializer as it was before the ordering change; it must never move
const PINNED_LEGACY_CONFIG_HASH = '059eb790903142a1a900af5efa4f430cb2563dbc737c2efba581da4a6e3be82e'

describe('canonical serialization', () => {
    test('the fixture config hash is pinned', () => {
        expect(new Config(legacyConfig).getHash()).toBe(PINNED_LEGACY_CONFIG_HASH)
        expect(getDataHash(sortObjectKeys(legacyConfig))).toBe(PINNED_LEGACY_CONFIG_HASH)
    })

    test('keys are ordered by code unit, not by locale', () => {
        const sorted = sortObjectKeys({b: 1, B: 2, a: 3, _x: 4, 'z-a': 5, za: 6})
        expect(Object.keys(sorted)).toEqual(['B', '_x', 'a', 'b', 'z-a', 'za'])
    })

    test('compareStrings is a total code-unit order', () => {
        expect(['token', 'type', 'Type'].sort(compareStrings)).toEqual(['Type', 'token', 'type'])
        expect(compareStrings('a', 'a')).toBe(0)
        expect(compareStrings('a', 'b')).toBe(-1)
        expect(compareStrings('b', 'a')).toBe(1)
    })

    test('no consensus-path source uses a locale-sensitive comparison', () => {
        const localeTokens = ['localeCompare', 'Intl.Collator', 'toLocale']
        const root = path.join(__dirname, '..')
        const offenders = []
        const walk = dir => {
            for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
                const full = path.join(dir, entry.name)
                if (entry.isDirectory())
                    walk(full)
                else if (entry.name.endsWith('.js') && localeTokens.some(token => fs.readFileSync(full, 'utf8').includes(token)))
                    offenders.push(path.relative(root, full))
            }
        }
        for (const dir of ['utils', 'helpers', 'models'])
            walk(path.join(root, dir))
        expect(offenders).toEqual([])
    })
})

describe('transaction construction is deterministic', () => {
    const network = 'Test SDF Network ; September 2015'
    const timestamp = 1700000000000
    const addedNode = Keypair.random().publicKey()

    function buildConfigs() {
        const current = new Config(legacyConfig)
        const raw = JSON.parse(JSON.stringify(legacyConfig))
        raw.nodes[addedNode] = {pubkey: addedNode, url: 'ws://127.0.0.1:3003', domain: 'node3.com'}
        return {current, next: new Config(raw)}
    }

    async function buildNodesTx() {
        const {current, next} = buildConfigs()
        return await buildUpdateTransaction({
            network,
            sorobanRpc: ['http://unused.rpc'],
            currentConfig: current,
            newConfig: next,
            account: new Account(legacyConfig.systemAccount, '1'),
            timestamp,
            maxTime: Math.floor(timestamp / 1000) + 60,
            fee: 1000
        })
    }

    test('nodes-update operations are grouped by admin in code-unit order', async () => {
        const tx = await buildNodesTx()
        const admins = [...new Set(tx.transaction.operations.map(op => op.source))]
        expect(admins.length).toBeGreaterThan(1)
        expect(admins).toEqual([...admins].sort(compareStrings))
    })

    test('the same update builds identical XDR under two different clocks', async () => {
        const nowSpy = jest.spyOn(Date, 'now')
        nowSpy.mockReturnValue(1000)
        const first = (await buildNodesTx()).transaction.toXDR()
        nowSpy.mockReturnValue(9999999999999)
        const second = (await buildNodesTx()).transaction.toXDR()
        nowSpy.mockRestore()
        expect(second).toBe(first)
    })
})
