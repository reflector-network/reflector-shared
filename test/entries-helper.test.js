/*eslint-disable no-undef */
const nock = require('nock')
const {xdr} = require('@stellar/stellar-sdk')
const {getSubscriptions, getSubscriptionsContractState, getOracleContractState, getContractState, getContractInstanceEntries, getContractEntries} = require('../helpers/entries-helper')

const oracleInstanceResponse = {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
        "entries": [
            {
                "key": "AAAABgAAAAF/hOEiwfqE1ySpfbK8tdG3KJv6HZE54cyfGXZMWwGehwAAABQAAAAB",
                "xdr": "AAAABgAAAAAAAAABf4ThIsH6hNckqX2yvLXRtyib+h2ROeHMnxl2TFsBnocAAAAUAAAAAQAAABMAAAAAGI2ij3pQMlGSajpQxdl09bRxVGLX4UHyfxdGdmCH6VQAAAABAAAADwAAAA4AAAAFYWRtaW4AAAAAAAASAAAAAAAAAAANiXrnY3ULZ7pG3zVtwoa0pEqnWHGjC/eaMq+ttQ1USAAAAA4AAAAKYXNzZXRfdHRscwAAAAAAEAAAAAEAAAAGAAAABQAAAZ43dHqoAAAABQAAAZ4D9TDIAAAABQAAAZ4D9TDIAAAABQAAAZ4D9TDIAAAABQAAAZ4D9TDIAAAABQAAAZ4D9kI4AAAADgAAAAZhc3NldHMAAAAAABAAAAABAAAABgAAABAAAAABAAAAAgAAAA8AAAAHU3RlbGxhcgAAAAASAAAAARllfsVezwtrtVDuYrG4ATbtPQOwVp9qRMkirk/OzS5MAAAAEAAAAAEAAAACAAAADwAAAAdTdGVsbGFyAAAAABIAAAAB1l+bFDXWsmQL2pbTlZu6lHUvzniHE8519ToZBewJwU8AAAAQAAAAAQAAAAIAAAAPAAAABU90aGVyAAAAAAAADwAAAANFVVIAAAAAEAAAAAEAAAACAAAADwAAAAdTdGVsbGFyAAAAABIAAAABiXeEsxDsE06H5nSl2lgYitBFQT4QgwzNRcWEky3ND0MAAAAQAAAAAQAAAAIAAAAPAAAAB1N0ZWxsYXIAAAAAEgAAAAHXZ78wv1coSmRTu9ppXKQEAk9s2lVjbJaIy1aTUMz1tQAAABAAAAABAAAAAgAAAA8AAAAFT3RoZXIAAAAAAAAPAAAAA0pQWQAAAAAOAAAACmJhc2VfYXNzZXQAAAAAABAAAAABAAAAAgAAAA8AAAAFT3RoZXIAAAAAAAAPAAAAA1VTRAAAAAAOAAAACGRlY2ltYWxzAAAAAwAAAA4AAAAOAAAAA2ZlZQAAAAAQAAAAAQAAAAIAAAASAAAAAfivLLC8YfyNOYt0WHHVo3zIXrB6/+te3o4rjMC31TL9AAAACgAAAAAAAAAAAAAAAACYloAAAAAOAAAADmxhc3RfdGltZXN0YW1wAAAAAAAFAAABlqxDFoAAAAAOAAAABnBlcmlvZAAAAAAABQAAAAAAFCRAAAAADgAAAApyZXNvbHV0aW9uAAAAAAADAAHUwAAAAA8AAAADRVVSAAAAAAMAAAACAAAADwAAAANKUFkAAAAAAwAAAAUAAAASAAAAARllfsVezwtrtVDuYrG4ATbtPQOwVp9qRMkirk/OzS5MAAAAAwAAAAAAAAASAAAAAYl3hLMQ7BNOh+Z0pdpYGIrQRUE+EIMMzUXFhJMtzQ9DAAAAAwAAAAMAAAASAAAAAdZfmxQ11rJkC9qW05WbupR1L854hxPOdfU6GQXsCcFPAAAAAwAAAAEAAAASAAAAAddnvzC/VyhKZFO72mlcpAQCT2zaVWNslojLVpNQzPW1AAAAAwAAAAQ=",
                "lastModifiedLedgerSeq": 847489,
                "liveUntilLedgerSeq": 2921053
            }
        ],
        "latestLedger": 848499
    }
}

