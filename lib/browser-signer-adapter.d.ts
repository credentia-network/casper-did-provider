import { ICasperSignerAdapter } from "./casper-signer-adapter";
export declare class BrowserCasperSignerAdapter implements ICasperSignerAdapter {
    sourcePublickKey: string;
    targetPublickKey: string;
    constructor(sourcePublickKey: string, targetPublickKey: string);
    sign(deploy: any): Promise<any>;
}
