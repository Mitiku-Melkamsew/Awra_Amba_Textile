import type { WorkOrderDetail } from "../api";
import { useZigDetail } from "./zig-details/useZigDetail";
import { ZigHeader } from "./zig-details/ZigHeader";
import { ZigFabricReturnsSection } from "./zig-details/ZigFabricReturnsSection";
import { ZigYarnDeliveriesSection } from "./zig-details/ZigYarnDeliveriesSection";
import { ZigSummarySidebar } from "./zig-details/ZigSummarySidebar";
import { CancelZigModal } from "./zig-details/CancelZigModal";

interface ZigDetailViewProps {
  order: WorkOrderDetail;
  readOnly?: boolean;
  backLink: string;
  onRefresh: () => void;
}

export function ZigDetailView({
  order,
  readOnly = false,
  backLink,
  onRefresh,
}: ZigDetailViewProps) {
  const detail = useZigDetail({
    order,
    readOnly,
    onRefresh,
  });

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", padding: "1.5rem 2rem" }}>
      {/* Back Link, Title, Status & Stepper */}
      <ZigHeader
        order={order}
        backLink={backLink}
        weaverDisplayName={detail.weaverDisplayName}
        statusNorm={detail.statusNorm}
        currentStepIndex={detail.currentStepIndex}
        message={detail.message}
        error={detail.error}
      />

      {/* Main 2-Column Responsive Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.85fr) minmax(0, 1.15fr)",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Left Column: Fabric returns & Yarn deliveries */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <ZigFabricReturnsSection
            order={order}
            canRecordFabric={detail.canRecordFabric}
            recordReturnOpen={detail.recordReturnOpen}
            setRecordReturnOpen={detail.setRecordReturnOpen}
            editingFabricReturn={detail.editingFabricReturn}
            setEditingFabricReturn={detail.setEditingFabricReturn}
            fabricDisplayName={detail.fabricDisplayName}
            totalFabricReturned={detail.totalFabricReturned}
            totalGrossFabric={detail.totalGrossFabric}
            totalDeductions={detail.totalDeductions}
            totalNetFabric={detail.totalNetFabric}
            onRefresh={onRefresh}
            setMessage={detail.setMessage}
          />

          <ZigYarnDeliveriesSection
            order={order}
            canEdit={detail.canEdit}
            giveYarnOpen={detail.giveYarnOpen}
            setGiveYarnOpen={detail.setGiveYarnOpen}
            yarnLines={detail.yarnLines}
            setYarnLines={detail.setYarnLines}
            yarnVariants={detail.yarnVariants}
            handleYarnSubmit={detail.handleYarnSubmit}
            editingYarnId={detail.editingYarnId}
            editingYarnLines={detail.editingYarnLines}
            setEditingYarnLines={detail.setEditingYarnLines}
            editingYarnRemark={detail.editingYarnRemark}
            setEditingYarnRemark={detail.setEditingYarnRemark}
            startEditYarn={detail.startEditYarn}
            cancelEditYarn={detail.cancelEditYarn}
            handleYarnEditSubmit={detail.handleYarnEditSubmit}
          />
        </div>

        {/* Right Column: Actions, Net Payable Banner & Metadata */}
        <ZigSummarySidebar
          order={order}
          netPayable={detail.netPayable}
          totalNetFabric={detail.totalNetFabric}
          totalYarnCost={detail.totalYarnCost}
          canRecordFabric={detail.canRecordFabric}
          canEdit={detail.canEdit}
          canMarkReturned={detail.canMarkReturned}
          canCancel={detail.canCancel}
          onRecordFabricClick={() => {
            detail.setEditingFabricReturn(null);
            detail.setRecordReturnOpen(true);
            const el = document.getElementById("fabric-returns-card");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          onGiveYarnClick={() => {
            detail.cancelEditYarn();
            detail.setGiveYarnOpen(true);
            const el = document.getElementById("yarn-deliveries-card");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          onMarkReturnedClick={detail.handleMarkReturned}
          onOpenCancelModal={() => detail.setIsCancelModalOpen(true)}
          weaverDisplayName={detail.weaverDisplayName}
          fabricDisplayName={detail.fabricDisplayName}
          totalYarnGiven={detail.totalYarnGiven}
          totalFabricReturned={detail.totalFabricReturned}
          totalGrossFabric={detail.totalGrossFabric}
          totalDeductions={detail.totalDeductions}
        />
      </div>

      {/* Safety Confirmation Modal for Cancelling Zig */}
      <CancelZigModal
        isOpen={detail.isCancelModalOpen}
        onClose={() => detail.setIsCancelModalOpen(false)}
        zigId={order.zigId}
        weaverDisplayName={detail.weaverDisplayName}
        cancelling={detail.cancelling}
        onConfirm={detail.handleConfirmCancelZig}
      />
    </div>
  );
}

export default ZigDetailView;
