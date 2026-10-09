const {Keypair, StrKey} = require('@stellar/stellar-sdk')
const {hasMajority, getMajority} = require('../../utils/majority-helper')
const ValidationError = require('../validation-error')
const PendingTransactionType = require('./pending-transaction-type')

const pendingTxTypeValues = Object.values(PendingTransactionType)

/**
 * @typedef {import('@stellar/stellar-sdk').xdr.DecoratedSignature} DecoratedSignature
 * @typedef {import('@stellar/stellar-sdk').Transaction} Transaction
 */

module.exports = class PendingTransactionBase {

    /**
     * @param {Transaction} transaction - transaction hash
     * @param {number} timestamp - transaction timestamp
     * @param {string} type - transaction type
     */
    constructor(transaction, timestamp, type) {
        //instance of this abstract class cannot be created
        if (this.constructor === PendingTransactionBase)
            throw new Error('PendingTransactionBase is abstract class')
        if (!transaction)
            throw new Error('transaction is required')
        if (!timestamp)
            throw new Error('timestamp is required')
        if (!pendingTxTypeValues.includes(type))
            throw new Error('type is required')
        this.timestamp = timestamp
        this.transaction = transaction
        this.hash = Buffer.from(transaction.hash())
        this.hashHex = this.hash.toString('hex')
        this.type = type
        this.signatures = []
    }

    /**
     * @type {Transaction}
     */
    transaction

    /**
     * @type {string}
     */
    type

    /**
     * @type {Buffer}
     */
    hash

    /**
     * @type {string}
     */
    hashHex

    /**
     * One entry per signer
     * @type {DecoratedSignature[]}
     */
    signatures

    /**
     * @type {boolean}
     */
    isSigned = false

    /**
     * Hex-encoded hints of the signatures already added, so every signer counts once
     * @type {Set<string>}
     */
    __hints = new Set()

    /**
     * Public keys allowed to sign; null accepts any signer that verifies
     * @type {Set<string>|null}
     */
    __allowedSigners = null

    /**
     * Restrict signatures to a node set, normally the cluster's nodes captured when the transaction was built
     * @param {Iterable<string>} pubkeys - allowed public keys
     */
    setAllowedSigners(pubkeys) {
        this.__allowedSigners = new Set(pubkeys)
    }

    /**
     * Adds a signature once per signer. With a pubkey the signature must carry that key's hint, verify against the
     * transaction hash and belong to the allowed signers; without one, only the hint de-duplication applies.
     * @param {DecoratedSignature} signature - decorated signature
     * @param {string} [pubkey] - signer public key
     * @returns {boolean} true when the signature was added
     */
    addSignature(signature, pubkey = null) {
        if (!signature || !signature.hint || !signature.signature || typeof signature.hint.toXDR !== 'function')
            throw new ValidationError('signature must be a DecoratedSignature')
        if (pubkey !== null) {
            if (!StrKey.isValidEd25519PublicKey(pubkey))
                throw new ValidationError('pubkey is invalid')
            if (this.__allowedSigners && !this.__allowedSigners.has(pubkey))
                return false
            const keypair = Keypair.fromPublicKey(pubkey)
            //compare the raw hint bytes rather than the xdr wrappers - XdrValue.equals also requires both operands to
            //come from the same constructor, so a hint minted by a second copy of the sdk loaded in the same process
            //is refused despite identical bytes, and the node stops accepting signatures, its own included
            if (Buffer.compare(Buffer.from(signature.hint.toXDR()), Buffer.from(keypair.signatureHint())) !== 0)
                return false
            if (!keypair.verify(this.hash, signature.signature))
                return false
        }
        const hintKey = Buffer.from(signature.hint.toXDR()).toString('hex')
        if (this.__hints.has(hintKey))
            return false
        this.__hints.add(hintKey)
        this.signatures.push(signature)
        return true
    }

    signTransaction(totalSignersCount) {
        for (const signature of this.getMajoritySignatures(totalSignersCount))
            this.transaction.signatures.push(signature)

        this.isSigned = true
    }

    /**
     * @param {number} totalSignersCount - total signers count
     * @returns {DecoratedSignature[]} the first majority-many distinct signatures
     */
    getMajoritySignatures(totalSignersCount) {
        return this.signatures.slice(0, getMajority(totalSignersCount))
    }

    /**
     * @param {number} totalSignersCount - total signers count
     * @returns {boolean}
     */
    isReadyToSubmit(totalSignersCount) {
        return hasMajority(totalSignersCount, this.signatures.length)
    }

    getDebugInfo() {
        return `${this.hashHex} (${this.type})`
    }
}
