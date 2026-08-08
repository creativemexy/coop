import { ApprovalService } from '../services/approval.service';
import { ApprovalRequestType } from '../entities/approval-request.entity';
export declare class ApprovalController {
    private readonly service;
    constructor(service: ApprovalService);
    submit(dto: {
        requestType: ApprovalRequestType;
        requestData: Record<string, any>;
        reason?: string;
    }, userId: string): Promise<import("../entities/approval-request.entity").ApprovalRequest>;
    list(status?: string, requestType?: string): Promise<import("../entities/approval-request.entity").ApprovalRequest[]>;
    findById(id: string): Promise<import("../entities/approval-request.entity").ApprovalRequest>;
    approve(id: string, userId: string, role: string): Promise<import("../entities/approval-request.entity").ApprovalRequest>;
    reject(id: string, dto: {
        rejectionReason?: string;
    }, userId: string): Promise<import("../entities/approval-request.entity").ApprovalRequest>;
}
