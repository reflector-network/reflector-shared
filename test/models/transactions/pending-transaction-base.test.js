/*eslint-disable no-undef */
const {Keypair, xdr} = require('@stellar/stellar-sdk')
const PendingTransactionBase = require('../../../models/transactions/pending-transaction-base')
const PendingTransactionType = require('../../../models/transactions/pending-transaction-type')
const ValidationError = require('../../../models/validation-error')

const hash = Buffer.alloc(32, 7)

class TestTransaction extends PendingTransactionBase {
    constructor() {
        super({hash: () => hash, signatures: []}, 1, PendingTransactionType.ORACLE_PRICE_UPDATE)
    }
}

/**
 * @param {Keypair} kp - signer
 * @param {Buffer} [payload] - what to sign; defaults to the transaction hash
 * @returns {xdr.DecoratedSignature}
 */
function decorated(kp, payload = hash) {
    return new xdr.DecoratedSignature({hint: kp.signatureHint(), signature: kp.sign(payload)})
}

/**
 * Stand-in for a signature hint minted by a second copy of the sdk loaded in the same process. It cannot be the class
 * the sdk in scope would produce, and its equals() reproduces XdrValue.equals - identical bytes, different constructor,
 * so the wrapper comparison says "not equal" while the value comparison says "equal".
 */
class ForeignSignatureHint {
    constructor(bytes) {
        this.bytes = Buffer.from(bytes)
        this.length = this.bytes.length
    }

    toXDR() {
        return Buffer.from(this.bytes)
    }

    equals(other) {
        if (this === other)
            return true
        if (!other || this.constructor !== other.constructor)
            return false
        return Buffer.compare(this.toXDR(), Buffer.from(other.toXDR())) === 0
    }
}

/**
 * @param {Keypair} kp - signer
 * @param {Buffer} [hintBytes] - hint bytes; defaults to the signer's own hint
 * @returns {{hint: ForeignSignatureHint, signature: Buffer}}
 */
function foreignDecorated(kp, hintBytes = kp.signatureHint()) {
    return {hint: new ForeignSignatureHint(hintBytes), signature: kp.sign(hash)}
}

describe('PendingTransactionBase signer accounting', () => {
    const kpA = Keypair.random()
    const kpB = Keypair.random()
    const kpC = Keypair.random()

    test('the same valid signature added twice counts once', () => {
        const tx = new TestTransaction()
        expect(tx.addSignature(decorated(kpA), kpA.publicKey())).toBe(true)
        expect(tx.addSignature(decorated(kpA), kpA.publicKey())).toBe(false)
        expect(tx.signatures).toHaveLength(1)
        expect(tx.isReadyToSubmit(3)).toBe(false)
    })

    test('two distinct signers reach the majority of three; a re-sent signature does not', () => {
        const tx = new TestTransaction()
        tx.addSignature(decorated(kpA), kpA.publicKey())
        tx.addSignature(decorated(kpA), kpA.publicKey())
        expect(tx.isReadyToSubmit(3)).toBe(false)
        tx.addSignature(decorated(kpB), kpB.publicKey())
        expect(tx.isReadyToSubmit(3)).toBe(true)
        expect(tx.getMajoritySignatures(3)).toHaveLength(2)
    })

    test('a signer outside the allowed set is ignored', () => {
        const tx = new TestTransaction()
        tx.setAllowedSigners([kpA.publicKey(), kpB.publicKey()])
        expect(tx.addSignature(decorated(kpC), kpC.publicKey())).toBe(false)
        expect(tx.signatures).toHaveLength(0)
    })

    test('a signature over a different hash is ignored', () => {
        const tx = new TestTransaction()
        expect(tx.addSignature(decorated(kpA, Buffer.alloc(32, 9)), kpA.publicKey())).toBe(false)
        expect(tx.signatures).toHaveLength(0)
    })

    test('a signature whose hint does not match the claimed pubkey is ignored', () => {
        const tx = new TestTransaction()
        expect(tx.addSignature(decorated(kpA), kpB.publicKey())).toBe(false)
        expect(tx.signatures).toHaveLength(0)
    })

    test('legacy callers without a pubkey are de-duplicated by hint', () => {
        const tx = new TestTransaction()
        expect(tx.addSignature(decorated(kpA))).toBe(true)
        expect(tx.addSignature(decorated(kpA))).toBe(false)
        expect(tx.addSignature(decorated(kpB))).toBe(true)
        expect(tx.signatures).toHaveLength(2)
    })

    test('a hint already present cannot be re-added through the other path', () => {
        const tx = new TestTransaction()
        tx.addSignature(decorated(kpA))
        expect(tx.addSignature(decorated(kpA), kpA.publicKey())).toBe(false)
        expect(tx.signatures).toHaveLength(1)
    })

    test('a hint from another copy of the sdk is matched by value, not by class', () => {
        const tx = new TestTransaction()
        expect(tx.addSignature(foreignDecorated(kpA), kpA.publicKey())).toBe(true)
        expect(tx.signatures).toHaveLength(1)
        //the same signer still counts once, whichever copy of the sdk minted the hint
        expect(tx.addSignature(decorated(kpA), kpA.publicKey())).toBe(false)
        expect(tx.signatures).toHaveLength(1)
    })

    test('a hint from another copy of the sdk with the wrong bytes is still ignored', () => {
        const tx = new TestTransaction()
        expect(tx.addSignature(foreignDecorated(kpA, kpB.signatureHint()), kpA.publicKey())).toBe(false)
        expect(tx.addSignature(foreignDecorated(kpA, Buffer.alloc(4)), kpA.publicKey())).toBe(false)
        expect(tx.signatures).toHaveLength(0)
    })

    test('a hint of the wrong length is still ignored', () => {
        const tx = new TestTransaction()
        const hint = kpA.signatureHint()
        expect(tx.addSignature(foreignDecorated(kpA, hint.subarray(0, 3)), kpA.publicKey())).toBe(false)
        expect(tx.addSignature(foreignDecorated(kpA, Buffer.concat([hint, Buffer.alloc(4)])), kpA.publicKey())).toBe(false)
        expect(tx.addSignature(foreignDecorated(kpA, Buffer.alloc(0)), kpA.publicKey())).toBe(false)
        expect(tx.signatures).toHaveLength(0)
    })

    test('malformed input throws', () => {
        const tx = new TestTransaction()
        expect(() => tx.addSignature(null)).toThrow(ValidationError)
        expect(() => tx.addSignature(null)).toThrow('signature must be a DecoratedSignature')
        expect(() => tx.addSignature({hint: 'x'})).toThrow('signature must be a DecoratedSignature')
        expect(() => tx.addSignature(decorated(kpA), 'not-a-key')).toThrow(ValidationError)
        expect(() => tx.addSignature(decorated(kpA), 'not-a-key')).toThrow('pubkey is invalid')
    })
})
