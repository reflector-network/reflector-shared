/*eslint-disable no-undef */
const {Keypair} = require('@stellar/stellar-sdk')
const ConfigEnvelope = require('../../../models/configs/config-envelope')
const Config = require('../../../models/configs/config')
const ValidationError = require('../../../models/validation-error')
const {legacyConfig} = require('../../constants')

const nodeKps = [Keypair.random(), Keypair.random(), Keypair.random()]
const [kpA, kpB, kpC] = nodeKps

/**
 * Fixture config whose nodes are keypairs this test can sign with
 * @returns {object} raw config
 */
function buildRawConfig() {
    const raw = JSON.parse(JSON.stringify(legacyConfig))
    raw.nodes = {}
    nodeKps.forEach((kp, i) => {
        raw.nodes[kp.publicKey()] = {pubkey: kp.publicKey(), url: `ws://127.0.0.1:300${i}`, domain: `node${i}.com`}
    })
    return raw
}

/**
 * Signs a config the way admin-dashboard does
 * @param {object} rawConfig - raw config
 * @param {Keypair} kp - signer
 * @param {{nonce: number, rejected: boolean}} [options] - signature options
 * @returns {object} raw signature entry
 */
function sign(rawConfig, kp, {nonce = 1, rejected = false} = {}) {
    const hash = new Config(rawConfig).getSignaturePayloadHash(kp.publicKey(), nonce, rejected)
    const signature = Buffer.from(kp.sign(Buffer.from(hash, 'hex'))).toString('hex')
    const entry = {pubkey: kp.publicKey(), nonce, signature}
    if (rejected)
        entry.rejected = true
    return entry
}

function envelope(rawConfig, signatures) {
    return new ConfigEnvelope({config: rawConfig, signatures, timestamp: 0})
}

/**
 * @returns {string[]} the current cluster's node keys
 */
function currentNodes() {
    return nodeKps.map(kp => kp.publicKey())
}

describe('ConfigEnvelope.verifySignatures', () => {
    test('accepts a fully valid envelope and lists the accepting signers', () => {
        const raw = buildRawConfig()
        const result = envelope(raw, [sign(raw, kpA), sign(raw, kpB)]).verifySignatures(currentNodes())
        expect(result.valid).toBe(true)
        expect(result.accepted).toEqual([kpA.publicKey(), kpB.publicKey()])
        expect(result.rejected).toEqual([])
        expect(result.invalid).toEqual([])
        expect(result.unknown).toEqual([])
    })

    test('a rejected vote verifies with its own flag', () => {
        const raw = buildRawConfig()
        const result = envelope(raw, [sign(raw, kpA), sign(raw, kpB, {rejected: true})]).verifySignatures(currentNodes())
        expect(result.valid).toBe(true)
        expect(result.accepted).toEqual([kpA.publicKey()])
        expect(result.rejected).toEqual([kpB.publicKey()])
    })

    test('a signer outside the node set is reported unknown', () => {
        const raw = buildRawConfig()
        const outsider = Keypair.random()
        const result = envelope(raw, [sign(raw, kpA), sign(raw, outsider)]).verifySignatures(currentNodes())
        expect(result.valid).toBe(false)
        expect(result.unknown).toEqual([outsider.publicKey()])
        expect(result.accepted).toEqual([kpA.publicKey()])
    })

    test('a signature that does not match the payload is reported invalid', () => {
        const raw = buildRawConfig()
        const flipped = {...sign(raw, kpB), rejected: true} //signed as an acceptance, presented as a rejection
        const result = envelope(raw, [sign(raw, kpA), flipped]).verifySignatures(currentNodes())
        expect(result.valid).toBe(false)
        expect(result.invalid).toEqual([kpB.publicKey()])
    })

    test('allowedPubkeys is required and must not be empty', () => {
        const raw = buildRawConfig()
        const env = envelope(raw, [sign(raw, kpA)])
        expect(() => env.verifySignatures()).toThrow(ValidationError)
        expect(() => env.verifySignatures([])).toThrow('allowedPubkeys is empty')
    })

    test('a node the config adds cannot vote for its own addition; a node it removes still can', () => {
        const added = Keypair.random()
        const raw = buildRawConfig()
        raw.nodes[added.publicKey()] = {pubkey: added.publicKey(), url: 'ws://added:30347', domain: 'added.example'}
        delete raw.nodes[kpC.publicKey()]
        const result = envelope(raw, [sign(raw, kpA), sign(raw, kpC), sign(raw, added)]).verifySignatures(currentNodes())
        expect(result.valid).toBe(false)
        expect(result.accepted).toEqual([kpA.publicKey(), kpC.publicKey()])
        expect(result.unknown).toEqual([added.publicKey()])
    })

    test('allowedPubkeys can be narrower than config.nodes', () => {
        const raw = buildRawConfig()
        const result = envelope(raw, [sign(raw, kpA), sign(raw, kpC)]).verifySignatures([kpA.publicKey()])
        expect(result.valid).toBe(false)
        expect(result.unknown).toEqual([kpC.publicKey()])
    })
})

