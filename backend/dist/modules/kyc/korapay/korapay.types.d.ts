export type KorapayIdentityType = 'bvn' | 'nin';
export declare const KORAPAY_ENDPOINTS: Record<KorapayIdentityType, string>;
export interface KorapayLookupRequest {
    id: string;
    verification_consent: boolean;
    validation?: {
        first_name?: string;
        last_name?: string;
        date_of_birth?: string;
        selfie?: string;
    };
}
export interface KorapayLookupData {
    reference: string;
    id: string;
    id_type: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    full_name?: string;
    date_of_birth?: string;
    phone_number?: string;
    gender?: string;
    image?: string;
    signature?: string;
    email?: string;
    nin?: string;
    address?: {
        town?: string;
        lga?: string;
        state?: string;
        street?: string;
    };
    validation?: Record<string, {
        value: string;
        match: boolean;
        confidence_rating?: number;
    }>;
    requested_by?: string;
}
export interface KorapayLookupResponse {
    status: boolean;
    message: string;
    data: KorapayLookupData;
}
export interface KorapayWebhookPayload {
    event: string;
    data: {
        reference: string;
        status: 'success' | 'failed';
        type: KorapayIdentityType;
        customer: {
            email: string;
            name: string;
        };
        verified_at: string;
        identity?: {
            type: string;
            number: string;
            first_name?: string;
            last_name?: string;
            date_of_birth?: string;
            phone?: string;
            image?: string;
            gender?: string;
            nationality?: string;
        };
        verification?: {
            status: string;
            confidence: number;
            message: string;
        };
    };
}
