import { InvestmentProduct } from './investment-product.entity';
export declare class InvestmentHolding {
    id: string;
    userId: string;
    productId: string;
    product: InvestmentProduct;
    orderId: string;
    units: number;
    costBasis: number;
    currentValue: number | null;
    lockedUntil: Date | null;
    maturityDate: Date | null;
    isLocked: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
