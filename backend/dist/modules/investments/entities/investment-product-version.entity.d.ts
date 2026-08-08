import { InvestmentProduct } from './investment-product.entity';
export declare class InvestmentProductVersion {
    id: string;
    productId: string;
    product: InvestmentProduct;
    version: number;
    snapshot: Record<string, any>;
    changeSummary: string | null;
    changedBy: string | null;
    createdAt: Date;
}
