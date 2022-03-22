import { CasperClient } from "casper-js-sdk";
import { AsymmetricKey } from "casper-js-sdk/dist/lib/Keys";
import { ICasperSignerAdapter } from "./casper-signer-adapter";

export class IdentityCasperSignerAdapter implements ICasperSignerAdapter {

    constructor(
        public identityKey: AsymmetricKey,
        public client: CasperClient
    ) { }

    sign(deploy: any): Promise<any> {
        return Promise.resolve(this.client.signDeploy(deploy, this.identityKey));
    }

}
