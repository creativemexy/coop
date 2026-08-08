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
exports.validateImageFile = validateImageFile;
exports.isAllowedExtension = isAllowedExtension;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const MAGIC_BYTES = {
    'image/png': { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0 },
    'image/jpeg': { bytes: [0xff, 0xd8, 0xff], offset: 0 },
    'image/webp': { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
    'image/svg+xml': { bytes: [0x3c, 0x3f, 0x78, 0x6d, 0x6c], offset: 0 },
};
function bytesMatch(buffer, magic) {
    for (let i = 0; i < magic.bytes.length; i++) {
        if (buffer[magic.offset + i] !== magic.bytes[i]) {
            return false;
        }
    }
    return true;
}
function validateImageFile(filePath) {
    const fd = fs.openSync(filePath, 'r');
    try {
        const buffer = Buffer.alloc(16);
        const bytesRead = fs.readSync(fd, buffer, 0, 16, 0);
        if (bytesRead < 3) {
            throw new common_1.BadRequestException('File is too small to be a valid image');
        }
        const allowedTypes = Object.values(MAGIC_BYTES);
        const isValid = allowedTypes.some((magic) => bytesMatch(buffer, magic));
        if (!isValid) {
            fs.unlinkSync(filePath);
            throw new common_1.BadRequestException('Invalid file type: file content does not match allowed image formats');
        }
    }
    finally {
        fs.closeSync(fd);
    }
}
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);
function isAllowedExtension(filename) {
    const ext = path.extname(filename).toLowerCase();
    return ALLOWED_EXTENSIONS.has(ext);
}
//# sourceMappingURL=file-validator.util.js.map