"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = sanitizeInput;
exports.sanitizeObject = sanitizeObject;
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const SANITIZE_OPTIONS = {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
    allowedSchemes: [],
    allowedSchemesByTag: {},
    allowedSchemesAppliedToAttributes: [],
    allowProtocolRelative: false,
    enforceHtmlBoundary: true,
};
function sanitizeInput(input) {
    return (0, sanitize_html_1.default)(input, SANITIZE_OPTIONS).trim();
}
function sanitizeObject(obj, fields) {
    const result = { ...obj };
    for (const field of fields) {
        const val = result[field];
        if (typeof val === 'string') {
            result[field] = sanitizeInput(val);
        }
    }
    return result;
}
//# sourceMappingURL=sanitize.util.js.map