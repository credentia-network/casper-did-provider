"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserCasperSignerAdapter = void 0;
const casper_js_sdk_1 = require("casper-js-sdk");
class BrowserCasperSignerAdapter {
    constructor(sourcePublickKey, targetPublickKey) {
        this.sourcePublickKey = sourcePublickKey;
        this.targetPublickKey = targetPublickKey;
    }
    sign(deploy) {
        const json = casper_js_sdk_1.DeployUtil.deployToJson(deploy);
        return casper_js_sdk_1.Signer.sign(json, this.sourcePublickKey, this.targetPublickKey);
    }
}
exports.BrowserCasperSignerAdapter = BrowserCasperSignerAdapter;
//# sourceMappingURL=browser-signer-adapter.js.map