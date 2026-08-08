"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTemporaryPassword = generateTemporaryPassword;
exports.normalizePhoneForSms = normalizePhoneForSms;
const crypto = __importStar(require("crypto"));
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghjkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*';
function generateTemporaryPassword(length = 12) {
    const all = UPPER + LOWER + DIGITS + SYMBOLS;
    const bytes = crypto.randomBytes(length + 8);
    const chars = [
        UPPER[bytes[0] % UPPER.length],
        LOWER[bytes[1] % LOWER.length],
        DIGITS[bytes[2] % DIGITS.length],
        SYMBOLS[bytes[3] % SYMBOLS.length],
    ];
    for (let i = 4; i < length; i++) {
        chars.push(all[bytes[i] % all.length]);
    }
    for (let i = chars.length - 1; i > 0; i--) {
        const j = bytes[i + 4] % (i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
}
function normalizePhoneForSms(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('234') && (digits.length === 12 || digits.length === 13)) {
        return digits;
    }
    if (digits.startsWith('0')) {
        return `234${digits.slice(1)}`;
    }
    return digits;
}
//# sourceMappingURL=temp-password.util.js.map