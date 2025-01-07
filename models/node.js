const {StrKey} = require('@stellar/stellar-sdk')
const {sortObjectKeys} = require('../utils/serialization-helper')

const urlRegex = /^(|ws:\/\/|wss:\/\/)[\w-.:]+$/

module.exports = class Node {

    constructor(rawNode) {
        if (!rawNode)
            throw new Error('Node is undefined')
        const {pubkey, url, domain} = rawNode
        if (!pubkey || !StrKey.isValidEd25519PublicKey(pubkey))
            throw new Error('pubkey is undefined or invalid')
        if (!url || !urlRegex.test(url))
            throw new Error('url is undefined or invalid')
        if (!domain)
            throw new Error('domain is undefined or invalid')
        this.pubkey = pubkey
        this.url = url
        this.domain = domain
    }

    /**
     * @type {string}
     */
    pubkey

    /**
     * @type {string}
     */
    url

    /**
     * @type {string}
     */
    domain

    toPlainObject() {
        return sortObjectKeys({
            pubkey: this.pubkey,
            url: this.url,
            domain: this.domain
        })
    }

    equals(other) {
        if (!(other instanceof Node))
            return false
        return this.pubkey === other.pubkey
            && this.url === other.url
            && this.domain === other.domain
    }
}