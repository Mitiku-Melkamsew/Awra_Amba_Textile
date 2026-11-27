import { Link, useParams } from "react-router-dom";
import { fabricVariantName } from "../../utils/variantNames";
import { useIssueZig } from "./issue-zig/useIssueZig";
import { DeactivatedWeaverAlert } from "./issue-zig/DeactivatedWeaverAlert";
import { FabricSelectionCard } from "./issue-zig/FabricSelectionCard";
import { YarnLinesCard } from "./issue-zig/YarnLinesCard";
import { IssueZigSummarySidebar } from "./issue-zig/IssueZigSummarySidebar";
import { IssueZigFabricModal } from "./issue-zig/IssueZigFabricModal";

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

  const lastZigFabricTitle = zig.lastZig
    ? zig.lastZig.fabricVariant
      ? fabricVariantName(zig.lastZig.fabricVariant, " · ")
      : zig.lastZig.fabric?.name ?? "Fabric"
    : null;

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

      {/* Top Banner: Last zig for this weaver */}
      {zig.lastZig && (
        <div
          style={{
            background: "var(--color-orange-50, #fff7ed)",
            border: "1px solid var(--color-orange-100, #ffedd5)",
            borderRadius: "var(--radius-md, 10px)",
            padding: "0.85rem 1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ fontSize: "0.92rem", color: "var(--color-orange-800, #9a3412)" }}>
            Last zig for this weaver:{" "}
            <strong>
              {zig.lastZig.zigId} · {lastZigFabricTitle}
            </strong>
          </div>
          <button
            type="button"
            onClick={zig.handleUseSameSetup}
            className="btn btn-secondary"
            style={{
              borderColor: "var(--color-orange-300, #fdba74)",
              color: "var(--color-primary, #c2410c)",
              fontWeight: 700,
              fontSize: "0.85rem",
              padding: "0.45rem 0.9rem",
            }}
          >
            Use the same setup
          </button>
        </div>
      )}

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
              fabricDisplayName={zig.fabricDisplayName}
              fabricSpecs={zig.fabricSpecs}
              weaverRate={zig.weaverRate}
              onOpenModal={zig.openFabricModal}
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

      {/* Fabric Selection Modal */}
      <IssueZigFabricModal
        isOpen={zig.isModalOpen}
        onClose={() => zig.setIsModalOpen(false)}
        modalSearch={zig.modalSearch}
        setModalSearch={zig.setModalSearch}
        modalFabricId={zig.modalFabricId}
        setModalFabricId={zig.setModalFabricId}
        modalWarpColorId={zig.modalWarpColorId}
        setModalWarpColorId={zig.setModalWarpColorId}
        modalWeftColorId={zig.modalWeftColorId}
        setModalWeftColorId={zig.setModalWeftColorId}
        modalDesignId={zig.modalDesignId}
        setModalDesignId={zig.setModalDesignId}
        fabrics={zig.fabrics}
        colors={zig.colors}
        designs={zig.designs}
        fabricVariants={zig.fabricVariants}
        onSelectVariant={zig.handleSelectModalVariant}
        onApplyModalFabric={zig.handleApplyModalFabric}
      />
    </div>
  );
}

export default IssueZigPage;
