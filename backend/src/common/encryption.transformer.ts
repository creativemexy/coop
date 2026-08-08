import { ValueTransformer } from 'typeorm';
import { EncryptionService } from './encryption.service';

let service: EncryptionService;

export function setEncryptionInstance(svc: EncryptionService): void {
  service = svc;
}

const ENCRYPTED_RE = /^[0-9a-f]+:[0-9a-f]+:/;

function isEncrypted(value: string): boolean {
  return ENCRYPTED_RE.test(value);
}

export const encryptColumn: ValueTransformer = {
  to(value: string | null | undefined): string | null {
    if (value == null) return null;
    if (isEncrypted(value)) return value;
    return service.encrypt(value);
  },
  from(value: string | null | undefined): string | null {
    if (value == null) return null;
    if (!isEncrypted(value)) return value;
    return service.decrypt(value);
  },
};
