"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptColumn = void 0;
exports.setEncryptionInstance = setEncryptionInstance;
let service;
function setEncryptionInstance(svc) {
    service = svc;
}
const ENCRYPTED_RE = /^[0-9a-f]+:[0-9a-f]+:/;
function isEncrypted(value) {
    return ENCRYPTED_RE.test(value);
}
exports.encryptColumn = {
    to(value) {
        if (value == null)
            return null;
        if (isEncrypted(value))
            return value;
        return service.encrypt(value);
    },
    from(value) {
        if (value == null)
            return null;
        if (!isEncrypted(value))
            return value;
        return service.decrypt(value);
    },
};
//# sourceMappingURL=encryption.transformer.js.map