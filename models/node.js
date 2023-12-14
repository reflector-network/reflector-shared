const {StrKey} = require('stellar-sdk')
const {sortObjectKeys} = require('../utils/index')

const urlRegex = /^(http:\/\/|https:\/\/|ws:\/\/|wss:\/\/)?(localhost|(([0-9]{1,3}\.){3}[0-9]{1,3})|([\da-z.-]+)\.([a-z.]{2,6}))(:(\d+))?$/

module.exports = class Node {

    constructor(rawNode) {
        if (!rawNode)
            throw new Error('Node is undefined')
        const {pubkey, url} = rawNode
        if (!pubkey || !StrKey.isValidEd25519PublicKey(pubkey))
            throw new Error('pubkey is undefined or invalid')
        if (!url || !urlRegex.test(url))
            throw new Error('url is undefined or invalid')
        this.pubkey = pubkey
        this.url = url
    }

    /**
     * @type {string}
     */
    pubkey

    /**
     * @type {string}
     */
    url

    toPlainObject() {
        return sortObjectKeys({
            pubkey: this.pubkey,
            url: this.url
        })
    }

    equals(other) {
        if (!(other instanceof Node))
            return false
        return this.pubkey === other.pubkey && this.url === other.url
    }
}