import { InvestmentProduct } from './investment-product.entity';
export declare enum OrderStatus {
    PLACED = "placed",
    PAYMENT_CONFIRMED = "payment_confirmed",
    INVESTED = "invested",
    ALLOCATED = "allocated",
    CANCELLED = "cancelled",
    FAILED = "failed"
}
export declare class InvestmentOrder {
    id: string;
    userId: string;
    productId: string;
    product: InvestmentProduct;
    amount: number;
    units: number | null;
    unitPrice: number | null;
    fee: number;
    productVersion: number | null;
    status: OrderStatus;
    paymentReference: string | null;
    paymentId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