const oracleEntriesResponse = {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
        "entries": [
            {
                "key": "AAAABgAAAAF/hOEiwfqE1ySpfbK8tdG3KJv6HZE54cyfGXZMWwGehwAAAAkAAAGWrEMWgAAAAAAAAAAAAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABf4ThIsH6hNckqX2yvLXRtyib+h2ROeHMnxl2TFsBnocAAAAJAAABlqxDFoAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAExpFX24DM3LnCw==",
                "lastModifiedLedgerSeq": 847470,
                "liveUntilLedgerSeq": 864749
            },
            {
                "key": "AAAABgAAAAF/hOEiwfqE1ySpfbK8tdG3KJv6HZE54cyfGXZMWwGehwAAAAkAAAGWrEMWgAAAAAAAAAABAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABf4ThIsH6hNckqX2yvLXRtyib+h2ROeHMnxl2TFsBnocAAAAJAAABlqxDFoAAAAAAAAAAAQAAAAAAAAAKAAAAAAAANTf1AKggKy67Mw==",
                "lastModifiedLedgerSeq": 847470,
                "liveUntilLedgerSeq": 864749
            },
            {
                "key": "AAAABgAAAAF/hOEiwfqE1ySpfbK8tdG3KJv6HZE54cyfGXZMWwGehwAAAAkAAAGWrEMWgAAAAAAAAAACAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABf4ThIsH6hNckqX2yvLXRtyib+h2ROeHMnxl2TFsBnocAAAAJAAABlqxDFoAAAAAAAAAAAgAAAAAAAAAKAAAAAAAAch+5tqc6uGCwMQ==",
                "lastModifiedLedgerSeq": 847470,
                "liveUntilLedgerSeq": 864749
            },
            {
                "key": "AAAABgAAAAF/hOEiwfqE1ySpfbK8tdG3KJv6HZE54cyfGXZMWwGehwAAAAkAAAGWrEMWgAAAAAAAAAADAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABf4ThIsH6hNckqX2yvLXRtyib+h2ROeHMnxl2TFsBnocAAAAJAAABlqxDFoAAAAAAAAAAAwAAAAAAAAAKAAAAAAAAyVtyDDL3YFTrKw==",
                "lastModifiedLedgerSeq": 847470,
                "liveUntilLedgerSeq": 864749
            },
            {
                "key": "AAAABgAAAAF/hOEiwfqE1ySpfbK8tdG3KJv6HZE54cyfGXZMWwGehwAAAAkAAAGWrEMWgAAAAAAAAAAEAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABf4ThIsH6hNckqX2yvLXRtyib+h2ROeHMnxl2TFsBnocAAAAJAAABlqxDFoAAAAAAAAAABAAAAAAAAAAKAAAAAAAAjQ1a+7HP7Ff7bQ==",
                "lastModifiedLedgerSeq": 847470,
                "liveUntilLedgerSeq": 864749
            },
            {
                "key": "AAAABgAAAAF/hOEiwfqE1ySpfbK8tdG3KJv6HZE54cyfGXZMWwGehwAAAAkAAAGWrEMWgAAAAAAAAAAFAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABf4ThIsH6hNckqX2yvLXRtyib+h2ROeHMnxl2TFsBnocAAAAJAAABlqxDFoAAAAAAAAAABQAAAAAAAAAKAAAAAAAADZoxbag1yPRFTQ==",
                "lastModifiedLedgerSeq": 847470,
                "liveUntilLedgerSeq": 864749
            }
        ],
        "latestLedger": 848540
    }
}

