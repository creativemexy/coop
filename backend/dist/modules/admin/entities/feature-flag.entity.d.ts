export declare enum FeatureFlagEnvironment {
    DEVELOPMENT = "development",
    STAGING = "staging",
    PRODUCTION = "production"
}
export declare enum FeatureFlagStatus {
    ENABLED = "enabled",
    DISABLED = "disabled",
    ROLLING_OUT = "rolling_out",
    DEPRECATED = "deprecated"
}
export declare class FeatureFlag {
    id: string;
    key: string;
    name: string;
    description: string;
    status: FeatureFlagStatus;
    environments: Record<string, boolean>;
    cohortRules: Record<string, any>;
    rolloutPercentage: number;
    createdBy: string;
    updatedBy: string;
    enabledAt: Date;
    isKillSwitch: boolean;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
