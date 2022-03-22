"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CasperDidProvider = void 0;
const did_manager_1 = require("@veramo/did-manager");
const casper_js_sdk_1 = require("casper-js-sdk");
class CasperDidProvider extends did_manager_1.AbstractIdentifierProvider {
    constructor(providerOptions, signerAdapter, client, clientRpc) {
        super();
        this.providerOptions = providerOptions;
        this.signerAdapter = signerAdapter;
        this.client = client;
        this.clientRpc = clientRpc;
        this.defaultKms = providerOptions.defaultKms;
    }
    createIdentifier({ kms }, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const keyType = 'Secp256k1';
            const key = yield context.agent.keyManagerCreate({ kms: kms || this.defaultKms, type: keyType });
            const identifier = {
                did: 'did:casper:' + this.providerOptions.network + ':' + this.providerOptions.identityKeyHex,
                controllerKeyId: key.kid,
                keys: [key],
                services: [],
            };
            // console.log('createIdentifier');
            // console.log(identifier.did);
            return identifier;
        });
    }
    deleteIdentifier(identifier, context) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const { kid } of identifier.keys) {
                yield context.agent.keyManagerDelete({ kid });
            }
            return true;
        });
    }
    addKey({ identifier, key, options }, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const blockHashBase16 = '';
            const stateRootHash = yield this.clientRpc.getStateRootHash(blockHashBase16);
            const attributeKey = `did/pub/${key.kid}`;
            const attributeValue = key.publicKeyHex;
            const expirationTimestamp = options.expire;
            yield this.revokeAttribute(attributeKey, stateRootHash);
            const accountHash = this.getIdentityKeyHash(this.providerOptions.identityKeyHex);
            const runtimeArgs = casper_js_sdk_1.RuntimeArgs.fromMap({
                identity: casper_js_sdk_1.CLValueBuilder.byteArray(accountHash),
                attributeKey: casper_js_sdk_1.CLValueBuilder.string(attributeKey),
                attributeValue: casper_js_sdk_1.CLValueBuilder.string(attributeValue),
                expire: casper_js_sdk_1.CLValueBuilder.u64(expirationTimestamp),
            });
            yield this.deployKey('setAttribute', runtimeArgs);
        });
    }
    addService({ identifier, service, options }, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const blockHashBase16 = '';
            const stateRootHash = yield this.clientRpc.getStateRootHash(blockHashBase16);
            const attributeKey = `did/svc/${service.id}`;
            const attributeValue = service.serviceEndpoint;
            const expirationTimestamp = options.expire;
            yield this.revokeAttribute(attributeKey, stateRootHash);
            const accountHash = this.getIdentityKeyHash(this.providerOptions.identityKeyHex);
            const runtimeArgs = casper_js_sdk_1.RuntimeArgs.fromMap({
                identity: casper_js_sdk_1.CLValueBuilder.byteArray(accountHash),
                attributeKey: casper_js_sdk_1.CLValueBuilder.string(attributeKey),
                attributeValue: casper_js_sdk_1.CLValueBuilder.string(attributeValue),
                expire: casper_js_sdk_1.CLValueBuilder.u64(expirationTimestamp),
            });
            yield this.deployKey('setAttribute', runtimeArgs);
        });
    }
    removeKey(args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const blockHashBase16 = '';
            const stateRootHash = yield this.clientRpc.getStateRootHash(blockHashBase16);
            yield this.revokeAttribute(`did/pub/${args.kid}`, stateRootHash);
        });
    }
    removeService(args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const blockHashBase16 = '';
            const stateRootHash = yield this.clientRpc.getStateRootHash(blockHashBase16);
            yield this.revokeAttribute(`did/svc/${args.id}`, stateRootHash);
        });
    }
    buildKey(suffix) {
        const key = this.getIdentityKeyHash(this.providerOptions.identityKeyHex);
        return `${Buffer.from(key).toString('hex')}${suffix || ''}`;
    }
    readKey(key, clientRpc, stateRootHash) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield clientRpc.getBlockState(stateRootHash, this.providerOptions.contract, [key]);
            return (_a = result === null || result === void 0 ? void 0 : result.CLValue) === null || _a === void 0 ? void 0 : _a.data;
        });
    }
    readAttributesLength(clientRpc, stateRootHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = this.buildKey('_attributeLength');
            try {
                let result = yield this.readKey(key, clientRpc, stateRootHash);
                return +result || 0;
            }
            catch (e) {
                return 0;
            }
        });
    }
    deployKey(entryPoint, runtimeArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            const contractHashAsByteArray = Buffer.from(this.providerOptions.contract.slice(5), "hex");
            const publicKey = this.getIdentityKey(this.providerOptions.identityKeyHex);
            const deploy = casper_js_sdk_1.DeployUtil.makeDeploy(new casper_js_sdk_1.DeployUtil.DeployParams(casper_js_sdk_1.CLPublicKey.fromEd25519(publicKey), this.providerOptions.network, this.providerOptions.gasPrice, this.providerOptions.ttl), casper_js_sdk_1.DeployUtil.ExecutableDeployItem.newStoredContractByHash(contractHashAsByteArray, entryPoint, runtimeArgs), casper_js_sdk_1.DeployUtil.standardPayment(this.providerOptions.gasPayment));
            const signedDeploy = yield this.signerAdapter.sign(deploy);
            const deployResult = yield this.client.putDeploy(signedDeploy);
            console.log("Deploy result");
            console.log(deployResult);
        });
    }
    revokeAttribute(attribute, stateRootHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const attributesLength = yield this.readAttributesLength(this.clientRpc, stateRootHash);
            if (attributesLength) {
                const arr = new Array(attributesLength).fill(0).map((_, i) => i);
                for (const index of arr) {
                    const key = this.buildKey(`_attribute_${index}`);
                    const result = yield this.readKey(key, this.clientRpc, stateRootHash);
                    const [name] = result.map(t => t.data.toString());
                    if ((name || '').toLowerCase() == attribute) {
                        const runtimeArgs = casper_js_sdk_1.RuntimeArgs.fromMap({
                            identity: casper_js_sdk_1.CLValueBuilder.byteArray(this.getIdentityKeyHash(this.providerOptions.identityKeyHex)),
                            index: casper_js_sdk_1.CLValueBuilder.u64(index),
                        });
                        yield this.deployKey('revokeAttribute', runtimeArgs);
                    }
                }
            }
        });
    }
    getIdentityKeyHash(identityKeyHex) {
        if (identityKeyHex.length > 64) {
            const algorithm = +identityKeyHex.substr(0, 2);
            const arr = (0, casper_js_sdk_1.decodeBase16)(identityKeyHex.substr(2));
            return algorithm == 2 ? casper_js_sdk_1.Keys.Secp256K1.accountHash(arr) : casper_js_sdk_1.Keys.Ed25519.accountHash(arr);
        }
        return casper_js_sdk_1.Keys.Ed25519.accountHash((0, casper_js_sdk_1.decodeBase16)(identityKeyHex));
    }
    getIdentityKey(identityKeyHex) {
        if (identityKeyHex.length > 64) {
            return (0, casper_js_sdk_1.decodeBase16)(identityKeyHex.substr(2));
        }
        return (0, casper_js_sdk_1.decodeBase16)(identityKeyHex);
    }
}
exports.CasperDidProvider = CasperDidProvider;
//# sourceMappingURL=casper-did-provider.js.map