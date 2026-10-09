# @reflector/reflector-shared

Code every Reflector component runs the same way: the cluster config models and their validation, the canonical
serialisation and hashing, the submit schedule of every transaction round (`utils/update-schedule.js`), the
transaction builders for the oracle, subscriptions and DAO contracts, the ledger reads behind them, and the contract
clients those builders use (`client/`, formerly the oracle-client package).

Peer dependency: `@stellar/stellar-sdk >= 17`. Node >= 22.12.

## Contract clients

`OracleClient`, `SubscriptionsClient` and `DAOClient` (exported from the package root) build one Soroban transaction
per contract call from a simulation; they do not sign or submit. Every call goes through `buildTransaction(client,
source, operation, options)` in `client/transaction-builder.js`:

- `options.fee` is the classic per-operation fee; the Soroban resource fee is added on top.
- The simulation is requested from each url in `client.sorobanRpcUrl` in turn, once, with a 15 s deadline per request,
  starting with the url that answered last. When every url fails the error is `Failed to make request.`, with one
  error per url tried in `error.cause`.
- When the host ran the transaction and refused it (the rpc's error string starts with `HostError`: a contract error,
  an exhausted budget), the thrown error's message is that string unchanged and its `code` is `SIMULATION_REJECTED`
  (`simulationRejectedCode`). Asking again gets the same answer; a reflector-node treats it as final for the attempt.
  Any other error the rpc reports in the simulation response (`preflight queue full`, a failed ledger read) keeps its
  message and carries no code: asking again may succeed.
- Simulated resources are rounded upward onto a fixed grid before they are signed: instructions in steps of
  10 000 000 (capped at 100 000 000), disk-read and write bytes in steps of 8192 (capped at 204 800 and 132 096), the
  resource fee in steps of 1 000 000 stroops with a floor of 10 000 000. Below the caps and above the fee floor, each
  value gets at least one and less than two steps of slack. Nodes simulate independently, so this keeps their
  transactions identical unless a grid edge falls between two nodes' simulated values. The caps are the public
  network's per-transaction limits (`txMaxInstructions`, `txMaxDiskReadBytes`, `txMaxWriteBytes`) and must follow any
  network configuration change.
- When the simulation returns a restore preamble, the result is a footprint-restore transaction, rounded the same
  way, with a non-enumerable `isRestore === true`. Check it before treating the transaction as the requested update.
- `options.simulationOnly` returns the parsed simulation response instead of a transaction.

## RPC requests

`helpers/rpc-helper.js` gives every request a 15 s deadline on the http client and keeps, per configured url list,
the url that answered last. The ledger reads (`helpers/entries-helper.js`) and the simulations share that preference,
so a fail-over one of them found applies to the other. A preference expires ten minutes after it was set, so the
configured order, primary first, is tried again; at most 16 url lists are remembered. Ledger reads make up to three
passes over the urls, 300 ms apart, and then fail with `Failed to invoke RPC method on all provided URLs`.

## Tests

- `npm test`: the offline suites. `test/helpers/pinned-transactions.test.js` pins the hash of one transaction of every
  kind the package builds; a change to any of them is a change to what nodes sign.
- `npm run test:integration`: the live suites under `test/client-integration`. They deploy contracts with the
  `stellar` CLI against the rpc and friendbot named in each `example.contract.config.json`, and need the contract
  `.wasm` files next to each suite (not in git).
