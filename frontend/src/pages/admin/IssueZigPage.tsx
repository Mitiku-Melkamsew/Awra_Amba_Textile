import { Link, useParams } from "react-router-dom";
import { AddFabricVariantModal } from "../../components/AddFabricVariantModal";
import { useIssueZig } from "./issue-zig/useIssueZig";
import { DeactivatedWeaverAlert } from "./issue-zig/DeactivatedWeaverAlert";
import { FabricSelectionCard } from "./issue-zig/FabricSelectionCard";
import { YarnLinesCard } from "./issue-zig/YarnLinesCard";
import { IssueZigSummarySidebar } from "./issue-zig/IssueZigSummarySidebar";

export function IssueZigPage() {
  const { userId } = useParams<{ userId: string }>();
  const zig = useIssueZig({ targetUserId: userId });

  if (zig.loading || !zig.weaver) {
    return (
      <div className="page" style={{ padding: "3rem 2rem", textAlign: "center" }}>
        <div style={{ fontSize: "1.2rem", color: "var(--color-text-muted, #64748b)" }}>
          ⏳ Loading work order setup for weaver…
        </div>
      </div>
    );
  }

  if (zig.isDeactivated) {
    return (
      <DeactivatedWeaverAlert
        targetUserId={userId}
        weaverDisplayName={zig.weaverDisplayName}
      />
    );
  }

  return (
    <div className="page" style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", padding: "1.5rem 2rem" }}>
      {/* Top Breadcrumb Link */}
      <Link
        to={`/admin/weavers/${userId}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          textDecoration: "none",
          color: "var(--color-primary, #c2410c)",
          fontSize: "0.88rem",
          fontWeight: 600,
          marginBottom: "0.75rem",
        }}
      >
        <span>‹</span> {zig.weaverDisplayName}
      </Link>

      {/* Page Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <p
          style={{
            margin: 0,
            textTransform: "uppercase",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "var(--color-primary, #c2410c)",
            letterSpacing: "0.5px",
          }}
        >
          አዲስ ዝግ · NEW ZIG
        </p>
        <h1
          style={{
            margin: "0.2rem 0 0",
            fontSize: "1.85rem",
            fontWeight: 800,
            color: "var(--color-text, #0f172a)",
          }}
        >
          Issue zig for {zig.weaverDisplayName}
        </h1>
      </div>

      {/* Main Two-Column Layout */}
      <form onSubmit={zig.handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.85fr) minmax(300px, 1.15fr)",
            gap: "1.75rem",
            alignItems: "start",
          }}
        >
          {/* LEFT COLUMN: Main Form Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <FabricSelectionCard
              selectedVariantId={zig.selectedVariantId}
              fabricVariants={zig.fabricVariants}
              fabricSpecs={zig.fabricSpecs}
              weaverRate={zig.weaverRate}
              onSelectVariant={zig.handleSelectVariantById}
              onOpenAddNew={zig.handleOpenAddNewFabric}
            />

            <YarnLinesCard
              yarnLines={zig.yarnLines}
              lineCalculations={zig.lineCalculations}
              yarnVariants={zig.yarnVariants}
              handleYarnVariantChange={zig.handleYarnVariantChange}
              handleQuantityChange={zig.handleQuantityChange}
              handleUnitPriceChange={zig.handleUnitPriceChange}
              handleRemoveYarnLine={zig.handleRemoveYarnLine}
              handleAddYarnLine={zig.handleAddYarnLine}
              notes={zig.notes}
              setNotes={zig.setNotes}
            />
          </div>

          {/* RIGHT COLUMN: Sticky Summary Sidebar */}
          <IssueZigSummarySidebar
            weaverDisplayName={zig.weaverDisplayName}
            fabricDisplayName={zig.fabricDisplayName}
            totalLines={zig.totalLines}
            totalQuantity={zig.totalQuantity}
            totalYarnValue={zig.totalYarnValue}
            validationProblems={zig.validationProblems}
            error={zig.error}
            saving={zig.saving}
            targetUserId={userId}
          />
        </div>
      </form>

      {/* Inline Add New Fabric Variant Modal */}
      <AddFabricVariantModal controller={zig.variantModal} />
    </div>
  );
}

export default IssueZigPage;
