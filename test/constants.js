const ContractTypes = require('../models/configs/contract-type')

const legacyConfig = {
    "contracts": {
        "CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW": {
            "admin": "GDCOZYKHZXOJANHK3ASICJYEFGYUBSEP3YQKEXXLAGV3BBPLOFLGBAZX",
            "assets": [
                {
                    "code": "BTC",
                    "type": 2
                },
                {
                    "code": "ETH",
                    "type": 2
                }
            ],
            "baseAsset": {
                "code": "USD",
                "type": 2
            },
            "dataSource": "exchanges",
            "fee": 10000000,
            "oracleId": "CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW",
            "period": 86400000,
            "timeframe": 300000
        },
        "CBMZO5MRIBFL457FBK5FEWZ4QJTYL3XWID7QW7SWDSDOQI5H4JN7XPZU": {
            "type": ContractTypes.ORACLE,
            "admin": "GD6CN3XGN3ZGND3RSPMAOB3YCO4HXF2TD6W4OMOUL4YOPC7XGBHXPF5K",
            "assets": [
                {
                    "code": "BTCLN:GDPKQ2TSNJOFSEE7XSUXPWRP27H6GFGLWD7JCHNEYYWQVGFA543EVBVT",
                    "type": 1
                },
                {
                    "code": "AQUA:GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
                    "type": 1
                }
            ],
            "baseAsset": {
                "code": "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
                "type": 1
            },
            "dataSource": "pubnet",
            "decimals": 14,
            "fee": 10000000,
            "contractId": "CBMZO5MRIBFL457FBK5FEWZ4QJTYL3XWID7QW7SWDSDOQI5H4JN7XPZU",
            "period": 86400000,
            "timeframe": 300000
        },
        "CBFZZVW5SKMVTXKHHQKGOLLHYTOVNSYA774GCROOBMYAKEYCP4THNEXQ": {
            "type": ContractTypes.SUBSCRIPTIONS,
            "admin": "GC5GG65IUN7MLRGYXLT4GDQ4YY5TQJ5YIVVBIIKSUSFLSPTQFHRZZXHZ",
            "baseFee": 100,
            "fee": 10000000,
            "token": "CDBBDS5FN46XAVGD5IRKJIK4I7KGGSFI7R2KLXG32QQQELHPTIZS26BW",
            "contractId": "CBFZZVW5SKMVTXKHHQKGOLLHYTOVNSYA774GCROOBMYAKEYCP4THNEXQ"
        }
    },
    "minDate": 0,
    "network": "testnet",
    "nodes": {
        "GCR6ZOFMKDWX5OMUDQZHQWD2FEE4WCWQJOBMRZRQM5BVTPKJ7LL35TBF": {
            "pubkey": "GCR6ZOFMKDWX5OMUDQZHQWD2FEE4WCWQJOBMRZRQM5BVTPKJ7LL35TBF",
            "url": "ws://127.0.0.1:3000",
            "domain": "node0.com"
        },
        "GDQFOLVYRNYBTQ2WCXOANDAAM4BSZMLJUEI6CO2PMOCOVDS6SKM2AMRQ": {
            "pubkey": "GDQFOLVYRNYBTQ2WCXOANDAAM4BSZMLJUEI6CO2PMOCOVDS6SKM2AMRQ",
            "url": "ws://127.0.0.1:3001",
            "domain": "node1.com"
        },
        "GAL3OTXUY6SWY7BSS6EB43RY4EYH5LHJPKVANA6ACMLJEX7IVTJXEL26": {
            "pubkey": "GAL3OTXUY6SWY7BSS6EB43RY4EYH5LHJPKVANA6ACMLJEX7IVTJXEL26",
            "url": "ws://127.0.0.1:3002",
            "domain": "node2.com"
        }
    },
    "systemAccount": "GCEBYD3K3IYSYLK5EQEK72RVAH2AHZUYSFFG4IOXUS5AOINLMXJRMDRA",
    "wasmHash": "551723e0178208dd25c950bf78ab5618d47257a594654bbcaaf6cec8dc8c240c"
}

const mixedLegacyConfig = {
    "contracts": {
        "CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW": {
            "admin": "GDCOZYKHZXOJANHK3ASICJYEFGYUBSEP3YQKEXXLAGV3BBPLOFLGBAZX",
            "assets": [
                {
                    "code": "BTC",
                    "type": 2
                },
                {
                    "code": "ETH",
                    "type": 2
                },
                {
                    "code": "USDT",
                    "type": 2
                },
                {
                    "code": "XRP",
                    "type": 2
                },
                {
                    "code": "SOL",
                    "type": 2
                },
                {
                    "code": "USDC",
                    "type": 2
                },
                {
                    "code": "ADA",
                    "type": 2
                },
                {
                    "code": "AVAX",
                    "type": 2
                },
                {
                    "code": "DOT",
                    "type": 2
                },
                {
                    "code": "MATIC",
                    "type": 2
                },
                {
                    "code": "LINK",
                    "type": 2
                },
                {
                    "code": "DAI",
                    "type": 2
                },
                {
                    "code": "ATOM",
                    "type": 2
                },
                {
                    "code": "XLM",
                    "type": 2
                },
                {
                    "code": "UNI",
                    "type": 2
                }
            ],
            "baseAsset": {
                "code": "USD",
                "type": 2
            },
            "dataSource": "coinmarketcap",
            "decimals": 14,
            "fee": 10000000,
            "oracleId": "CAA2NN3TSWQFI6TZVLYM7B46RXBINZFRXZFP44BM2H6OHOPRXD5OASUW",
            "type": ContractTypes.ORACLE,
            "period": 86400000,
            "timeframe": 300000
        }
    },
    "minDate": 0,
    "network": "testnet",
    "nodes": {
        "GCR6ZOFMKDWX5OMUDQZHQWD2FEE4WCWQJOBMRZRQM5BVTPKJ7LL35TBF": {
            "pubkey": "GCR6ZOFMKDWX5OMUDQZHQWD2FEE4WCWQJOBMRZRQM5BVTPKJ7LL35TBF",
            "url": "ws://127.0.0.1:3000",
            "domain": "node0.com"
        },
        "GDQFOLVYRNYBTQ2WCXOANDAAM4BSZMLJUEI6CO2PMOCOVDS6SKM2AMRQ": {
            "pubkey": "GDQFOLVYRNYBTQ2WCXOANDAAM4BSZMLJUEI6CO2PMOCOVDS6SKM2AMRQ",
            "url": "ws://127.0.0.1:3001",
            "domain": "node1.com"
        }
    },
    "systemAccount": "GCEBYD3K3IYSYLK5EQEK72RVAH2AHZUYSFFG4IOXUS5AOINLMXJRMDRA",
    "wasmHash": "551723e0178208dd25c950bf78ab5618d47257a594654bbcaaf6cec8dc8c240c"
}

module.exports = {
    legacyConfig,
    mixedLegacyConfig
}