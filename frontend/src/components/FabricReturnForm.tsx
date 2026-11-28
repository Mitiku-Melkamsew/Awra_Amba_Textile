import type { KeyboardEvent } from "react";
import type { WorkOrderDetail } from "../api";
import { AddFabricVariantModal } from "./AddFabricVariantModal";
import { useFabricReturnForm, type FabricReturnRow } from "./fabric-returns/useFabricReturnForm";
import { SearchableVariantSelect } from "../pages/admin/transactions/components/SearchableVariantSelect";
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
              {/* Fabric Variant Search + Add New */}
              <div style={{ marginBottom: "1rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.35rem",
                  }}
                >
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Fabric
                  </label>
                  <button
                    type="button"
                    onClick={() => form.handleOpenCreateVariantModal()}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-primary, #c2410c)",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    + Add new fabric
                  </button>
                </div>
                <SearchableVariantSelect
                  isFabric={true}
                  canAddNew={true}
                  isSale={false}
                  selectedVariantId={form.selectedVariantId ? String(form.selectedVariantId) : ""}
                  fabricVariants={form.fabricVariants}
                  yarnVariants={[]}
                  onSelect={form.handleSelectVariantById}
                  onAddNew={form.handleOpenCreateVariantModal}
                />
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
              <div className="quality-indicators-row">
                {form.flooredAvg > 0 && (
                  <span
                    className={`badge ${
                      !form.hasWeightRule
                        ? "badge--neutral"
                        : form.isCurrentUnderweight
                        ? "badge--warning"
                        : "badge--success"
                    }`}
                  >
                    {form.hasWeightRule && form.isCurrentUnderweight ? "⚠ " : form.hasWeightRule ? "✓ " : ""}Avg {form.flooredAvg} g/pc (std {form.standardWeight} g)
                  </span>
                )}
                {form.numLength > 0 && (
                  <span
                    className={`badge ${
                      !form.hasLengthRule
                        ? "badge--neutral"
                        : form.isCurrentUnderlength
                        ? "badge--warning"
                        : "badge--success"
                    }`}
                  >
                    {form.hasLengthRule && form.isCurrentUnderlength ? "⚠ " : form.hasLengthRule ? "✓ " : ""}Length {form.numLength} cm (std {form.standardLength} cm)
                  </span>
                )}
                {form.numWidth > 0 && (
                  <span
                    className={`badge ${
                      !form.hasWidthRule
                        ? "badge--neutral"
                        : form.isCurrentUnderwidth
                        ? "badge--warning"
                        : "badge--success"
                    }`}
                  >
                    {form.hasWidthRule && form.isCurrentUnderwidth ? "⚠ " : form.hasWidthRule ? "✓ " : ""}Width {form.numWidth} cm (std {form.standardWidth} cm)
                  </span>
                )}
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
                    More details · {form.lengthCm || form.standardLength || "200"} × {form.widthCm || form.standardWidth || "120"} cm ·{" "}
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
                handleRemoveDeduction={form.handleRemoveDeduction}
                handleCancelDeduction={form.handleCancelDeduction}
                handleRestoreDeduction={form.handleRestoreDeduction}
                cancelledAutoDeductions={form.cancelledAutoDeductions}
                availableFactors={form.availableFactors}
                addFactorOpen={form.addFactorOpen}
                setAddFactorOpen={form.setAddFactorOpen}
                handleOpenAddFactor={form.handleOpenAddFactor}
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

      {/* MODAL: Add new fabric variant (with inline base fabric/color/design creation) */}
      <AddFabricVariantModal controller={form.variantModal} />
    </div>
  );
}

export default FabricReturnForm;
