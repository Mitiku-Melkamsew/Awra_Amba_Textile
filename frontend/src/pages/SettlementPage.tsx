import { useSettlementManager } from "./settlement/useSettlementManager";
import { SettlementHeader } from "./settlement/SettlementHeader";
import { SettlementPayrollTab } from "./settlement/SettlementPayrollTab";
import { SettlementMasterLedgerTab } from "./settlement/SettlementMasterLedgerTab";
import { DisbursePayoutModal } from "./settlement/DisbursePayoutModal";
import { DisputeCancelModal } from "./settlement/DisputeCancelModal";

export function SettlementPage() {
  const s = useSettlementManager();

  return (
    <div className="page">
      {/* Page Header, Real-time Pending Liability Banner & Tab Navigation */}
      <SettlementHeader
        pendingSummary={s.pendingSummary}
        activeTab={s.activeTab}
        onTabChange={s.setActiveTab}
        message={s.message}
        error={s.error}
      />

      {/* TAB 1: PAYROLL WORKSPACE */}
      {s.activeTab === "payroll" && (
        <SettlementPayrollTab
          step={s.step}
          cutoffDate={s.cutoffDate}
          setCutoffDate={s.setCutoffDate}
          exceptionZigIds={s.exceptionZigIds}
          setExceptionZigIds={s.setExceptionZigIds}
          preview={s.preview}
          loading={s.loading}
          committedPreviewId={s.committedPreviewId}
          committedTotal={s.committedTotal}
          committedWeaverCount={s.committedWeaverCount}
          isBatchPaid={s.isBatchPaid}
          payments={s.payments}
          expandedWeaverId={s.expandedWeaverId}
          setExpandedWeaverId={s.setExpandedWeaverId}
          handlePreview={s.handlePreview}
          toggleExceptionZig={s.toggleExceptionZig}
          handleCommit={s.handleCommit}
          onOpenPayoutModal={() => s.setShowPayoutModal(true)}
          onOpenCancelModal={(payment) => {
            s.setCancellingPayment(payment);
            s.setCancellationReason("");
          }}
          resetBatch={s.resetBatch}
        />
      )}

      {/* TAB 2: MASTER ZIGS LEDGER */}
      {s.activeTab === "ledger" && (
        <SettlementMasterLedgerTab
          ledgerStatus={s.ledgerStatus}
          setLedgerStatus={s.setLedgerStatus}
          ledgerData={s.ledgerData}
          ledgerLoading={s.ledgerLoading}
        />
      )}

      {/* Dispute Cancellation Modal */}
      <DisputeCancelModal
        cancellingPayment={s.cancellingPayment}
        cancelLoading={s.cancelLoading}
        cancellationReason={s.cancellationReason}
        setCancellationReason={s.setCancellationReason}
        onClose={() => s.setCancellingPayment(null)}
        onSubmit={s.handleConfirmCancelSettlement}
      />

      {/* Disburse Payout Modal Dialog */}
      <DisbursePayoutModal
        isOpen={s.showPayoutModal}
        onClose={() => s.setShowPayoutModal(false)}
        payoutLoading={s.payoutLoading}
        payoutError={s.payoutError}
        committedPreviewId={s.committedPreviewId}
        committedWeaverCount={s.committedWeaverCount}
        committedTotal={s.committedTotal}
        payoutMethod={s.payoutMethod}
        setPayoutMethod={s.setPayoutMethod}
        payoutNotes={s.payoutNotes}
        setPayoutNotes={s.setPayoutNotes}
        onSubmit={s.handleDisbursePayout}
      />
    </div>
  );
}

export default SettlementPage;
