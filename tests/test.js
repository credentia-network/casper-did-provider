const identifier_provider = require("./../lib");
const core = require("@veramo/core");
const did_manager = require("@veramo/did-manager");
const data_store = require("@veramo/data-store");
const casper_js_sdk = require("casper-js-sdk");
const key_manager = require('@veramo/key-manager');
const kms_local = require('@veramo/kms-local');
const createConnection = require('typeorm').createConnection;

const contractKey = casper_js_sdk.Keys.Ed25519.parseKeyFiles(
    './network_keys/ippolit/IppolitWallet_public_key.pem',
    './network_keys/ippolit/IppolitWallet_secret_key.pem'
);

const identityKey = casper_js_sdk.Keys.Ed25519.parseKeyFiles(
    './network_keys/ippolit/IppolitWallet_public_key.pem',
    './network_keys/ippolit/IppolitWallet_secret_key.pem'
);

const DATABASE_FILE = 'database.sqlite';

const dbConnection = createConnection({
    type: 'sqlite',
    database: DATABASE_FILE,
    synchronize: true,
    logging: ['error', 'info', 'warn'],
    entities: data_store.Entities,
  })

const agent = core.createAgent({
    plugins: [
        new key_manager.KeyManager({
            store: new key_manager.MemoryKeyStore(),
            kms: {
                local: new kms_local.KeyManagementSystem(new key_manager.MemoryPrivateKeyStore()),
            },
        }),
        new did_manager.DIDManager({
            store: new did_manager.MemoryDIDStore(),
            defaultProvider: 'did:casper',
            providers: {
                'did:casper': new identifier_provider.CasperDidProvider({
                    contract: 'CasperDIDRegistry9',
                    contractKey,
                    identityKey,
                    rpcUrl: 'http://144.76.97.151:7777/rpc',
                    defaultKms: 'local',
                    gasPrice: 10,
                    network: 'casper-test',
                    ttl: 3600000,
                    gasPayment: 50000000000
                })
            },
        }),
    ],
});

async function main() {
    const identifier = await agent.didManagerCreate()
    console.log(`New identity created`)
    console.log(identifier);

    const value = 'abc123';

    const result = await agent.didManagerAddKey({
        did: identifier.did,
        key: { kid: 'asd', publicKeyHex: value }
    });
    console.log(result);
}

main().catch(console.log);