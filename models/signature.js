import { StrKey } from 'stellar-base'
import { sortObjectKeys } from '../utils/index.js'

export default class Signature {
    constructor(rawSignature) {
        if (!rawSignature)
            throw new Error('rawSignature is required')
        this.__setSigner(rawSignature.signer)
        this.__setSignature(rawSignature.signature)
        this.__setNonce(rawSignature.nonce)
    }

    __setSigner(signer) {
        if (!signer)
            throw new Error('signer is required')
        if (!StrKey.isValidEd25519PublicKey(signer))
            throw new Error('signer is invalid')
        this.signer = signer
    }

    __setSignature(signature) {
        if (!signature)
            throw new Error('signature is required')
        if (signature.length !== 64)
            throw new Error('signature is invalid')
        this.signature = signature
    }

    __setNonce(nonce) {
        if (!nonce)
            throw new Error('nonce is required')
        if (nonce < 1)
            throw new Error('nonce is invalid')
        this.nonce = nonce
    }

    toPlainObject() {
        return sortObjectKeys({
            signer: this.signer,
            signature: this.signature,
            nonce: this.nonce
        })
    }
}