const subsInstanceResponse = {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
        "entries": [
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAABQAAAAB",
                "xdr": "AAAABgAAAAAAAAABwRIQpswwh76XY/kjRuwxspGZ58YHkxmK4Dt10ziyo2cAAAAUAAAAAQAAABMAAAAAVnzVDO11QKuEBufdb0sn0MgeD7hm1JuJwzh1dHXRipwAAAABAAAABAAAAA4AAAAFYWRtaW4AAAAAAAASAAAAAAAAAAC0X2UGKZ1hUKYhMV5BoXytYhidypvc48ZuOTdiLLH5zQAAAA4AAAAIYmFzZV9mZWUAAAAFAAAAAAAAAGQAAAAOAAAABGxhc3QAAAAFAAAAAAAAAA4AAAAOAAAABXRva2VuAAAAAAAAEgAAAAFphD9JIfz30nCaFkY+F/oUHfJd/vl6UgTjNxqQ7sAK6w==",
                "lastModifiedLedgerSeq": 487887,
                "liveUntilLedgerSeq": 2561468
            }
        ],
        "latestLedger": 488525
    }
}

const subsEntriesResponse = {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
        "entries": [
            {
                "key": "AAAABgAAAAHBEhCmzDCHvpdj+SNG7DGykZnnxgeTGYrgO3XTOLKjZwAAAAUAAAAAAAAAAQAAAAE=",
                "xdr": "AAAABgAAAAAAAAABwRIQpswwh76XY/kjRuwxspGZ58YHkxmK4Dt10ziyo2cAAAAFAAAAAAAAAAEAAAABAAAAEQAAAAEAAAAJAAAADwAAAAdiYWxhbmNlAAAAAAUAAAAAAAAAAAAAAA8AAAAEYmFzZQAAABEAAAABAAAAAgAAAA8AAAAFYXNzZXQAAAAAAAAQAAAAAQAAAAIAAAAPAAAABU90aGVyAAAAAAAADwAAAANYTE0AAAAADwAAAAZzb3VyY2UAAAAAAA4AAAAJZXhjaGFuZ2VzAAAAAAAADwAAAAloZWFydGJlYXQAAAAAAAADAAAABQAAAA8AAAAFb3duZXIAAAAAAAASAAAAAAAAAABTMs5mG8dF+7LkHq+3n7fYegH6Ngygb0IWYdrmJCM4hQAAAA8AAAAFcXVvdGUAAAAAAAARAAAAAQAAAAIAAAAPAAAABWFzc2V0AAAAAAAAEAAAAAEAAAACAAAADwAAAAVPdGhlcgAAAAAAAA8AAAAEVVNEQwAAAA8AAAAGc291cmNlAAAAAAAOAAAACWV4Y2hhbmdlcwAAAAAAAA8AAAAGc3RhdHVzAAAAAAADAAAAAQAAAA8AAAAJdGhyZXNob2xkAAAAAAAAAwAAAAEAAAAPAAAAB3VwZGF0ZWQAAAAABQAAAZF1HDbIAAAADwAAAAd3ZWJob29rAAAAAA0AAAFdxMj4I1iwkSQgWfU52i02IY8V987tzV7ayT9xvAhW6I7WMPkcs5oMjBYEw/pwuJsfhczO6br9ioEqdL7nQV96YClEYz2WhgcmcRdsL6gp4ZobGsUXuur1qT8/zE04xuYKHusivmFVGVo+F95GZY7SLz7JLoHdFYfvBSuAJzMinUoaMfY6QzgqEiRwtHsQf/RXoeJYJMuekYsBuUswlMNoYCTE8o4M7Fa8eU+PBIAyBaRv2+zulKBap2/+tgflDpejVenyfqdnQcKZ/l8BPjc3ydJGQn6F1wreh9Bb45Ujtn6E7OC7TJN1j6PbB+x9Vyt/7OFcCnUMxR02obpbgySofPbS9UIf92ftGYMnh/x6LSqiTKSN4PR8mMuIN6ImlIJ1k/fxVpvIAUB9nZIvUxOkn2wM0oJFNym1fmYMqHLwLtz/FYEbOm9VJZbbo7ogtWWMvVedalg32DpTn5GPoQAAAA==",
                "lastModifiedLedgerSeq": 1161552,
                "liveUntilLedgerSeq": 3218696
            },
            {
                "key": "AAAABgAAAAHBEhCmzDCHvpdj+SNG7DGykZnnxgeTGYrgO3XTOLKjZwAAAAUAAAAAAAAAAgAAAAE=",
                "xdr": "AAAABgAAAAAAAAABwRIQpswwh76XY/kjRuwxspGZ58YHkxmK4Dt10ziyo2cAAAAFAAAAAAAAAAIAAAABAAAAEQAAAAEAAAAJAAAADwAAAAdiYWxhbmNlAAAAAAUAAAAAAAAmSAAAAA8AAAAEYmFzZQAAABEAAAABAAAAAgAAAA8AAAAFYXNzZXQAAAAAAAAQAAAAAQAAAAIAAAAPAAAABU90aGVyAAAAAAAADwAAAANYTE0AAAAADwAAAAZzb3VyY2UAAAAAAA4AAAAJZXhjaGFuZ2VzAAAAAAAADwAAAAloZWFydGJlYXQAAAAAAAADAAAABQAAAA8AAAAFb3duZXIAAAAAAAASAAAAAAAAAABTMs5mG8dF+7LkHq+3n7fYegH6Ngygb0IWYdrmJCM4hQAAAA8AAAAFcXVvdGUAAAAAAAARAAAAAQAAAAIAAAAPAAAABWFzc2V0AAAAAAAAEAAAAAEAAAACAAAADwAAAAVPdGhlcgAAAAAAAA8AAAAEVVNEQwAAAA8AAAAGc291cmNlAAAAAAAOAAAACWV4Y2hhbmdlcwAAAAAAAA8AAAAGc3RhdHVzAAAAAAADAAAAAAAAAA8AAAAJdGhyZXNob2xkAAAAAAAAAwAAAAEAAAAPAAAAB3VwZGF0ZWQAAAAABQAAAZGFD1QgAAAADwAAAAd3ZWJob29rAAAAAA0AAAFdTWNk7K/i4t8tFCiPgXlLr1CnOfbZg3G+66o0Bx+Yks+FvsDaPzLfP3VORzvrH0y84BU3ToHmC/wHkrMTQVoiF38hFYMYLJfCJs+UF1GmzVqaRjQdCyrNv8S0GcswRPKYpJ1904lkEKUKMImW4GxBxAL2CtfdzYC62UPhjxcB7c769BKJwH44D3I5YiuFcGwUi3c18EPg+2jp5NGlBykrqPg9deZBzs2yEXGL0FZsvJhfurZ7x6wmPsJEdk5DgCFdHNLtw0+1vVm9Dn+i9qB+nTS0BG1Qc1p/yUPnBHvU370cR6iYcRGM1bHazR/gLxzHZO08KJhLqdIPQosGWaRvGSOGhSicKsjX7QjuYldKqaOxLVnm+I7/d/25GMuwS1r+TYH4UCm0VR2+tYqxBay1I4DBGMnkzw1ZiUszMIZVIpGtjRoOQmV7D44Ry8IyiAoPtrzLqs2X+KjSgQxazwAAAA==",
                "lastModifiedLedgerSeq": 1212500,
                "liveUntilLedgerSeq": 3286099
            }
        ],
        "latestLedger": 1282112
    }
}

