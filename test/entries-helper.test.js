/*eslint-disable no-undef */
const nock = require('nock')
const {xdr, StrKey} = require('@stellar/stellar-sdk')
const {getContractState} = require('../entries-helper')

const contractDataResponse = {
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

const entriesResponse = {
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

beforeEach(() => {
    nock('http://bad.rpc.com')
        .persist()
        .post(() => true)
        .reply(503)
    nock('http://good.rpc.com')
        .persist()
        .post(() => true)
        .reply((uri, requestBody) => {
            if (requestBody.params.keys.length === 1) {
                const key = StrKey.encodeContract(xdr.LedgerKey.fromXDR(requestBody.params.keys[0], 'base64').contractData().contract().value())
                if (key === 'CBKZFI26PDCZUJ5HYYKVB5BWCNYUSNA5LVL4R2JTRVSOB4XEP7Y34OPN')
                    return [200, contractDataResponse]
                else {
                    return [200, {
                        "jsonrpc": "2.0",
                        "id": 1,
                        "result": {
                            "entries": [],
                            "latestLedger": 1641313
                        }
                    }]
                }
            } else {
                return [200, entriesResponse]
            }
        })
})


test('getContractData existing data', async () => {
    const data = await getContractState('CBKZFI26PDCZUJ5HYYKVB5BWCNYUSNA5LVL4R2JTRVSOB4XEP7Y34OPN', ['http://bad.rpc.com', 'http://good.rpc.com'])
    expect(data).toBeDefined()
}, 1000000)

test('getContractData non existing data', async () => {
    await expect(getContractState('CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN', ['http://good.rpc.com']))
        .rejects
        .toThrowError('Failed to get contract data. Check contract id and network.')
}, 1000000)