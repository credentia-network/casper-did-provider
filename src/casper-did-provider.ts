import { IAgentContext, IIdentifier, IKey, IKeyManager, IService } from "@veramo/core";
import { AbstractIdentifierProvider } from "@veramo/did-manager";
import { CasperClient, CasperServiceByJsonRPC, CLPublicKey, CLValueBuilder, decodeBase16, DeployUtil, Keys, RuntimeArgs } from "casper-js-sdk";
import { ICasperSignerAdapter } from "./casper-signer-adapter";

type IContext = IAgentContext<IKeyManager>;

export interface IdentifierProviderOptions {
    defaultKms: string;
    identityKeyHex: string;
    network: string;
    contract: string;
    gasPrice: number;
    gasPayment: number;
    ttl: number;
}

export class CasperDidProvider extends AbstractIdentifierProvider {
    private defaultKms: string

    constructor(
        private providerOptions: IdentifierProviderOptions,
        private signerAdapter: ICasperSignerAdapter,
        private client: CasperClient,
        private clientRpc: CasperServiceByJsonRPC
    ) {
        super()
        this.defaultKms = providerOptions.defaultKms;
    }

    async createIdentifier(
        { kms }: { kms?: string; },
        context: IContext
    ): Promise<Omit<IIdentifier, 'provider'>> {
        const keyType = 'Secp256k1'
        const key = await context.agent.keyManagerCreate({ kms: kms || this.defaultKms, type: keyType })

        const identifier: Omit<IIdentifier, 'provider'> = {
            did: 'did:casper:' + this.providerOptions.network + ':' + this.providerOptions.identityKeyHex,
            controllerKeyId: key.kid,
            keys: [key],
            services: [],
        }
        // console.log('createIdentifier');
        // console.log(identifier.did);
        return identifier
    }

    async deleteIdentifier(identifier: IIdentifier, context: IContext): Promise<boolean> {
        for (const { kid } of identifier.keys) {
            await context.agent.keyManagerDelete({ kid })
        }
        return true
    }

    async addKey(
        { identifier, key, options }: { identifier: IIdentifier; key: IKey; options?: any },
        context: IContext
    ): Promise<any> {
        const blockHashBase16 = '';
        const stateRootHash = await this.clientRpc.getStateRootHash(blockHashBase16);
        const attributeKey = `did/pub/${key.kid}`;
        const attributeValue = key.publicKeyHex;
        const expirationTimestamp = options.expire;

        await this.revokeAttribute(attributeKey, stateRootHash);

        const accountHash = this.getIdentityKeyHash(this.providerOptions.identityKeyHex);

        const runtimeArgs = RuntimeArgs.fromMap({
            identity: CLValueBuilder.byteArray(accountHash),
            attributeKey: CLValueBuilder.string(attributeKey),
            attributeValue: CLValueBuilder.string(attributeValue),
            expire: CLValueBuilder.u64(expirationTimestamp),
        })

        await this.deployKey('setAttribute', runtimeArgs);
    }

    async addService(
        { identifier, service, options }: { identifier: IIdentifier; service: IService; options?: any },
        context: IContext
    ): Promise<any> {
        const blockHashBase16 = '';
        const stateRootHash = await this.clientRpc.getStateRootHash(blockHashBase16);
        const attributeKey = `did/svc/${service.id}`;
        const attributeValue = service.serviceEndpoint;
        const expirationTimestamp = options.expire;

        await this.revokeAttribute(attributeKey, stateRootHash);

        const accountHash = this.getIdentityKeyHash(this.providerOptions.identityKeyHex);

        const runtimeArgs = RuntimeArgs.fromMap({
            identity: CLValueBuilder.byteArray(accountHash),
            attributeKey: CLValueBuilder.string(attributeKey),
            attributeValue: CLValueBuilder.string(attributeValue),
            expire: CLValueBuilder.u64(expirationTimestamp),
        })

        await this.deployKey('setAttribute', runtimeArgs);
    }

