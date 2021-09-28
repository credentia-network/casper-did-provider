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
    constructor(providerOptions) {
        super();
        this.providerOptions = providerOptions;
        this.defaultKms = providerOptions.defaultKms;
    }
    createIdentifier({ kms }, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const keyType = 'Secp256k1';
            const key = yield context.agent.keyManagerCreate({ kms: kms || this.defaultKms, type: keyType });
            const identifier = {
                did: 'did:casper:' + this.providerOptions.network + ':' + this.providerOptions.identityKey.accountHex(),
                controllerKeyId: key.kid,
                keys: [key],
                services: [],
            };
            console.log('createIdentifier');
            console.log(identifier.did);
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
            const client = new casper_js_sdk_1.CasperClient(this.providerOptions.rpcUrl);
            const clientRpc = new casper_js_sdk_1.CasperServiceByJsonRPC(this.providerOptions.rpcUrl);
            const blockHashBase16 = '';
            const stateRootHash = yield clientRpc.getStateRootHash(blockHashBase16);
            const contractHash = yield this.getAccountNamedKeyValue(clientRpc, stateRootHash, this.providerOptions.contractKey, this.providerOptions.contract);
            if (!contractHash) {
                throw new Error(`Key '${this.providerOptions.contract}' couldn't be found.`);
            }
            const contractHashAsByteArray = Buffer.from(contractHash.slice(5), "hex");
            const name = key.kid;
            const value = (key.publicKeyHex.startsWith('0x') ? '' : '0x') + key.publicKeyHex;
            const deployMessage = casper_js_sdk_1.DeployUtil.makeDeploy(new casper_js_sdk_1.DeployUtil.DeployParams(this.providerOptions.contractKey.publicKey, this.providerOptions.network, this.providerOptions.gasPrice, this.providerOptions.ttl), casper_js_sdk_1.DeployUtil.ExecutableDeployItem.newStoredContractByHash(contractHashAsByteArray, "setAttribute", casper_js_sdk_1.RuntimeArgs.fromMap({
                identity: casper_js_sdk_1.CLValueBuilder.byteArray(this.providerOptions.identityKey.accountHash()),
                name: casper_js_sdk_1.CLValueBuilder.string(name),
                value: casper_js_sdk_1.CLValueBuilder.string(value),
                validity: casper_js_sdk_1.CLValueBuilder.u64(1337),
            })), casper_js_sdk_1.DeployUtil.standardPayment(this.providerOptions.gasPayment));
            const signedDeployMessage = client.signDeploy(deployMessage, this.providerOptions.contractKey);
            console.log("Signed deploy:");
            console.log(signedDeployMessage);
            const deployMessageResult = yield client.putDeploy(signedDeployMessage);
            console.log("Deploy result:");
            console.log(deployMessageResult);
            return { success: true };
        });
    }
    addService({ identifier, service, options }, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = new casper_js_sdk_1.CasperClient(this.providerOptions.rpcUrl);
            const clientRpc = new casper_js_sdk_1.CasperServiceByJsonRPC(this.providerOptions.rpcUrl);
            const blockHashBase16 = '';
            const stateRootHash = yield clientRpc.getStateRootHash(blockHashBase16);
            const contractHash = yield this.getAccountNamedKeyValue(clientRpc, stateRootHash, this.providerOptions.contractKey, this.providerOptions.contract);
            if (!contractHash) {
                throw new Error(`Key '${this.providerOptions.contract}' couldn't be found.`);
            }
            const contractHashAsByteArray = Buffer.from(contractHash.slice(5), "hex");
            const delegate = Buffer.from(service.id, "hex");
            const delegateType = Buffer.from(service.type, "hex");
            const deployMessage = casper_js_sdk_1.DeployUtil.makeDeploy(new casper_js_sdk_1.DeployUtil.DeployParams(this.providerOptions.contractKey.publicKey, this.providerOptions.network, this.providerOptions.gasPrice, this.providerOptions.ttl), casper_js_sdk_1.DeployUtil.ExecutableDeployItem.newStoredContractByHash(contractHashAsByteArray, "addDelegate", casper_js_sdk_1.RuntimeArgs.fromMap({
                identity: casper_js_sdk_1.CLValueBuilder.byteArray(this.providerOptions.identityKey.accountHash()),
                delegateType: casper_js_sdk_1.CLValueBuilder.byteArray(delegateType),
                delegate: casper_js_sdk_1.CLValueBuilder.byteArray(delegate),
                validity: casper_js_sdk_1.CLValueBuilder.u64(1337),
            })), casper_js_sdk_1.DeployUtil.standardPayment(this.providerOptions.gasPrice));
            const signedDeployMessage = client.signDeploy(deployMessage, this.providerOptions.contractKey);
            console.log("Signed deploy:");
            console.log(signedDeployMessage);
            const deployMessageResult = yield client.putDeploy(signedDeployMessage);
            console.log("Deploy result:");
            console.log(deployMessageResult);
            return { success: true };
        });
    }
    removeKey(args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            throw Error('IdentityProvider removeKey not implemented');
            return { success: true };
        });
    }
    removeService(args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            throw Error('IdentityProvider removeService not implemented');
            return { success: true };
        });
    }
    getAccountInfo(client, stateRootHash, keyPair) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountHash = Buffer.from(keyPair.accountHash()).toString('hex');
            const storedValue = yield client.getBlockState(stateRootHash, `account-hash-${accountHash}`, []);
            return storedValue.Account;
        });
    }
    ;
    getAccountNamedKeyValue(client, stateRootHash, keyPair, namedKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountInfo = yield this.getAccountInfo(client, stateRootHash, keyPair);
            if (!accountInfo) {
                throw new Error('IdentifierProvider.getAccountInfo returned an undefined result.');
            }
            const res = accountInfo.namedKeys.find(i => i.name === namedKey);
            return res.key;
        });
    }
}
exports.CasperDidProvider = CasperDidProvider;
//# sourceMappingURL=casper-did-provider.js.map