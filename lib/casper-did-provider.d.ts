import { IAgentContext, IIdentifier, IKey, IKeyManager, IService } from "@veramo/core";
import { AbstractIdentifierProvider } from "@veramo/did-manager";
import { AsymmetricKey } from "casper-js-sdk/dist/lib/Keys";
declare type IContext = IAgentContext<IKeyManager>;
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
export declare class CasperDidProvider extends AbstractIdentifierProvider {
    private providerOptions;
    private defaultKms;
    constructor(providerOptions: IdentifierProviderOptions);
    createIdentifier({ kms }: {
        kms?: string;
    }, context: IContext): Promise<Omit<IIdentifier, 'provider'>>;
    deleteIdentifier(identifier: IIdentifier, context: IContext): Promise<boolean>;
    addKey({ identifier, key, options }: {
        identifier: IIdentifier;
        key: IKey;
        options?: any;
    }, context: IContext): Promise<any>;
    addService({ identifier, service, options }: {
        identifier: IIdentifier;
        service: IService;
        options?: any;
    }, context: IContext): Promise<any>;
    removeKey(args: {
        identifier: IIdentifier;
        kid: string;
        options?: any;
    }, context: IContext): Promise<any>;
    removeService(args: {
        identifier: IIdentifier;
        id: string;
        options?: any;
    }, context: IContext): Promise<any>;
    private getAccountInfo;
    private getAccountNamedKeyValue;
}
export {};