    async removeKey(args: { identifier: IIdentifier; kid: string; options?: any }, context: IContext): Promise<any> {
        const blockHashBase16 = '';
        const stateRootHash = await this.clientRpc.getStateRootHash(blockHashBase16);
        await this.revokeAttribute(`did/pub/${args.kid}`, stateRootHash);
    }

    async removeService(args: { identifier: IIdentifier; id: string; options?: any }, context: IContext): Promise<any> {
        const blockHashBase16 = '';
        const stateRootHash = await this.clientRpc.getStateRootHash(blockHashBase16);
        await this.revokeAttribute(`did/svc/${args.id}`, stateRootHash);
    }

    private buildKey(suffix?: string) {
        const key = this.getIdentityKeyHash(this.providerOptions.identityKeyHex);
        return `${Buffer.from(key).toString('hex')}${suffix || ''}`;
    }

    private async readKey<T>(key: string, clientRpc: CasperServiceByJsonRPC, stateRootHash: string): Promise<T> {
        let result = await clientRpc.getBlockState(stateRootHash, this.providerOptions.contract, [key]);
        return result?.CLValue?.data;
    }

    private async readAttributesLength(clientRpc: CasperServiceByJsonRPC, stateRootHash: string) {
        const key = this.buildKey('_attributeLength');
        try {
            let result = await this.readKey(key, clientRpc, stateRootHash);
            return +result || 0;
        } catch (e) {
            return 0;
        }
    }

    private async deployKey(entryPoint: string, runtimeArgs: RuntimeArgs) {
        const contractHashAsByteArray = Buffer.from(this.providerOptions.contract.slice(5), "hex");
        const publicKey = this.getIdentityKey(this.providerOptions.identityKeyHex);

        const deploy = DeployUtil.makeDeploy(
            new DeployUtil.DeployParams(
                CLPublicKey.fromEd25519(publicKey),
                this.providerOptions.network,
                this.providerOptions.gasPrice,
                this.providerOptions.ttl
            ),
            DeployUtil.ExecutableDeployItem.newStoredContractByHash(
                contractHashAsByteArray,
                entryPoint,
                runtimeArgs
            ),
            DeployUtil.standardPayment(this.providerOptions.gasPayment)
        );

        const signedDeploy = await this.signerAdapter.sign(deploy);
        const deployResult = await this.client.putDeploy(signedDeploy);

        console.log("Deploy result");
        console.log(deployResult);
    }

    private async revokeAttribute(attribute: string, stateRootHash: string) {
        const attributesLength = await this.readAttributesLength(this.clientRpc, stateRootHash);

        if (attributesLength) {
            const arr = new Array(attributesLength).fill(0).map((_, i) => i);

            for (const index of arr) {
                const key = this.buildKey(`_attribute_${index}`);
                const result = await this.readKey<any[]>(key, this.clientRpc, stateRootHash);

                const [name] = result.map(t => t.data.toString());
                if ((name || '').toLowerCase() == attribute) {
                    const runtimeArgs = RuntimeArgs.fromMap({
                        identity: CLValueBuilder.byteArray(this.getIdentityKeyHash(this.providerOptions.identityKeyHex)),
                        index: CLValueBuilder.u64(index),
                    })
                    await this.deployKey('revokeAttribute', runtimeArgs);
                }
            }
        }
    }

    private getIdentityKeyHash(identityKeyHex: string): Uint8Array {
        if (identityKeyHex.length > 64) {
            const algorithm = +identityKeyHex.substr(0, 2);
            const arr = decodeBase16(identityKeyHex.substr(2));
            return algorithm == 2 ? Keys.Secp256K1.accountHash(arr) : Keys.Ed25519.accountHash(arr);
        }
        return Keys.Ed25519.accountHash(decodeBase16(identityKeyHex));
    }

    private getIdentityKey(identityKeyHex: string): Uint8Array {
        if (identityKeyHex.length > 64) {
            return decodeBase16(identityKeyHex.substr(2));
        }
        return decodeBase16(identityKeyHex);
    }
}
