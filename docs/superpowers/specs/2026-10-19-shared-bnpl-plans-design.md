# Shared BNPL Plans

## Intent

Every individual who has approved KYC sees the same active BNPL plan set for every catalog item, regardless of their organization.

## Decisions

- Plan definitions are global and centrally managed. Existing plan rows are migrated to global ownership without changing their IDs, so existing subscriptions retain their plan references.
- Only Super Admins can create or edit shared plan terms; BNPL Managers may view the shared plans but cannot change terms for every organization.
- New subscriptions record the member's organization. Eligibility limits, pricing configuration, repayment dates, and organization reporting use that subscription/member organization, not the shared plan owner.
- KYC approval is required both to retrieve the individual plan list and to pass eligibility/subscription checks. Existing expiry behavior remains in force.
- Organization-level configuration such as maximum principal, membership requirement, interest model, and repayment rules remains organization-specific.
- Existing individual subscriptions are backfilled from their user's `organization_id`; nullable organizations remain null and continue to use current defaults.

## Non-goals

- Do not copy or synchronize plan rows per organization.
- Do not change per-organization limits or underwriting rules.
- Do not alter existing subscription financial values or delete/re-key plan rows.
