import { Repository } from 'typeorm';
import { DeviceSession } from './entities/device-session.entity';
export declare class DeviceSessionService {
    private readonly repo;
    private readonly logger;
    constructor(repo: Repository<DeviceSession>);
    checkDevice(userId: string, deviceFingerprint: string, deviceInfo?: {
        deviceName?: string;
        deviceType?: string;
        os?: string;
        browser?: string;
        ipAddress?: string;
    }): Promise<{
        isNewDevice: boolean;
        isTrusted: boolean;
        deviceSession: DeviceSession;
    }>;
    trustDevice(userId: string, deviceFingerprint: string): Promise<void>;
    removeDevice(userId: string, deviceFingerprint: string): Promise<void>;
    getUserDevices(userId: string): Promise<DeviceSession[]>;
    removeAllDevices(userId: string, exceptFingerprint?: string): Promise<void>;
}
