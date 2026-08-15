import { LoanApprovalQueue } from '../../components/loans/LoanApprovalQueue'

export function AccountantLoanDisbursements() {
  return (
    <div className="space-y-6">
      <LoanApprovalQueue stage="disbursement" />
    </div>
  )
}
