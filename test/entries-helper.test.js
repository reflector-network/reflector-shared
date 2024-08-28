/*eslint-disable no-undef */
const nock = require('nock')
const {xdr} = require('@stellar/stellar-sdk')
const {getSubscriptions, getSubscriptionsContractState, getOracleContractState} = require('../helpers/entries-helper')

const oracleInstanceResponse = {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
        "entries": [
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAABQAAAAB",
                "xdr": "AAAABgAAAAAAAAABVZKjXnjFmienxhVQ9DYTcUk0HV1XyOkzjWTg8uR/8b4AAAAUAAAAAQAAABMAAAAAq5uUolioO2oprqSVYV4WZVZasSIQU+RhEuYVczXs+SkAAAABAAAAFwAAAA4AAAAFYWRtaW4AAAAAAAASAAAAAAAAAADznxmN41pu9cu1i0CqOFhuvqtH8xtxcsUtvFZjx8ZQCAAAAA4AAAAGYXNzZXRzAAAAAAAQAAAAAQAAABAAAAAQAAAAAQAAAAIAAAAPAAAABU90aGVyAAAAAAAADwAAAANCVEMAAAAAEAAAAAEAAAACAAAADwAAAAVPdGhlcgAAAAAAAA8AAAADRVRIAAAAABAAAAABAAAAAgAAAA8AAAAFT3RoZXIAAAAAAAAPAAAABFVTRFQAAAAQAAAAAQAAAAIAAAAPAAAABU90aGVyAAAAAAAADwAAAANYUlAAAAAAEAAAAAEAAAACAAAADwAAAAVPdGhlcgAAAAAAAA8AAAADU09MAAAAABAAAAABAAAAAgAAAA8AAAAFT3RoZXIAAAAAAAAPAAAABFVTREMAAAAQAAAAAQAAAAIAAAAPAAAABU90aGVyAAAAAAAADwAAAANBREEAAAAAEAAAAAEAAAACAAAADwAAAAVPdGhlcgAAAAAAAA8AAAAEQVZBWAAAABAAAAABAAAAAgAAAA8AAAAFT3RoZXIAAAAAAAAPAAAAA0RPVAAAAAAQAAAAAQAAAAIAAAAPAAAABU90aGVyAAAAAAAADwAAAAVNQVRJQwAAAAAAABAAAAABAAAAAgAAAA8AAAAFT3RoZXIAAAAAAAAPAAAABExJTksAAAAQAAAAAQAAAAIAAAAPAAAABU90aGVyAAAAAAAADwAAAANEQUkAAAAAEAAAAAEAAAACAAAADwAAAAVPdGhlcgAAAAAAAA8AAAAEQVRPTQAAABAAAAABAAAAAgAAAA8AAAAFT3RoZXIAAAAAAAAPAAAAA1hMTQAAAAAQAAAAAQAAAAIAAAAPAAAABU90aGVyAAAAAAAADwAAAANVTkkAAAAAEAAAAAEAAAACAAAADwAAAAVPdGhlcgAAAAAAAA8AAAAERVVSQwAAAA4AAAAKYmFzZV9hc3NldAAAAAAAEAAAAAEAAAACAAAADwAAAAVPdGhlcgAAAAAAAA8AAAADVVNEAAAAAA4AAAAIZGVjaW1hbHMAAAADAAAADgAAAA4AAAAObGFzdF90aW1lc3RhbXAAAAAAAAUAAAGPgXPIwAAAAA4AAAAGcGVyaW9kAAAAAAAFAAAAAAUmXAAAAAAOAAAACnJlc29sdXRpb24AAAAAAAMABJPgAAAADwAAAANBREEAAAAAAwAAAAYAAAAPAAAABEFUT00AAAADAAAADAAAAA8AAAAEQVZBWAAAAAMAAAAHAAAADwAAAANCVEMAAAAAAwAAAAAAAAAPAAAAA0RBSQAAAAADAAAACwAAAA8AAAADRE9UAAAAAAMAAAAIAAAADwAAAANFVEgAAAAAAwAAAAEAAAAPAAAABEVVUkMAAAADAAAADwAAAA8AAAAETElOSwAAAAMAAAAKAAAADwAAAAVNQVRJQwAAAAAAAAMAAAAJAAAADwAAAANTT0wAAAAAAwAAAAQAAAAPAAAAA1VOSQAAAAADAAAADgAAAA8AAAAEVVNEQwAAAAMAAAAFAAAADwAAAARVU0RUAAAAAwAAAAIAAAAPAAAAA1hMTQAAAAADAAAADQAAAA8AAAADWFJQAAAAAAMAAAAD",
                "lastModifiedLedgerSeq": 1640769,
                "liveUntilLedgerSeq": 3113056
            }
        ],
        "latestLedger": 1640817
    }
}

