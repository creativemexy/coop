import { InvestmentProduct } from './investment-product.entity';
export declare enum CycleStatus {
    PENDING = "pending",
    APPROVED = "approved",
    ACTIVE = "active",
    CLOSED = "closed"
}
export declare class ShareIssuanceCycle {
    id: string;
    productId: string;
    product: InvestmentProduct;
    cycleName: string;
    totalUnits: number;
    allocatedUnits: number;
    unitPrice: number;
    totalValue: number;
    openDate: Date | null;
    closeDate: Date | null;
    status: CycleStatus;
    approvedBy: string | null;
    approvedAt: Date | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
