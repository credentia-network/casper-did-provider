import { DeployUtil, Signer } from "casper-js-sdk";
import { ICasperSignerAdapter } from "./casper-signer-adapter";

export class BrowserCasperSignerAdapter implements ICasperSignerAdapter {

    constructor(
        public sourcePublickKey: string,
        public targetPublickKey: string
    ) { }

    sign(deploy: any): Promise<any> {
        const json = DeployUtil.deployToJson(deploy);
        return Signer.sign(json, this.sourcePublickKey, this.targetPublickKey);
    }
}
