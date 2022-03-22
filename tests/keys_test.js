const casper_js_sdk = require("casper-js-sdk");

const identityKey = casper_js_sdk.Keys.Ed25519.parseKeyFiles(
    './network_keys/ippolit/public_key.pem',
    './network_keys/ippolit/secret_key.pem'
);

// console.log(Buffer.from(identityKey.publicKey.toAccountHash()).toString('hex'));
console.log(identityKey.publicKey.toAccountHashStr());
