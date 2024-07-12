/*eslint-disable no-undef */
const nock = require('nock')
const {xdr, StrKey} = require('@stellar/stellar-sdk')
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
                "key": "AAAABgAAAAGZYdVm/xzsK5FZPyKyEs22eeu340r88xFTQSQZaIDQwwAAABQAAAAB",
                "xdr": "AAAABgAAAAAAAAABmWHVZv8c7CuRWT8ishLNtnnrt+NK/PMRU0EkGWiA0MMAAAAUAAAAAQAAABMAAAAAx4MH2QtPGM+YfwgF06oyel8SYBt9+wcgvydzPGaDcLUAAAABAAAABAAAAA4AAAAFYWRtaW4AAAAAAAASAAAAAAAAAAAxNtZY6JYz7w65jwknuCQtV2yBh6yaMARB5wUiOs9eXQAAAA4AAAAIYmFzZV9mZWUAAAAFAAAAAAAAADIAAAAOAAAAFGxhc3Rfc3Vic2NyaXB0aW9uX2lkAAAABQAAAAAAAAABAAAADgAAAAV0b2tlbgAAAAAAABIAAAABSF/vaJrBLVRJsPsGT1EWBsDfhWod97UUYk+vS0vGv+k=",
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
                "key": "AAAABgAAAAGZYdVm/xzsK5FZPyKyEs22eeu340r88xFTQSQZaIDQwwAAAAUAAAAAAAAAAQAAAAE=",
                "xdr": "AAAABgAAAAAAAAABmWHVZv8c7CuRWT8ishLNtnnrt+NK/PMRU0EkGWiA0MMAAAAFAAAAAAAAAAEAAAABAAAAEQAAAAEAAAAJAAAADwAAAAZhc3NldDEAAAAAABEAAAABAAAAAgAAAA8AAAAFYXNzZXQAAAAAAAAQAAAAAQAAAAIAAAAPAAAABU90aGVyAAAAAAAADwAAAANCVEMAAAAADwAAAAZzb3VyY2UAAAAAAA4AAAA4Q0QyMkczSTJWNVBINkVGUldXM0kzSEtGUEFRSTNUUkNIMzRRRlI2SEpUQVlNRkdKTlZOUFBFV0QAAAAPAAAABmFzc2V0MgAAAAAAEQAAAAEAAAACAAAADwAAAAVhc3NldAAAAAAAABAAAAABAAAAAgAAAA8AAAAHU3RlbGxhcgAAAAASAAAAAfWjbRqvXn8QsbW2jZ1FeCCNziI++QLHx0zBhhTJbVr3AAAADwAAAAZzb3VyY2UAAAAAAA4AAAA4Q0QyMkczSTJWNVBINkVGUldXM0kzSEtGUEFRSTNUUkNIMzRRRlI2SEpUQVlNRkdKTlZOUFBFV0QAAAAPAAAAB2JhbGFuY2UAAAAABQAAAAAAAAQaAAAADwAAAAloZWFydGJlYXQAAAAAAAADAAAAPAAAAA8AAAALbGFzdF9jaGFyZ2UAAAAABQAAAZCiFqNYAAAADwAAAAVvd25lcgAAAAAAABIAAAAAAAAAAEMVGxSi4r9jermWgjz13nQJASQ5lGkYKfo8kg4Jrv2JAAAADwAAAAZzdGF0dXMAAAAAAAMAAAAAAAAADwAAAAl0aHJlc2hvbGQAAAAAAAADAAAAAgAAAA8AAAAHd2ViaG9vawAAAAANAAAEAC8TWYTjmao2k4hTgns6u+dxizZrLV/81y0ZxLgg9cU2CNQhBc8BDEze1M8O2QMQlGojZCn95wdbXUVMm5T1csNIPnDO6IP2ZELdtWMIeNCz3GnEpk3f/sKzueGpzPifjkJFDoO3gwJcGd5ufymceNHLlM2hlblyA/KEhsvs5E9cURcCnGoTwCwq75aQStQRww4SgiiklrcAkyDLDlgPOg599piGZrfqKN5VDP+rI0tttm6XNEgjH8g2kNmLP6i74VMFfQkDFXu8m/eX1tOHfTvf+dO2F4KqLNokLByI9UhZiPaztbM79lhRxUK4Hc50uLAGpnPwySWtUJ+DfMGzlbA5Hkw+EpqLLO4HlsrtiR37LEGGlPIDpqgvRliLUKCFEk0orHrMm5WKqGAflmvo4PupQLe9/REog0fKNSvYQtUwheZqb3gEZup73VXIYU9zH0juaz6PI98cBqO16bJtVHFN3md8jWgEx3ZqIlIK6sA1wf0NRjt+1R+y2re4rlfmNLReVuCaUcZDbtokIR7U0q0OEix5fjOl/8kp3urhUhFvYVCqig2rYcI8ONRndq9m11IkDk9Q141J05lxUvq4FL1V25GycFE1tmbT+tSUMFTq2V0gShxdUZTFVKUvyde6h5978/a58fa1tqoyFCy4KJlG32fQ7VgqW/I77Ie8+oGmkXBw+bqjkmk9clBPYNGEO+bv7+2wJ0vmNKQ22eu0meAywKVmCzKYiRobFTSWtHSjdczzAgoL9GElC2uA3ig6FTyWZ+g8AzeA38yMGFRce8rMACkByA5j0CNLiwKgDNNE1HPpN1qbnuUL7D2eawEZxoxUFL0eVMbx5MLqLyIVRkVcz/f60Ae1Ojmu0iBac4Xnyhope831PhKSa9gxz9tTkcN33eXYWlmhIzHChkhZTZXKpfSTI8YkO5a2ox8ZfqdO4QIFNPyAAd5wucYgnWr+olTtGrNrSaSdDlW5mYFZZ9xmglbPTVA6pj/jQIKLnnW0VQkkNlBnb39dujyvDFoo2Qc/hze7PzwKLB4onA9nsNHTIAbQMGz1llG8X6I+xHjTAf+jyIP0OvltVndp8XJHKozuXy0ChlTvefYAR2oeSMEa4YPx+5oOT7vHLLUUWUoF+AUMs+H4u1gO+PjSoZTg+4TixlK9RyK/+SH3jWDHto5zbXEk1ogBqz4LxXQ+9r1e9Lw7se+8/KAAA43qWe/r8pDnGtG8STrLouB3+dL9EyJrP3UPN2oqw5UG6qQZEhsH0K600Tq5YAjO/hCkj8f0ZFEODXk44QE/xVqAiBydrsaDTCuLqJeAWwrjJHZpCY6dPiLRq2VRZhUknfYgUL0rXaCsHujYLJTAw477f/H9WTs=",
                "lastModifiedLedgerSeq": 487881,
                "liveUntilLedgerSeq": 2561478
            }
        ],
        "latestLedger": 488545
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

    const contractId = 'CCMWDVLG74OOYK4RLE7SFMQSZW3HT25X4NFPZ4YRKNASIGLIQDIMHMOL'

    const {lastSubscriptionId} = await getSubscriptionsContractState(contractId, ['http://good.rpc.com?reqData=subs'])

    const data = await getSubscriptions(contractId, ['http://good.rpc.com?reqData=subs'], lastSubscriptionId)
    expect(data).toBeDefined()
    expect(data.length).toBe(1)
    expect(data[0].id).toBe(lastSubscriptionId)
}, 1000000)