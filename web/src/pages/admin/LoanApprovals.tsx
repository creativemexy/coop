import { LoanApprovalQueue } from '../../components/loans/LoanApprovalQueue'

export function AdminLoanApprovals() {
  return (
    <div className="space-y-6">
      <LoanApprovalQueue stage="admin" />
    </div>
  )
}
