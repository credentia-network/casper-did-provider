# casper-did-provider
This project implements Casper DID Provider for [Veramo](https://veramo.io/)

Initial project structure is derived from [Veramo did-provider-ethr](https://github.com/uport-project/veramo/tree/next/packages/did-provider-ethr)
## How to use

Add the following lines into dependencies section of the package.json

```json
  "dependencies": {
    ...................
    "casper-did-provider": "git+https://github.com//credentia-network/casper-did-provider.git",
    "casper-did-resolver": "git+https://github.com/credentia-network/casper-did-resolver.git",
    "casper-js-sdk": "1.4.3",
    ...................
  },
```
For Veramo basics please follow the documentation and samples [here](https://veramo.io/docs/basics/introduction)

### Using Casper DID Provider with React

Please use the following code snippet to configure Casper DID Provider within the createAgent function from `@veramo/core`

```ts
const PUBLIC_KEY = Keys.Ed25519.readBase64WithPEM('MCowBQYDK2VwAyEANUSxkqzpKbbhYVMo0bP3nVe+gen4jFp06Ki5u6cIATk=');
const PRIVATE_KEY = Keys.Ed25519.readBase64WithPEM('MC4CAQAwBQYDK2VwBCIEIAdjynMSLimFalVdB51TI6wGlwQKaI8PwdsG55t2qMZM');
const RPC_URL = '<CASPER_NODE_RPC_URL>';
const CONTRACT = 'CasperDIDRegistry9';

const contractKey = Keys.Ed25519.parseKeyPair(PUBLIC_KEY, PRIVATE_KEY);
const identityKey = Keys.Ed25519.parseKeyPair(PUBLIC_KEY, PRIVATE_KEY);

this.agent = createAgent({
            plugins: [
                new KeyManager({
                    store: new MemoryKeyStore(),
                    kms: {
                        local: new KeyManagementSystem(new MemoryPrivateKeyStore()),
                    },
                }),
                new DIDManager({
                    store: new MemoryDIDStore(),
                    defaultProvider: 'did:casper',
                    providers: {
                        'did:casper': new CasperDidProvider({
                            contract: CONTRACT,
                            contractKey,
                            identityKey,
                            rpcUrl: RPC_URL,
                            defaultKms: 'local',
                            gasPrice: 10,
                            network: 'casper-test',
                            ttl: 3600000,
                            gasPayment: 50000000000
                        })
                    },
                }),
                new DIDResolverPlugin({
                    resolver: new CasperDidResolver({
                        contract: CONTRACT,
                        contractKey,
                        identityKey,
                        rpcUrl: RPC_URL
                    }),
                }),
            ],
        });
```

Casper public blockchain nodes RPC can be found here:
 - For Testnet: [https://testnet.cspr.live/tools/peers](https://testnet.cspr.live/tools/peers)
 - For Mainnet: [https://cspr.live/tools/peers](https://cspr.live/tools/peers)
