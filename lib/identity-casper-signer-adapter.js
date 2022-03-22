"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityCasperSignerAdapter = void 0;
class IdentityCasperSignerAdapter {
    constructor(identityKey, client) {
        this.identityKey = identityKey;
        this.client = client;
    }
    sign(deploy) {
        return Promise.resolve(this.client.signDeploy(deploy, this.identityKey));
    }
}
exports.IdentityCasperSignerAdapter = IdentityCasperSignerAdapter;
//# sourceMappingURL=identity-casper-signer-adapter.js.map