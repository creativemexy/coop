import { ValueTransformer } from 'typeorm';
import { EncryptionService } from './encryption.service';
export declare function setEncryptionInstance(svc: EncryptionService): void;
export declare const encryptColumn: ValueTransformer;