const daoInstanceResponse = {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
        "entries": [
            {
                "key": "AAAABgAAAAHD9WkT4246+8EziShKUzVTfNhmBsbPP3TVub6gOPU+agAAABQAAAAB",
                "xdr": "AAAABgAAAAAAAAABw/VpE+NuOvvBM4koSlM1U3zYZgbGzz901bm+oDj1PmoAAAAUAAAAAQAAABMAAAAAPJlgJI98rKXlOpSoMRZN9NKvXUNvIhimYJUE4SVMY8gAAAABAAAADwAAAAMAAAAAAAAACgAAAAAAAAAAAAAAAAABhqAAAAADAAAAAQAAAAoAAAAAAAAAAAAAAAAAmJaBAAAAAwAAAAIAAAAKAAAAAAAAAAAAAAAAAAAnEgAAAAMAAAADAAAACgAAAAAAAAAAAAAAAACYloMAAAAOAAAAOEdBV0szR05PRU1aRExORkVBRTNSV0E2T01CSzdCM1hRT0tCRUxaUUlSSzZQWlJQRFBWSjRKUlFEAAAACgAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAOEdCVkhBUk9XN1AyRFEzUTNFVUpIR0tFSTdPMlNJWVlUTktWSEJENkQ2WTczNUtLNVlMQ01ETktBAAAACgAAAAAAAAAAAAAAAALcbAAAAAAOAAAAOEdDRENNNExVSVk2NlQyUU5MSVFQVExITkdJVVdJQkNST0hHTUZSRjI0S0hBVTZKU01VMkhNNEFOAAAACgAAAAAAAAAAAAAAAALcbAAAAAAOAAAAOEdDR0JTVEtTS0ZUM0gyQVU2NElHQzJGT0lLV01RWlJJN0dZVEtSVEFJRVBHWkNLTk9OWVZZR0kzAAAACgAAAAAAAAAAAAAAAALcbAAAAAAOAAAAOEdDWUhPQ1JUTFI1RVc2WlJCSTVZWUNCVUNZT1FZSlFSUUlZSkszU0FVTU1BUkdXWVJQM041NTNFAAAACgAAAAAAAAAAAAAAAALcbAAAAAAOAAAAOEdEWVhGQ1BITTJUNVA3RkUyWDVCSlBOSlY1QlpTQ1ZQNkJFVTdHTkkyWEI0UkxUVlpYTkxIRUlOAAAACgAAAAAAAAAAAAAAAALcbAAAAAAOAAAABWFkbWluAAAAAAAAEgAAAAAAAAAAKcUoftxwnfnErxD6hh1pIOF1e5QlL5r6TE25QOBhZwkAAAAOAAAAC2Rhb19iYWxhbmNlAAAAAAoAAAAAAAAAAAAAABc2lUUAAAAADgAAAA5sYXN0X2JhbGxvdF9pZAAAAAAABQAAAAAAAAABAAAADgAAAAtsYXN0X3VubG9jawAAAAAFAAAAAGcJTrwAAAAOAAAABXRva2VuAAAAAAAAEgAAAAG2UwPMoDgzMNFA752Cezs4GZ9mQzj6aUWVr6pz/tzq/w==",
                "lastModifiedLedgerSeq": 508998,
                "liveUntilLedgerSeq": 2582579
            }
        ],
        "latestLedger": 573556
    }
}

