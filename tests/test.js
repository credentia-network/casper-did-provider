const identifier_provider = require("./../lib");
const core = require("@veramo/core");
const did_manager = require("@veramo/did-manager");
const data_store = require("@veramo/data-store");
const casper_js_sdk = require("casper-js-sdk");
const key_manager = require('@veramo/key-manager');
const kms_local = require('@veramo/kms-local');
const createConnection = require('typeorm').createConnection;
const { CasperClient, CasperServiceByJsonRPC } = require("casper-js-sdk");
const credentialW3c = require("@veramo/credential-w3c");


const identityKey = casper_js_sdk.Keys.Ed25519.parseKeyFiles(
    './network_keys/trent/public_key.pem',
    './network_keys/trent/secret_key.pem'
);

const CONTRACT_DID_HASH = "hash-2fe97b396d1e362c8fd796eab6f6d57814476ed199a5daab0b7afa5023a84429";

// const DATABASE_FILE = 'database.sqlite';

// const dbConnection = createConnection({
//     type: 'sqlite',
//     database: DATABASE_FILE,
//     synchronize: true,
//     logging: ['error', 'info', 'warn'],
//     entities: data_store.Entities,
//   })

const RPC_URL = 'http://159.65.118.250:7777/rpc';

const client = new CasperClient(RPC_URL);
const clientRpc = new CasperServiceByJsonRPC(RPC_URL);
const identityCasperSignerAdapter = new identifier_provider.IdentityCasperSignerAdapter(identityKey, client);

const agent = core.createAgent({
    plugins: [
        new credentialW3c.CredentialIssuer(),
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
                    contract: CONTRACT_DID_HASH,
                    identityKeyHex: identityKey.accountHex(),
                    defaultKms: 'local',
                    gasPrice: 10,
                    network: 'casper-test',
                    ttl: 3600000,
                    gasPayment: 50000000000
                }, 
                identityCasperSignerAdapter, client, clientRpc)
            },
        }),
    ],
});

async function main() {
    const identifier = await agent.didManagerCreate()
    console.log(`New identity created`)
    console.log(identifier);

    const value = '018b8da6eb66f36c2e4c968ea4aeaa5d9b08da7d9aba41c9b6e43d41bb18fd880e';
    // const key = 'did:casper:casper-test:013112068231a00e12e79b477888ae1f3b2dca40d6e2de17de4174534bc3a5143b';
    const key = 'Ed25519/veriKey/address';

    // const result = await agent.didManagerAddKey({
    //     did: identifier.did,
    //     key: { kid: key, publicKeyHex: value },
    //     options: {
    //         expire: new Date('2021-12-01').valueOf()
    //     }
    // });
    // console.log(result);

    console.log('Creare VC');
    const jsonLd = getJsonLd({some_key: 'some data'}, identifier.did);

    agent.createVerifiableCredential({ credential: jsonLd, proofFormat: 'jwt' })
        .then(t => console.log(t));
}

function getJsonLd(data, accountDid) {
    return {
        "@context": [
            "https://www.w3.org/2018/credentials/v1"
        ],
        type: [
            "VerifiableCredential"
        ],
        issuer: {
            id: accountDid //`did:casper:${NETWORK}`
        },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
            // "id": accountDid,
            ...data
        }
        // "proof": {
        //     "type": "RsaSignature2018",
        //     "created": "2017-06-18T21:19:10Z",
        //     "proofPurpose": "assertionMethod",
        //     "verificationMethod": "https://example.edu/issuers/keys/1",
        //     "jws": "eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..TCYt5XsITJX1CxPCT8yAV-TVkIEq_PbChOMqsLfRoPsnsgw5WEuts01mq-pQy7UJiN5mgRxD-WUcX16dUEMGlv50aqzpqh4Qktb3rk- BuQy72IFLOqV0G_zS245 - kronKb78cPN25DGlcTwLtjPAYuNzVBAh4vGHSrQyHUdBBPM"
        // }
    };
}

main().catch(console.log);