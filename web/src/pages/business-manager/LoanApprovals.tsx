import { LoanApprovalQueue } from '../../components/loans/LoanApprovalQueue'

export function BusinessManagerLoanApprovals() {
  return (
    <div className="space-y-6">
      <LoanApprovalQueue stage="organization" />
    </div>
  )
}