function isContractInstanceRequest(rawData) {
    return !xdr.LedgerKey.fromXDR(rawData, 'base64').contractData().key().value()
}


describe('entries helper', () => {

    beforeEach(() => {
        nock('http://bad.rpc.com')
            .persist()
            .post(() => true)
            .reply(503)
        nock('http://good.rpc.com')
            .persist()
            .post(() => true)
            .reply((uri, requestBody) => {
                const uriParams = new URLSearchParams(uri.substring(2))
                switch (uriParams.get('reqData')) {
                    case 'oracle': {
                        if (isContractInstanceRequest(requestBody.params.keys[0]))
                            return [200, oracleInstanceResponse]
                        else
                            return [200, oracleEntriesResponse]
                    }
                    case 'subs': {
                        if (isContractInstanceRequest(requestBody.params.keys[0]))
                            return [200, subsInstanceResponse]
                        else
                            return [200, subsEntriesResponse]
                    }
                    case 'dao': {
                        return [200, daoInstanceResponse]
                    }
                    default:
                        return [200, {
                            "jsonrpc": "2.0",
                            "id": 1,
                            "result": {
                                "entries": [],
                                "latestLedger": 1641313
                            }
                        }]
                }
            })
    })


    test('getContractData existing data', async () => {
        const data = await getOracleContractState('CB7YJYJCYH5IJVZEVF63FPFV2G3SRG72DWITTYOMT4MXMTC3AGPIPSIC', ['http://bad.rpc.com', 'http://good.rpc.com?reqData=oracle'])
        expect(data).toBeDefined()
        expect(data.admin).toBeDefined()
        expect(data.lastTimestamp).toBeGreaterThan(0n)
        expect(data.isInitialized).toBe(true)
        expect(data.hash).toBeDefined()
        expect(data.expirations.length).toBeGreaterThan(0)
    }, 1000000)

    test('getContractData non existing data', async () => {
        const data = await getOracleContractState('CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN', ['http://good.rpc.com?reqData=none'])
        expect(data).toBeDefined()
        expect(data.admin).toBe(null)
        expect(data.lastTimestamp).toBe(0n)
        expect(data.isInitialized).toBe(false)
        expect(data.hash).toBe(null)
    }, 1000000)

    test('getSubscriptionData', async () => {

        const contractId = 'CDAREEFGZQYIPPUXMP4SGRXMGGZJDGPHYYDZGGMK4A5XLUZYWKRWOTOA'

        const {lastSubscriptionId} = await getSubscriptionsContractState(contractId, ['http://good.rpc.com?reqData=subs'])
        expect(lastSubscriptionId).toBeGreaterThan(0n)

        const data = await getSubscriptions(contractId, ['http://good.rpc.com?reqData=subs'], 3)
        expect(data).toBeDefined()
        expect(data.length).toBe(3)
        expect(data[0].id).toBe(1n)
        expect(data[1].id).toBe(2n)
        expect(data[2]).toBe(null)
    }, 1000000)


    test('getDAOData', async () => {

        const contractId = 'CDB7K2IT4NXDV66BGOESQSSTGVJXZWDGA3DM6P3U2W435IBY6U7GVUII'

        const {lastBallotId, lastUnlock} = await getContractState(contractId, ['http://good.rpc.com?reqData=dao'])
        expect(lastBallotId).toBeGreaterThan(0n)
        expect(lastUnlock).toBeGreaterThan(0n)

    }, 1000000)

    test('getContractInstanceEntries', async () => {

        const contractId = 'CB7YJYJCYH5IJVZEVF63FPFV2G3SRG72DWITTYOMT4MXMTC3AGPIPSIC'

        const entries = await getContractInstanceEntries(
            contractId,
            ['http://good.rpc.com?reqData=oracle'],
            ["admin", "last_timestamp"])
        expect(entries).toBeDefined()
        expect(Object.keys(entries).length).toBe(2)
        expect(entries.admin).toBeDefined()
        expect(entries.last_timestamp).toBeDefined()
    }, 1000000)

    test('getContractInstanceEntries non-existing contract', async () => {

        const contractId = 'CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN'
        const entries = await getContractInstanceEntries(
            contractId,
            ['http://good.rpc.com?reqData=none'],
            ["admin", "last_timestamp"])
        expect(entries).toBeDefined()
        expect(Object.keys(entries).length).toBe(0)
    }, 1000000)

    test('getContractEntries', async () => {
        const contractId = 'CDAREEFGZQYIPPUXMP4SGRXMGGZJDGPHYYDZGGMK4A5XLUZYWKRWOTOA'
        const entries = await getContractEntries(
            contractId,
            ['http://good.rpc.com?reqData=subs'],
            [{key: 1n, type: 'u64', persistent: true}])
        expect(entries).toBeDefined()
        expect(Object.keys(entries).length).toBe(1)
        expect(entries['1']).toBeDefined()
    }, 1000000)
})