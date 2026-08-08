import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private readonly logger;
    private transporter;
    private configured;
    constructor(configService: ConfigService);
    send(options: {
        to: string;
        subject: string;
        text?: string;
        html?: string;
    }): Promise<void>;
}
