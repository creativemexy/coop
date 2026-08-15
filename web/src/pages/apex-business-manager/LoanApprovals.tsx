import { LoanApprovalQueue } from '../../components/loans/LoanApprovalQueue'

export function ApexBusinessManagerLoanApprovals() {
  return (
    <div className="space-y-6">
      <LoanApprovalQueue stage="apex" />
    </div>
  )
}
