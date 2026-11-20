import type { WorkOrderDetail } from "../../api";
import { FabricReturnForm } from "../FabricReturnForm";

export interface ZigFabricReturnsSectionProps {
  order: WorkOrderDetail;
  canRecordFabric: boolean;
  recordReturnOpen: boolean;
  setRecordReturnOpen: (open: boolean) => void;
  editingFabricReturn: any;
  setEditingFabricReturn: (ret: any) => void;
  fabricDisplayName: string;
  totalFabricReturned: number;
  totalGrossFabric: number;
  totalDeductions: number;
  totalNetFabric: number;
  onRefresh: () => void;
  setMessage: (msg: string) => void;
}

export function ZigFabricReturnsSection({
  order,
  canRecordFabric,
  recordReturnOpen,
  setRecordReturnOpen,
  editingFabricReturn,
  setEditingFabricReturn,
  fabricDisplayName,
  totalFabricReturned,
  totalGrossFabric,
  totalDeductions,
  totalNetFabric,
  onRefresh,
  setMessage,
}: ZigFabricReturnsSectionProps) {
  return (
    <div
      id="fabric-returns-card"
      style={{
        background: "var(--color-surface, #ffffff)",
        border: "1px solid var(--color-border-subtle, #e2e8f0)",
        borderRadius: "var(--radius-lg, 14px)",
        padding: "1.25rem 1.5rem",
        boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text, #0f172a)" }}>
            Fabric returns
          </h3>
          <span
            className="badge badge-neutral"
            style={{ fontSize: "0.75rem", padding: "2px 7px" }}
          >
            {order.fabricReturns.length}
          </span>
        </div>

        {canRecordFabric && (
          <button
            type="button"
            onClick={() => {
              setEditingFabricReturn(null);
              setRecordReturnOpen(!recordReturnOpen);
            }}
            className="btn btn-primary"
            style={{
              padding: "0.45rem 1rem",
              fontSize: "0.85rem",
            }}
          >
            {recordReturnOpen ? "✕ Close form" : "+ Record return"}
          </button>
        )}
      </div>

      {/* Inline expandable Fabric Return Form */}
      {recordReturnOpen && canRecordFabric && (
        <div
          style={{
            marginBottom: "1.5rem",
            paddingBottom: "1.5rem",
            borderBottom: "1px dashed var(--color-border-subtle, #e2e8f0)",
          }}
        >
          <FabricReturnForm
            order={order}
            canRecord={canRecordFabric}
            editReturn={editingFabricReturn}
            onCancel={() => {
              setEditingFabricReturn(null);
              setRecordReturnOpen(false);
            }}
            onSaved={(msg) => {
              setMessage(msg ?? "Fabric return recorded.");
              setEditingFabricReturn(null);
              onRefresh();
            }}
          />
        </div>
      )}

      {/* Table of Fabric Returns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(120px, 1.8fr) minmax(50px, 0.7fr) minmax(70px, 0.9fr) minmax(70px, 1fr) minmax(90px, 1.2fr) minmax(80px, 1.1fr) 30px",
          padding: "0.5rem 0",
          borderBottom: "1px solid var(--color-border-subtle, #f1f5f9)",
          fontSize: "0.78rem",
          fontWeight: 600,
          color: "var(--color-text-muted, #64748b)",
        }}
      >
        <span>Fabric / Return</span>
        <span>Pieces</span>
        <span>Weight</span>
        <span>Gross</span>
        <span>Deductions</span>
        <span style={{ textAlign: "right" }}>Net Pay</span>
        <span></span>
      </div>

      {order.fabricReturns.length === 0 ? (
        <div style={{ padding: "1.5rem 0", textAlign: "center", color: "var(--color-text-muted, #94a3b8)", fontSize: "0.88rem" }}>
          No fabric returns recorded yet.
        </div>
      ) : (
        <div>
          {/* Group Summary Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(120px, 1.8fr) minmax(50px, 0.7fr) minmax(70px, 0.9fr) minmax(70px, 1fr) minmax(90px, 1.2fr) minmax(80px, 1.1fr) 30px",
              padding: "0.65rem 0",
              fontWeight: 700,
              fontSize: "0.9rem",
              color: "var(--color-text, #0f172a)",
              borderBottom: "1px solid var(--color-border-subtle, #f8fafc)",
              alignItems: "center",
            }}
          >
            <span>{fabricDisplayName}</span>
            <span>{totalFabricReturned}</span>
            <span>
              {order.fabricReturns
                .reduce((acc, r) => acc + Number(r.totalWeight || 0), 0)
                .toLocaleString()}{" "}
              g
            </span>
            <span>{totalGrossFabric.toLocaleString()}</span>
            <span style={{ color: totalDeductions > 0 ? "var(--color-danger, #dc2626)" : "var(--color-text-muted, #64748b)" }}>
              {totalDeductions > 0 ? `-${totalDeductions.toLocaleString()}` : "—"}
            </span>
            <span style={{ textAlign: "right", color: "var(--color-success, #15803d)", fontWeight: 800 }}>
              {totalNetFabric.toLocaleString()}
            </span>
            <span></span>
          </div>

          {/* Sub-rows */}
          {order.fabricReturns.map((ret: any, idx) => {
            const retGross =
              ret.grossFabricValue !== undefined
                ? Number(ret.grossFabricValue)
                : Number(ret.quantityReturned || 0) * Number(ret.unitPrice || 0);
            const retDeduction =
              ret.deductionAmount !== undefined ? Number(ret.deductionAmount) : 0;
            const retNet = retGross - retDeduction;
            const retDeductions: any[] = ret.deductions || [];

            return (
              <div
                key={ret.returnId}
                style={{
                  padding: "0.55rem 0",
                  borderBottom:
                    idx < order.fabricReturns.length - 1
                      ? "1px solid var(--color-border-subtle, #f8fafc)"
                      : "none",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(120px, 1.8fr) minmax(50px, 0.7fr) minmax(70px, 0.9fr) minmax(70px, 1fr) minmax(90px, 1.2fr) minmax(80px, 1.1fr) 30px",
                    fontSize: "0.85rem",
                    color: "var(--color-text-secondary, #334155)",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--color-text-secondary, #475569)" }}>
                    Return {idx + 1}
                  </span>
                  <span>{ret.quantityReturned}</span>
                  <span>{Number(ret.totalWeight).toLocaleString()} g</span>
                  <span>{retGross.toLocaleString()}</span>
                  <span>
                    {retDeduction > 0 ? (
                      <span style={{ color: "var(--color-danger, #dc2626)", fontWeight: 600 }}>
                        -{retDeduction.toLocaleString()}
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-text-muted, #94a3b8)" }}>—</span>
                    )}
                  </span>
                  <span
                    style={{
                      textAlign: "right",
                      fontWeight: 700,
                      color: retNet >= 0 ? "var(--color-success, #15803d)" : "var(--color-danger, #b91c1c)",
                    }}
                  >
                    {retNet.toLocaleString()}
                  </span>
                  <span>
                    {canRecordFabric && (
                      <button
                        type="button"
                        title="Edit return"
                        onClick={() => {
                          setEditingFabricReturn(ret);
                          setRecordReturnOpen(true);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--color-text-muted, #64748b)",
                          padding: 0,
                          fontSize: "0.95rem",
                        }}
                      >
                        ✎
                      </button>
                    )}
                  </span>
                </div>

                {/* Deduction pills & remark details */}
                {(retDeductions.length > 0 || ret.remark) && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      flexWrap: "wrap",
                      marginTop: "3px",
                      fontSize: "0.75rem",
                    }}
                  >
                    {retDeductions.map((d, dIdx) => (
                      <span
                        key={dIdx}
                        className="badge badge-danger"
                        style={{ padding: "1px 5px", fontSize: "0.72rem" }}
                      >
                        {d.factor}: -{d.perPiece}/pc
                      </span>
                    ))}
                    {ret.remark && (
                      <span style={{ color: "var(--color-text-muted, #64748b)", fontStyle: "italic" }}>
                        Note: {ret.remark}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