describe('Signature validation', () => {
    const raw = buildRawConfig()

    test('rejects a string nonce', () => {
        const entry = {...sign(raw, kpA), nonce: '5'}
        expect(() => envelope(raw, [entry])).toThrow(ValidationError)
        expect(() => envelope(raw, [entry])).toThrow('nonce must be a positive integer')
    })

    test('rejects a non-integer and a zero nonce', () => {
        expect(() => envelope(raw, [{...sign(raw, kpA), nonce: 1.5}])).toThrow('nonce must be a positive integer')
        expect(() => envelope(raw, [{...sign(raw, kpA), nonce: 0}])).toThrow('nonce must be a positive integer')
    })

    test('rejects a signature that is not 128 hex characters', () => {
        expect(() => envelope(raw, [{...sign(raw, kpA), signature: 'zz'}])).toThrow('signature must be 128 hex characters')
    })

    test('rejects signatures that are not an array', () => {
        expect(() => envelope(raw, {})).toThrow('signatures must be an array')
    })

    test('rejects a null signature entry', () => {
        expect(() => envelope(raw, [null])).toThrow('signature entry must be an object')
    })

    test('rejects a duplicate signer', () => {
        expect(() => envelope(raw, [sign(raw, kpA), sign(raw, kpA, {nonce: 2})])).toThrow(`signature for ${kpA.publicKey()} already exists`)
    })

    test('rejects a non-boolean rejected flag and normalises an absent one to false', () => {
        expect(() => envelope(raw, [{...sign(raw, kpA), rejected: 'yes'}])).toThrow('rejected must be a boolean')
        const [signature] = envelope(raw, [sign(raw, kpA)]).signatures
        expect(signature.rejected).toBe(false)
        expect(signature.toPlainObject().rejected).toBeUndefined()
    })
})

describe('malformed envelope input is a validation error', () => {
    const raw = buildRawConfig()

    test('a missing envelope, a missing config and a bad timestamp are ValidationErrors', () => {
        expect(() => new ConfigEnvelope(null)).toThrow(ValidationError)
        expect(() => new ConfigEnvelope({signatures: [], timestamp: 0})).toThrow(ValidationError)
        expect(() => new ConfigEnvelope({config: raw, signatures: [], timestamp: 'soon'})).toThrow(ValidationError)
        expect(() => new ConfigEnvelope({config: raw, signatures: [], timestamp: -1})).toThrow('timestamp is not a valid number')
    })

    test('the messages are unchanged', () => {
        expect(() => new ConfigEnvelope(undefined)).toThrow('rawEnvelope is required')
        expect(() => new ConfigEnvelope({signatures: [], timestamp: 0})).toThrow('config is required')
        expect(() => new ConfigEnvelope({config: raw, signatures: [], timestamp: -1})).toThrow(ValidationError)
    })

    test('the timestamp keeps its parseInt reading', () => {
        expect(new ConfigEnvelope({config: raw, signatures: [], timestamp: '12abc'}).timestamp).toBe(12)
        expect(new ConfigEnvelope({config: raw, signatures: [], timestamp: 1.5}).timestamp).toBe(1)
        expect(new ConfigEnvelope({config: raw, signatures: [], timestamp: 0}).timestamp).toBe(0)
    })
})
