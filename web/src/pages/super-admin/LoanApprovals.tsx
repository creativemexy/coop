import { LoanApprovalQueue } from '../../components/loans/LoanApprovalQueue'

export function SuperAdminLoanApprovals() {
  return (
    <div className="space-y-8">
      <LoanApprovalQueue stage="admin" />
    </div>
  )
}
