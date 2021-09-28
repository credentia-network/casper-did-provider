import { IAgentContext, IIdentifier, IKey, IKeyManager, IService } from "@veramo/core";
import { AbstractIdentifierProvider } from "@veramo/did-manager";
import { CasperClient, CasperServiceByJsonRPC, CLValueBuilder, DeployUtil, RuntimeArgs } from "casper-js-sdk";
import { AsymmetricKey } from "casper-js-sdk/dist/lib/Keys";

type IContext = IAgentContext<IKeyManager>;

export interface IdentifierProviderOptions {
    defaultKms: string;
    identityKey: AsymmetricKey;
    rpcUrl: string;
    network: string;
    contractKey: AsymmetricKey;
    contract: string;
    gasPrice: number;
    gasPayment: number;
    ttl: number;
}

export class CasperDidProvider extends AbstractIdentifierProvider {
    private defaultKms: string

    constructor(private providerOptions: IdentifierProviderOptions) {
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
            did: 'did:casper:' + this.providerOptions.network + ':' + this.providerOptions.identityKey.accountHex(),
            controllerKeyId: key.kid,
            keys: [key],
            services: [],
        }
        console.log('createIdentifier');
        console.log(identifier.did);
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
        const client = new CasperClient(this.providerOptions.rpcUrl);
        const clientRpc = new CasperServiceByJsonRPC(this.providerOptions.rpcUrl);
        const blockHashBase16 = '';
        const stateRootHash = await clientRpc.getStateRootHash(blockHashBase16);
        const contractHash = await this.getAccountNamedKeyValue(clientRpc, stateRootHash, this.providerOptions.contractKey, this.providerOptions.contract);
        if (!contractHash) {
            throw new Error(`Key '${this.providerOptions.contract}' couldn't be found.`);
        }
        const contractHashAsByteArray = Buffer.from(contractHash.slice(5), "hex");

        const name = key.kid;
        const value = (key.publicKeyHex.startsWith('0x') ? '' : '0x') + key.publicKeyHex;

        const deployMessage = DeployUtil.makeDeploy(
            new DeployUtil.DeployParams(
                this.providerOptions.contractKey.publicKey,
                this.providerOptions.network,
                this.providerOptions.gasPrice,
                this.providerOptions.ttl
            ),
            DeployUtil.ExecutableDeployItem.newStoredContractByHash(
                contractHashAsByteArray,
                "setAttribute",
                RuntimeArgs.fromMap({
                    identity: CLValueBuilder.byteArray(this.providerOptions.identityKey.accountHash()),
                    name: CLValueBuilder.string(name),
                    value: CLValueBuilder.string(value),
                    validity: CLValueBuilder.u64(1337),
                })
            ),
            DeployUtil.standardPayment(this.providerOptions.gasPayment)
        );

        const signedDeployMessage = client.signDeploy(deployMessage, this.providerOptions.contractKey);
        console.log("Signed deploy:");
        console.log(signedDeployMessage);

        const deployMessageResult = await client.putDeploy(signedDeployMessage);
        console.log("Deploy result:");
        console.log(deployMessageResult);

        return { success: true }
    }

    async addService(
        { identifier, service, options }: { identifier: IIdentifier; service: IService; options?: any },
        context: IContext
    ): Promise<any> {
        const client = new CasperClient(this.providerOptions.rpcUrl);
        const clientRpc = new CasperServiceByJsonRPC(this.providerOptions.rpcUrl);
        const blockHashBase16 = '';
        const stateRootHash = await clientRpc.getStateRootHash(blockHashBase16);
        const contractHash = await this.getAccountNamedKeyValue(clientRpc, stateRootHash, this.providerOptions.contractKey, this.providerOptions.contract);
        if (!contractHash) {
            throw new Error(`Key '${this.providerOptions.contract}' couldn't be found.`);
        }
        const contractHashAsByteArray = Buffer.from(contractHash.slice(5), "hex");

        const delegate = Buffer.from(service.id, "hex");
        const delegateType = Buffer.from(service.type, "hex");

        const deployMessage = DeployUtil.makeDeploy(
            new DeployUtil.DeployParams(
                this.providerOptions.contractKey.publicKey,
                this.providerOptions.network,
                this.providerOptions.gasPrice,
                this.providerOptions.ttl
            ),
            DeployUtil.ExecutableDeployItem.newStoredContractByHash(
                contractHashAsByteArray,
                "addDelegate",
                RuntimeArgs.fromMap({
                    identity: CLValueBuilder.byteArray(this.providerOptions.identityKey.accountHash()),
                    delegateType: CLValueBuilder.byteArray(delegateType),
                    delegate: CLValueBuilder.byteArray(delegate),
                    validity: CLValueBuilder.u64(1337),
                })
            ),
            DeployUtil.standardPayment(this.providerOptions.gasPrice)
        );

        const signedDeployMessage = client.signDeploy(deployMessage, this.providerOptions.contractKey);
        console.log("Signed deploy:");
        console.log(signedDeployMessage);

        const deployMessageResult = await client.putDeploy(signedDeployMessage);
        console.log("Deploy result:");
        console.log(deployMessageResult);

        return { success: true }
    }

    async removeKey(args: { identifier: IIdentifier; kid: string; options?: any }, context: IContext): Promise<any> {
        throw Error('IdentityProvider removeKey not implemented')
        return { success: true }
    }

    async removeService(args: { identifier: IIdentifier; id: string; options?: any }, context: IContext): Promise<any> {
        throw Error('IdentityProvider removeService not implemented')
        return { success: true }
    }

    private async getAccountInfo(client: CasperServiceByJsonRPC, stateRootHash: string, keyPair: AsymmetricKey) {
        const accountHash = Buffer.from(keyPair.accountHash()).toString('hex');
        const storedValue = await client.getBlockState(
            stateRootHash,
            `account-hash-${accountHash}`,
            []
        )
        return storedValue.Account;
    };

    private async getAccountNamedKeyValue(client: CasperServiceByJsonRPC, stateRootHash: string, keyPair: AsymmetricKey, namedKey: string) {
        const accountInfo = await this.getAccountInfo(client, stateRootHash, keyPair);
        if (!accountInfo) {
            throw new Error('IdentifierProvider.getAccountInfo returned an undefined result.');
        }
        const res = accountInfo.namedKeys.find(i => i.name === namedKey);
        return res!.key;
    }
}
