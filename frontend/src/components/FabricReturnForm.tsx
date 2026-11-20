import type { KeyboardEvent } from "react";
import type { WorkOrderDetail } from "../api";
import { useFabricReturnForm, type FabricReturnRow } from "./fabric-returns/useFabricReturnForm";
import { FabricVariantPickerModal } from "./fabric-returns/FabricVariantPickerModal";
import { DeductionsSection } from "./fabric-returns/DeductionsSection";
import { GroupedReturnsCard } from "./fabric-returns/GroupedReturnsCard";

interface FabricReturnFormProps {
  order: WorkOrderDetail;
  onSaved: (message?: string) => void;
  editReturn?: FabricReturnRow;
  onCancel?: () => void;
  canRecord?: boolean;
}

export function FabricReturnForm({
  order,
  onSaved,
  editReturn,
  onCancel,
  canRecord = true,
}: FabricReturnFormProps) {
  const form = useFabricReturnForm({
    order,
    onSaved,
    editReturn,
    onCancel,
    canRecord,
  });

  function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      form.handleSubmit();
    }
  }

  const numQty = parseFloat(form.quantity) || 0;

  return (
    <div style={{ width: "100%", margin: "0 0 1.5rem 0" }}>
      {/* 2-Column Responsive Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: canRecord ? "repeat(auto-fit, minmax(360px, 1fr))" : "1fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* LEFT CARD: Record fabric return */}
        {canRecord && (
          <div
            style={{
              background: "var(--color-surface, #ffffff)",
              border: "1px solid var(--color-border-subtle, #e2e8f0)",
              borderRadius: "var(--radius-lg, 14px)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))",
            }}
          >
            {/* Card Title */}
            <h3
              style={{
                margin: "0 0 1.25rem 0",
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "var(--color-text, #0f172a)",
              }}
            >
              {form.editingReturnId
                ? `Edit fabric return #${form.editingReturnId}`
                : "Record fabric return"}
            </h3>

            {/* Error banner */}
            {form.error && (
              <div
                style={{
                  background: "var(--color-danger-subtle, #fee2e2)",
                  border: "1px solid var(--color-danger-border, #fca5a5)",
                  borderRadius: "var(--radius-sm, 8px)",
                  padding: "0.6rem 0.85rem",
                  marginBottom: "1rem",
                  fontSize: "0.85rem",
                  color: "var(--color-danger, #b91c1c)",
                }}
              >
                {form.error}
              </div>
            )}

            <form onSubmit={form.handleSubmit}>
              {/* Fabric Variant Row */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="form-label" style={{ marginBottom: "0.35rem" }}>
                  Fabric
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div
                    style={{
                      flex: 1,
                      background: "var(--color-orange-50, #fffdf5)",
                      border: "1px solid var(--color-orange-200, #fed7aa)",
                      borderRadius: "var(--radius-sm, 8px)",
                      padding: "0.55rem 0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--color-primary, #ea580c)",
                        display: "inline-block",
                      }}
                    />
                    <span style={{ fontWeight: 600, color: "var(--color-text, #1e293b)", fontSize: "0.92rem" }}>
                      {form.selectedVariantDisplayName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={form.handleOpenModal}
                    className="btn btn-secondary"
                    style={{ padding: "0.55rem 1rem", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Numeric Inputs Row: Quantity, Total weight (g), Unit price (ETB) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "0.75rem",
                  marginBottom: "0.5rem",
                }}
              >
                {/* Quantity */}
                <div>
                  <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "0.3rem" }}>
                    Quantity
                  </label>
                  <input
                    ref={form.quantityInputRef}
                    type="number"
                    min={1}
                    step={1}
                    placeholder="0"
                    required
                    value={form.quantity}
                    onChange={(e) => form.setQuantity(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="input"
                    style={{ fontSize: "1rem", fontWeight: 600 }}
                  />
                </div>

                {/* Total weight (g) */}
                <div>
                  <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "0.3rem" }}>
                    Total weight (g)
                  </label>
                  <input
                    type="number"
                    min={0.01}
                    step="any"
                    placeholder="0"
                    required
                    value={form.totalWeight}
                    onChange={(e) => form.setTotalWeight(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="input"
                    style={{ fontSize: "1rem", fontWeight: 600 }}
                  />
                </div>

                {/* Unit price (ETB) */}
                <div>
                  <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "0.3rem" }}>
                    Unit price (ETB)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="0"
                    value={form.unitPrice}
                    onChange={(e) => form.setUnitPrice(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="input"
                    style={{ fontSize: "1rem", fontWeight: 600 }}
                  />
                </div>
              </div>

              {/* Quality Average & Minimum Standard Indicator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginTop: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                {form.flooredAvg > 0 && (
                  <span
                    className={`badge ${form.isCurrentUnderweight ? "badge-warning" : "badge-success"}`}
                    style={{ padding: "0.3rem 0.75rem", fontSize: "0.82rem" }}
                  >
                    {form.isCurrentUnderweight ? "⚠" : "✓"} Avg {form.flooredAvg} g per piece
                  </span>
                )}
                <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted, #64748b)" }}>
                  Minimum average {form.standardWeight} g
                </span>
              </div>

              {/* Collapsible Accordion: More details */}
              <div
                style={{
                  border: "1px dashed var(--color-border-subtle, #cbd5e1)",
                  borderRadius: "var(--radius-sm, 8px)",
                  padding: "0.65rem 0.85rem",
                  marginTop: "1rem",
                }}
              >
                <div
                  onClick={() => form.setDetailsOpen(!form.detailsOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-secondary, #334155)" }}>
                    More details · {form.lengthCm || "64"} × {form.widthCm || "120"} cm ·{" "}
                    {form.remark ? form.remark : "no remark"}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #64748b)" }}>
                    {form.detailsOpen ? "⌃" : "⌵"}
                  </span>
                </div>
                {form.detailsOpen && (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      paddingTop: "0.75rem",
                      borderTop: "1px dashed var(--color-border-subtle, #e2e8f0)",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                        Length (cm)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.lengthCm}
                        onChange={(e) => form.setLengthCm(e.target.value)}
                        className="input"
                        style={{ fontSize: "0.9rem", padding: "0.45rem 0.65rem" }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                        Width (cm)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.widthCm}
                        onChange={(e) => form.setWidthCm(e.target.value)}
                        className="input"
                        style={{ fontSize: "0.9rem", padding: "0.45rem 0.65rem" }}
                      />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                        Remark / ማስታወሻ
                      </label>
                      <input
                        type="text"
                        value={form.remark}
                        placeholder="Optional"
                        onChange={(e) => form.setRemark(e.target.value)}
                        className="input"
                        style={{ fontSize: "0.9rem", padding: "0.45rem 0.65rem" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Quality Deductions Section */}
              <DeductionsSection
                deductions={form.deductions}
                numQty={numQty}
                isCurrentUnderweight={form.isCurrentUnderweight}
                hasWeightDeduction={form.hasWeightDeduction}
                flooredAvg={form.flooredAvg}
                weightDeficit={form.weightDeficit}
                standardWeight={form.standardWeight}
                suggestedWeightPerPiece={form.suggestedWeightPerPiece}
                handleApplyWeightDeduction={form.handleApplyWeightDeduction}
                handleRemoveDeduction={form.handleRemoveDeduction}
                addFactorOpen={form.addFactorOpen}
                setAddFactorOpen={form.setAddFactorOpen}
                factorType={form.factorType}
                setFactorType={form.setFactorType}
                factorPerPiece={form.factorPerPiece}
                setFactorPerPiece={form.setFactorPerPiece}
                factorRemark={form.factorRemark}
                setFactorRemark={form.setFactorRemark}
                handleAddCustomFactor={form.handleAddCustomFactor}
                liveGross={form.liveGross}
                liveDeductionAmount={form.liveDeductionAmount}
                liveNetFabricValue={form.liveNetFabricValue}
              />

              {/* Footer Actions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "1.25rem",
                  gap: "1rem",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.78rem",
                    color: "var(--color-text-muted, #64748b)",
                    lineHeight: 1.35,
                    maxWidth: 260,
                  }}
                >
                  After saving, quantity and weight clear and the cursor returns to Quantity.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {form.editingReturnId && (
                    <button
                      type="button"
                      onClick={form.handleCancelEdit}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={form.saving || !form.quantity || !form.totalWeight}
                    className="btn btn-primary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span>
                      {form.saving
                        ? "Saving…"
                        : form.editingReturnId
                        ? "Update return"
                        : "Save return"}
                    </span>
                    <span
                      style={{
                        background: "rgba(0, 0, 0, 0.22)",
                        color: "#ffedd5",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        padding: "0.15rem 0.4rem",
                        borderRadius: "4px",
                      }}
                    >
                      Enter
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* RIGHT CARD: Fabric returned */}
        <GroupedReturnsCard
          groupedReturns={form.groupedReturns}
          grandTotal={form.grandTotal}
          canRecord={canRecord}
          onStartEdit={form.handleStartEdit}
          onDeleteReturn={form.handleDeleteReturn}
        />
      </div>

      {/* MODAL: Record fabric return · Changing fabric */}
      <FabricVariantPickerModal
        isOpen={form.isModalOpen}
        onClose={() => form.setIsModalOpen(false)}
        selectedVariantId={Number(form.selectedVariant?.fabricVariantId ?? 0)}
        fabrics={form.fabrics}
        colors={form.colors}
        designs={form.designs}
        fabricVariants={form.fabricVariants}
        modalSearch={form.modalSearch}
        setModalSearch={form.setModalSearch}
        modalFabricId={form.modalFabricId}
        setModalFabricId={form.setModalFabricId}
        modalWarpColorId={form.modalWarpColorId}
        setModalWarpColorId={form.setModalWarpColorId}
        modalWeftColorId={form.modalWeftColorId}
        setModalWeftColorId={form.setModalWeftColorId}
        modalDesignId={form.modalDesignId}
        setModalDesignId={form.setModalDesignId}
        onSelectVariant={form.handleSelectModalVariant}
        onApplyCustomVariant={form.handleApplyCustomModalFabric}
      />
    </div>
  );
}

export default FabricReturnForm;
