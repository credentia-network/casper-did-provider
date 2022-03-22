import { IAgentContext, IIdentifier, IKey, IKeyManager, IService } from "@veramo/core";
import { AbstractIdentifierProvider } from "@veramo/did-manager";
import { CasperClient, CasperServiceByJsonRPC } from "casper-js-sdk";
import { ICasperSignerAdapter } from "./casper-signer-adapter";
declare type IContext = IAgentContext<IKeyManager>;
export interface IdentifierProviderOptions {
    defaultKms: string;
    identityKeyHex: string;
    network: string;
    contract: string;
    gasPrice: number;
    gasPayment: number;
    ttl: number;
}
export declare class CasperDidProvider extends AbstractIdentifierProvider {
    private providerOptions;
    private signerAdapter;
    private client;
    private clientRpc;
    private defaultKms;
    constructor(providerOptions: IdentifierProviderOptions, signerAdapter: ICasperSignerAdapter, client: CasperClient, clientRpc: CasperServiceByJsonRPC);
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
    private buildKey;
    private readKey;
    private readAttributesLength;
    private deployKey;
    private revokeAttribute;
    private getIdentityKeyHash;
    private getIdentityKey;
}
export {};
