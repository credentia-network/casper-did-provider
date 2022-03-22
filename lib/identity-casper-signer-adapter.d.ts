import { CasperClient } from "casper-js-sdk";
import { AsymmetricKey } from "casper-js-sdk/dist/lib/Keys";
import { ICasperSignerAdapter } from "./casper-signer-adapter";
export declare class IdentityCasperSignerAdapter implements ICasperSignerAdapter {
    identityKey: AsymmetricKey;
    client: CasperClient;
    constructor(identityKey: AsymmetricKey, client: CasperClient);
    sign(deploy: any): Promise<any>;
}
