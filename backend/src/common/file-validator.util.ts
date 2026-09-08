import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const MAGIC_BYTES: Record<string, { bytes: number[]; offset: number }> = {
  'image/png': { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0 },
  'image/jpeg': { bytes: [0xff, 0xd8, 0xff], offset: 0 },
  'image/webp': { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  'image/svg+xml': { bytes: [0x3c, 0x3f, 0x78, 0x6d, 0x6c], offset: 0 },
};

function bytesMatch(buffer: Buffer, magic: { bytes: number[]; offset: number }): boolean {
  for (let i = 0; i < magic.bytes.length; i++) {
    if (buffer[magic.offset + i] !== magic.bytes[i]) {
      return false;
    }
  }
  return true;
}

export function validateImageFile(filePath: string): void {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(16);
    const bytesRead = fs.readSync(fd, buffer, 0, 16, 0);

    if (bytesRead < 3) {
      throw new BadRequestException('File is too small to be a valid image');
    }

    const allowedTypes = Object.values(MAGIC_BYTES);
    const svgText = buffer.toString('utf8').trimStart();
    const isValid = allowedTypes.some((magic) => bytesMatch(buffer, magic)) || svgText.startsWith('<svg');

    if (!isValid) {
      fs.unlinkSync(filePath);
      throw new BadRequestException('Invalid file type: file content does not match allowed image formats');
    }
  } finally {
    fs.closeSync(fd);
  }
}

const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);

export function isAllowedExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}