const oracleEntriesResponse = {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
        "entries": [
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAAAkAAAGPgXPIwAAAAAAAAAAAAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABVZKjXnjFmienxhVQ9DYTcUk0HV1XyOkzjWTg8uR/8b4AAAAJAAABj4FzyMAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAABcDGLXzDz5xA==",
                "lastModifiedLedgerSeq": 1640769,
                "liveUntilLedgerSeq": 1658050
            },
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAAAkAAAGPgXPIwAAAAAAAAAABAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABVZKjXnjFmienxhVQ9DYTcUk0HV1XyOkzjWTg8uR/8b4AAAAJAAABj4FzyMAAAAAAAAAAAQAAAAAAAAAKAAAAAAAAAAAEJ3d7OPIGOg==",
                "lastModifiedLedgerSeq": 1640769,
                "liveUntilLedgerSeq": 1658050
            },
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAAAkAAAGPgXPIwAAAAAAAAAACAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABVZKjXnjFmienxhVQ9DYTcUk0HV1XyOkzjWTg8uR/8b4AAAAJAAABj4FzyMAAAAAAAAAAAgAAAAAAAAAKAAAAAAAAAAAAAFr8YgHBkA==",
                "lastModifiedLedgerSeq": 1640769,
                "liveUntilLedgerSeq": 1658050
            },
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAAAkAAAGPgXPIwAAAAAAAAAADAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABVZKjXnjFmienxhVQ9DYTcUk0HV1XyOkzjWTg8uR/8b4AAAAJAAABj4FzyMAAAAAAAAAAAwAAAAAAAAAKAAAAAAAAAAAAAC78/jxmxA==",
                "lastModifiedLedgerSeq": 1640769,
                "liveUntilLedgerSeq": 1658050
            },
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAAAkAAAGPgXPIwAAAAAAAAAAEAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABVZKjXnjFmienxhVQ9DYTcUk0HV1XyOkzjWTg8uR/8b4AAAAJAAABj4FzyMAAAAAAAAAABAAAAAAAAAAKAAAAAAAAAAAAOW236sVJ1w==",
                "lastModifiedLedgerSeq": 1640769,
                "liveUntilLedgerSeq": 1658050
            },
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAAAkAAAGPgXPIwAAAAAAAAAAFAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABVZKjXnjFmienxhVQ9DYTcUk0HV1XyOkzjWTg8uR/8b4AAAAJAAABj4FzyMAAAAAAAAAABQAAAAAAAAAKAAAAAAAAAAAAAFrwzr7JOg==",
                "lastModifiedLedgerSeq": 1640769,
                "liveUntilLedgerSeq": 1658050
            },
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAAAkAAAGPgXPIwAAAAAAAAAAGAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABVZKjXnjFmienxhVQ9DYTcUk0HV1XyOkzjWTg8uR/8b4AAAAJAAABj4FzyMAAAAAAAAAABgAAAAAAAAAKAAAAAAAAAAAAACkr/4fP+A==",
                "lastModifiedLedgerSeq": 1640769,
                "liveUntilLedgerSeq": 1658050
            },
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAAAkAAAGPgXPIwAAAAAAAAAAHAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABVZKjXnjFmienxhVQ9DYTcUk0HV1XyOkzjWTg8uR/8b4AAAAJAAABj4FzyMAAAAAAAAAABwAAAAAAAAAKAAAAAAAAAAAADCwsOk/3cQ==",
                "lastModifiedLedgerSeq": 1640769,
                "liveUntilLedgerSeq": 1658050
            },
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAAAkAAAGPgXPIwAAAAAAAAAAIAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABVZKjXnjFmienxhVQ9DYTcUk0HV1XyOkzjWTg8uR/8b4AAAAJAAABj4FzyMAAAAAAAAAACAAAAAAAAAAKAAAAAAAAAAAAAnAEEOGweA==",
                "lastModifiedLedgerSeq": 1640769,
                "liveUntilLedgerSeq": 1658050
            },
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAAAkAAAGPgXPIwAAAAAAAAAAJAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABVZKjXnjFmienxhVQ9DYTcUk0HV1XyOkzjWTg8uR/8b4AAAAJAAABj4FzyMAAAAAAAAAACQAAAAAAAAAKAAAAAAAAAAAAAD3NJMCP/w==",
                "lastModifiedLedgerSeq": 1640769,
                "liveUntilLedgerSeq": 1658050
            },
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAAAkAAAGPgXPIwAAAAAAAAAAKAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABVZKjXnjFmienxhVQ9DYTcUk0HV1XyOkzjWTg8uR/8b4AAAAJAAABj4FzyMAAAAAAAAAACgAAAAAAAAAKAAAAAAAAAAAABOPcvBKdLg==",
                "lastModifiedLedgerSeq": 1640769,
                "liveUntilLedgerSeq": 1658050
            },
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAAAkAAAGPgXPIwAAAAAAAAAALAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABVZKjXnjFmienxhVQ9DYTcUk0HV1XyOkzjWTg8uR/8b4AAAAJAAABj4FzyMAAAAAAAAAACwAAAAAAAAAKAAAAAAAAAAAAAFr246ilSw==",
                "lastModifiedLedgerSeq": 1640769,
                "liveUntilLedgerSeq": 1658050
            },
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAAAkAAAGPgXPIwAAAAAAAAAAMAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABVZKjXnjFmienxhVQ9DYTcUk0HV1XyOkzjWTg8uR/8b4AAAAJAAABj4FzyMAAAAAAAAAADAAAAAAAAAAKAAAAAAAAAAAAAvmocV+e/A==",
                "lastModifiedLedgerSeq": 1640769,
                "liveUntilLedgerSeq": 1658050
            },
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAAAkAAAGPgXPIwAAAAAAAAAANAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABVZKjXnjFmienxhVQ9DYTcUk0HV1XyOkzjWTg8uR/8b4AAAAJAAABj4FzyMAAAAAAAAAADQAAAAAAAAAKAAAAAAAAAAAAAAmrNan0nA==",
                "lastModifiedLedgerSeq": 1640769,
                "liveUntilLedgerSeq": 1658050
            },
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAAAkAAAGPgXPIwAAAAAAAAAAOAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABVZKjXnjFmienxhVQ9DYTcUk0HV1XyOkzjWTg8uR/8b4AAAAJAAABj4FzyMAAAAAAAAAADgAAAAAAAAAKAAAAAAAAAAAAApRjHoaQcQ==",
                "lastModifiedLedgerSeq": 1640769,
                "liveUntilLedgerSeq": 1658050
            },
            {
                "key": "AAAABgAAAAFVkqNeeMWaJ6fGFVD0NhNxSTQdXVfI6TONZODy5H/xvgAAAAkAAAGPgXPIwAAAAAAAAAAPAAAAAA==",
                "xdr": "AAAABgAAAAAAAAABVZKjXnjFmienxhVQ9DYTcUk0HV1XyOkzjWTg8uR/8b4AAAAJAAABj4FzyMAAAAAAAAAADwAAAAAAAAAKAAAAAAAAAAAAAGFdoJncjg==",
                "lastModifiedLedgerSeq": 1640769,
                "liveUntilLedgerSeq": 1658050
            }
        ],
        "latestLedger": 1640948
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

function isContractInstanceRequest(rawData) {
    return !xdr.LedgerKey.fromXDR(rawData, 'base64').contractData().key().value()
}

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
    const data = await getOracleContractState('CBKZFI26PDCZUJ5HYYKVB5BWCNYUSNA5LVL4R2JTRVSOB4XEP7Y34OPN', ['http://bad.rpc.com', 'http://good.rpc.com?reqData=oracle'])
    expect(data).toBeDefined()
    expect(data.admin).toBeDefined()
    expect(data.lastTimestamp).toBeGreaterThan(0n)
    expect(data.isInitialized).toBe(true)
    expect(data.prices.length).toBeGreaterThan(0)
    expect(data.hash).toBeDefined()
}, 1000000)

test('getContractData non existing data', async () => {
    const data = await getOracleContractState('CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN', ['http://good.rpc.com?reqData=none'])
    expect(data).toBeDefined()
    expect(data.admin).toBe(null)
    expect(data.lastTimestamp).toBe(0n)
    expect(data.isInitialized).toBe(false)
    expect(data.prices).toStrictEqual([])
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