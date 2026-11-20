import { useEffect, useState, useMemo } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  catalogApi,
  workOrdersApi,
  yarnGivenApi,
  type WorkOrderDetail,
} from "../api";
import { formatDateDDMMYY } from "../utils/formatDate";
import { fabricVariantName } from "../utils/variantNames";
import {
  createYarnLineDraft,
  parseYarnLines,
  yarnRowToLineDraft,
  type YarnLineDraft,
  type YarnLinePayload,
  type YarnVariantOption,
} from "../utils/yarnLines";
import { FabricReturnForm } from "./FabricReturnForm";
import { YarnLinesEditor } from "./YarnLinesEditor";

function variantLabel(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" · ");
}

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
  // Yarn options & states
  const [yarnVariants, setYarnVariants] = useState<YarnVariantOption[]>([]);
  const [yarnLines, setYarnLines] = useState<YarnLineDraft[]>([
    createYarnLineDraft(),
  ]);
  const [giveYarnOpen, setGiveYarnOpen] = useState(false);
  const [editingYarnId, setEditingYarnId] = useState<number | null>(null);
  const [editingYarnLines, setEditingYarnLines] = useState<YarnLineDraft[]>([]);
  const [editingYarnRemark, setEditingYarnRemark] = useState("");

  // Fabric return record / edit section state
  const [recordReturnOpen, setRecordReturnOpen] = useState(false);
  const [editingFabricReturn, setEditingFabricReturn] = useState<any | null>(null);

  // Cancel Confirmation Modal state (Making Cancel Standout with Error Prevention)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Global feedback
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const statusNorm = (order.status || "assigned").toLowerCase();

  const canEdit =
    !readOnly &&
    (statusNorm === "assigned" ||
      statusNorm === "in_progress" ||
      statusNorm === "returned");

  const canRecordFabric =
    !readOnly &&
    (statusNorm === "assigned" ||
      statusNorm === "in_progress" ||
      statusNorm === "returned");

  const canMarkReturned =
    !readOnly &&
    statusNorm !== "returned" &&
    statusNorm !== "reconciled" &&
    statusNorm !== "cancelled";

  const canCancel =
    !readOnly && statusNorm !== "reconciled" && statusNorm !== "cancelled";

  useEffect(() => {
    if (!canEdit) return;
    catalogApi.yarnVariants().then((variants) => {
      setYarnVariants(variants as YarnVariantOption[]);
      setYarnLines([createYarnLineDraft()]);
    });
  }, [canEdit]);

  function startEditYarn(yarnGivenId: number) {
    const row = order.yarnGiven.find((r) => r.yarnGivenId === yarnGivenId);
    if (!row) return;
    setEditingYarnId(yarnGivenId);
    setEditingYarnLines([yarnRowToLineDraft(row as any)]);
    setEditingYarnRemark((row as any).remark || "");
    setGiveYarnOpen(false);
    setError("");
  }

  function cancelEditYarn() {
    setEditingYarnId(null);
    setEditingYarnLines([]);
    setEditingYarnRemark("");
  }

  async function handleYarnEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingYarnId == null) return;
    const row = order.yarnGiven.find((r) => r.yarnGivenId === editingYarnId);
    if (!row) return;

    setError("");
    setMessage("");

    const line = editingYarnLines[0];
    if (!line) {
      setError("Please specify yarn details.");
      return;
    }

    const qty = parseFloat(line.quantity);
    if (Number.isNaN(qty) || qty <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }

    try {
      await yarnGivenApi.update(editingYarnId, {
        quantity: qty,
        unitPrice: line.unitPrice ? parseFloat(line.unitPrice) : row.unitPrice ? Number(row.unitPrice) : 0,
        remark: editingYarnRemark.trim() || undefined,
      });
      setMessage("Yarn delivery updated.");
      cancelEditYarn();
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update yarn");
    }
  }

  async function handleYarnSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    let lines: YarnLinePayload[];
    try {
      lines = parseYarnLines(yarnLines);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid yarn lines entered",
      );
      return;
    }

    try {
      await yarnGivenApi.create({
        zigId: order.zigId,
        lines: lines.map((l) => ({
          yarnVariantId: Number(l.yarnVariantId),
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice || 0),
        })),
      });
      setMessage(`Recorded ${lines.length} yarn delivery(s).`);
      setYarnLines([createYarnLineDraft()]);
      setGiveYarnOpen(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record yarn");
    }
  }

  async function handleMarkReturned() {
    setError("");
    setMessage("");
    try {
      await workOrdersApi.markReturned(order.zigId);
      setMessage("Work order marked as returned.");
      onRefresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark as returned",
      );
    }
  }

  // Standout Cancel Zig execution
  async function handleConfirmCancelZig() {
    setError("");
    setMessage("");
    setCancelling(true);
    try {
      await workOrdersApi.cancel(order.zigId);
      setMessage("Work order cancelled successfully.");
      setIsCancelModalOpen(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel zig");
    } finally {
      setCancelling(false);
    }
  }

  // Metadata calculations
  const totalYarnGiven = useMemo(
    () => order.yarnGiven.reduce((acc, yg) => acc + Number(yg.quantity || 0), 0),
    [order.yarnGiven],
  );
  const totalYarnCost = useMemo(
    () => order.yarnGiven.reduce((acc, yg) => acc + (Number(yg.quantity || 0) * Number(yg.unitPrice || 0)), 0),
    [order.yarnGiven],
  );
  const totalFabricReturned = useMemo(
    () => order.fabricReturns.reduce((acc, fr) => acc + Number(fr.quantityReturned || 0), 0),
    [order.fabricReturns],
  );
  const totalGrossFabric = useMemo(
    () => order.fabricReturns.reduce((acc, fr: any) => {
      const g = fr.grossFabricValue !== undefined
        ? Number(fr.grossFabricValue)
        : (Number(fr.quantityReturned || 0) * Number(fr.unitPrice || 0));
      return acc + g;
    }, 0),
    [order.fabricReturns],
  );
  const totalDeductions = useMemo(
    () => order.fabricReturns.reduce((acc, fr: any) => acc + Number(fr.deductionAmount || 0), 0),
    [order.fabricReturns],
  );
  const totalNetFabric = totalGrossFabric - totalDeductions;
  const netPayable = order.netPayable !== undefined ? Number(order.netPayable) : (totalNetFabric - totalYarnCost);

  const fabricDisplayName = useMemo(() => {
    if (order.fabricVariant) {
      return fabricVariantName(order.fabricVariant).split("-").join(" · ");
    }
    return order.fabric?.name || "medebegna · biret · geberdin";
  }, [order.fabricVariant, order.fabric]);

  const weaverDisplayName =
    order.weaver.fullName ||
    `Weaver #${order.weaverUserId}`;

  // Stepper calculations
  const steps = [
    { key: "assigned", label: "Assigned" },
    { key: "in_progress", label: "In progress" },
    { key: "returned", label: "Returned" },
    { key: "reconciled", label: "Reconciled" },
  ];

  const currentStepIndex = useMemo(() => {
    if (statusNorm === "cancelled") return -1;
    if (statusNorm === "reconciled") return 3;
    if (statusNorm === "returned") return 2;
    if (statusNorm === "in_progress") return 1;
    return 0; // assigned
  }, [statusNorm]);

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", padding: "1.5rem 2rem" }}>
      {/* ─────────────────────────────────────────────────────────────
          BACK LINK (Image 1)
         ───────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "1rem" }}>
        <Link
          to={backLink}
          style={{
            color: "var(--brand, #c2410c)",
            fontSize: "0.92rem",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          ‹ {weaverDisplayName}
        </Link>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ZIG TOP HEADER (Image 1)
         ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "2rem",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              {order.zigId}
            </h1>
            <span
              style={{
                background:
                  statusNorm === "in_progress"
                    ? "#e0f2fe"
                    : statusNorm === "returned"
                    ? "#fef3c7"
                    : statusNorm === "reconciled"
                    ? "#dcfce7"
                    : statusNorm === "cancelled"
                    ? "#fee2e2"
                    : "#f1f5f9",
                color:
                  statusNorm === "in_progress"
                    ? "#0369a1"
                    : statusNorm === "returned"
                    ? "#b45309"
                    : statusNorm === "reconciled"
                    ? "#15803d"
                    : statusNorm === "cancelled"
                    ? "#b91c1c"
                    : "#475569",
                padding: "0.25rem 0.8rem",
                borderRadius: "9999px",
                fontSize: "0.82rem",
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {order.status.replace("_", " ")}
            </span>
          </div>
          <p
            style={{
              margin: "0.35rem 0 0 0",
              fontSize: "0.85rem",
              color: "#64748b",
            }}
          >
            Issued {formatDateDDMMYY(order.dateIssued ?? new Date())} by admin
          </p>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          style={{
            background: "#dcfce7",
            border: "1px solid #86efac",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            color: "#15803d",
            fontSize: "0.88rem",
            fontWeight: 500,
          }}
        >
          ✓ {message}
        </div>
      )}
      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            color: "#b91c1c",
            fontSize: "0.88rem",
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          HORIZONTAL STATUS STEPPER / LIFECYCLE (Image 1)
         ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "1.25rem 2rem",
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {statusNorm === "cancelled" ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              color: "#b91c1c",
              fontWeight: 700,
              fontSize: "0.95rem",
            }}
          >
            <span>🚫</span>
            <span>This zig was cancelled. Production halted.</span>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {steps.map((step, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flex: idx < steps.length - 1 ? 1 : "none",
                  }}
                >
                  {/* Step Item */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "default",
                    }}
                  >
                    {isDone ? (
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "#16a34a",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                    ) : isCurrent ? (
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "var(--brand, #c2410c)",
                          display: "inline-block",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          border: "2px solid #cbd5e1",
                          background: "#ffffff",
                          display: "inline-block",
                        }}
                      />
                    )}

                    <span
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: isCurrent ? 700 : isDone ? 600 : 500,
                        color: isCurrent ? "#0f172a" : isDone ? "#334155" : "#94a3b8",
                        borderBottom: isCurrent ? "2px solid var(--brand, #c2410c)" : "none",
                        paddingBottom: isCurrent ? "2px" : 0,
                      }}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connecting Line */}
                  {idx < steps.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        background: idx < currentStepIndex ? "#16a34a" : "#e2e8f0",
                        margin: "0 1.25rem",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN 2-COLUMN LAYOUT (Image 1)
         ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.85fr) minmax(0, 1.15fr)",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* ── LEFT COLUMN: Record Sections ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* ── Section 1: Fabric returns (Image 1) ── */}
          <div
            id="fabric-returns-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "1.25rem 1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
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
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                  Fabric returns
                </h3>
                <span
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: "9999px",
                  }}
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
                  style={{
                    background: "var(--brand, #c2410c)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.45rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
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
                  borderBottom: "1px dashed #e2e8f0",
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
                gridTemplateColumns: "minmax(120px, 1.8fr) minmax(50px, 0.7fr) minmax(70px, 0.9fr) minmax(70px, 1fr) minmax(90px, 1.2fr) minmax(80px, 1.1fr) 30px",
                padding: "0.5rem 0",
                borderBottom: "1px solid #f1f5f9",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#64748b",
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
              <div style={{ padding: "1.5rem 0", textAlign: "center", color: "#94a3b8", fontSize: "0.88rem" }}>
                No fabric returns recorded yet.
              </div>
            ) : (
              <div>
                {/* Group Summary Row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(120px, 1.8fr) minmax(50px, 0.7fr) minmax(70px, 0.9fr) minmax(70px, 1fr) minmax(90px, 1.2fr) minmax(80px, 1.1fr) 30px",
                    padding: "0.65rem 0",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: "#0f172a",
                    borderBottom: "1px solid #f8fafc",
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
                  <span style={{ color: totalDeductions > 0 ? "#dc2626" : "#64748b" }}>
                    {totalDeductions > 0 ? `-${totalDeductions.toLocaleString()}` : "—"}
                  </span>
                  <span style={{ textAlign: "right", color: "#15803d", fontWeight: 800 }}>
                    {totalNetFabric.toLocaleString()}
                  </span>
                  <span></span>
                </div>

                {/* Sub-rows */}
                {order.fabricReturns.map((ret: any, idx) => {
                  const retGross = ret.grossFabricValue !== undefined
                    ? Number(ret.grossFabricValue)
                    : (Number(ret.quantityReturned || 0) * Number(ret.unitPrice || 0));
                  const retDeduction = ret.deductionAmount !== undefined
                    ? Number(ret.deductionAmount)
                    : 0;
                  const retNet = retGross - retDeduction;
                  const retDeductions: any[] = ret.deductions || [];

                  return (
                    <div
                      key={ret.returnId}
                      style={{
                        padding: "0.55rem 0",
                        borderBottom: idx < order.fabricReturns.length - 1 ? "1px solid #f8fafc" : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(120px, 1.8fr) minmax(50px, 0.7fr) minmax(70px, 0.9fr) minmax(70px, 1fr) minmax(90px, 1.2fr) minmax(80px, 1.1fr) 30px",
                          fontSize: "0.85rem",
                          color: "#334155",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "#475569" }}>Return {idx + 1}</span>
                        <span>{ret.quantityReturned}</span>
                        <span>{Number(ret.totalWeight).toLocaleString()} g</span>
                        <span>{retGross.toLocaleString()}</span>
                        <span>
                          {retDeduction > 0 ? (
                            <span style={{ color: "#dc2626", fontWeight: 600 }}>
                              -{retDeduction.toLocaleString()}
                            </span>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>—</span>
                          )}
                        </span>
                        <span style={{ textAlign: "right", fontWeight: 700, color: retNet >= 0 ? "#15803d" : "#b91c1c" }}>
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
                                color: "#64748b",
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
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginTop: "3px", fontSize: "0.75rem" }}>
                          {retDeductions.map((d, dIdx) => (
                            <span
                              key={dIdx}
                              style={{
                                background: "#fee2e2",
                                color: "#991b1b",
                                padding: "1px 5px",
                                borderRadius: "3px",
                                fontWeight: 600,
                              }}
                            >
                              {d.factor}: -{d.perPiece}/pc
                            </span>
                          ))}
                          {ret.remark && (
                            <span style={{ color: "#64748b", fontStyle: "italic" }}>
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

          {/* ── Section 2: Yarn deliveries (Image 1) ── */}
          <div
            id="yarn-deliveries-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "1.25rem 1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
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
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                  Yarn deliveries
                </h3>
                <span
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: "9999px",
                  }}
                >
                  {order.yarnGiven.length}
                </span>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    cancelEditYarn();
                    setGiveYarnOpen(!giveYarnOpen);
                  }}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "0.45rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  {giveYarnOpen ? "✕ Cancel" : "+ Give yarn"}
                </button>
              )}
            </div>

            {/* Expandable Yarn Delivery Form */}
            {giveYarnOpen && canEdit && (
              <form
                onSubmit={handleYarnSubmit}
                style={{
                  background: "#f8fafc",
                  borderRadius: "10px",
                  padding: "1rem",
                  marginBottom: "1.25rem",
                  border: "1px solid #e2e8f0",
                }}
              >
                <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "#0f172a" }}>
                  Give Yarn to Weaver
                </h4>
                <YarnLinesEditor
                  lines={yarnLines}
                  onChange={setYarnLines}
                  yarnVariants={yarnVariants}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setGiveYarnOpen(false)}
                    style={{
                      padding: "0.45rem 0.9rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "0.45rem 1.1rem",
                      borderRadius: "6px",
                      border: "none",
                      background: "var(--brand, #c2410c)",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Record delivery
                  </button>
                </div>
              </form>
            )}

            {/* Inline Yarn Edit Form */}
            {editingYarnId != null && canEdit && (
              <form
                onSubmit={handleYarnEditSubmit}
                style={{
                  background: "#fffbeb",
                  borderRadius: "10px",
                  padding: "1rem",
                  marginBottom: "1.25rem",
                  border: "1px solid #fde68a",
                }}
              >
                <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "#92400e" }}>
                  ✏️ Edit / Adjust Yarn Delivery
                </h4>
                <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.78rem", color: "#92400e" }}>
                  To record unused yarn returned by weaver, lower the quantity here and add an explanatory note.
                </p>
                <YarnLinesEditor
                  lines={editingYarnLines}
                  onChange={setEditingYarnLines}
                  yarnVariants={yarnVariants}
                  singleLine
                />
                <div style={{ marginTop: "0.75rem" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#92400e", marginBottom: 3 }}>
                    Adjustment note / remark (e.g. Unused yarn returned or correction)
                  </label>
                  <input
                    type="text"
                    value={editingYarnRemark}
                    onChange={(e) => setEditingYarnRemark(e.target.value)}
                    placeholder="e.g. Weaver returned 3 kg unused yarn"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "0.45rem 0.65rem",
                      borderRadius: "6px",
                      border: "1px solid #fde68a",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={cancelEditYarn}
                    style={{
                      padding: "0.45rem 0.9rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "0.45rem 1.1rem",
                      borderRadius: "6px",
                      border: "none",
                      background: "var(--brand, #c2410c)",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Update
                  </button>
                </div>
              </form>
            )}

            {/* Table of Yarn Deliveries */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(140px, 2fr) minmax(60px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr) 30px",
                padding: "0.5rem 0",
                borderBottom: "1px solid #f1f5f9",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#64748b",
              }}
            >
              <span>Yarn</span>
              <span>Qty</span>
              <span>Price</span>
              <span>Date</span>
              <span></span>
            </div>

            {order.yarnGiven.length === 0 ? (
              <div style={{ padding: "1.5rem 0", textAlign: "center", color: "#94a3b8", fontSize: "0.88rem" }}>
                No yarn deliveries recorded.
              </div>
            ) : (
              order.yarnGiven.map((yg) => {
                const yarnLabel = variantLabel([
                  yg.yarnVariant.yarn?.name ?? yg.yarnVariant.sku,
                  yg.yarnVariant.color?.name,
                ]);

                return (
                  <div
                    key={yg.yarnGivenId}
                    style={{
                      padding: "0.65rem 0",
                      fontSize: "0.85rem",
                      color: "#334155",
                      borderBottom: "1px solid #f8fafc",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(140px, 2fr) minmax(60px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr) 30px",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#0f172a" }}>{yarnLabel}</span>
                      <span>{yg.quantity} kg</span>
                      <span>{yg.unitPrice ? `${Number(yg.unitPrice).toLocaleString()} ETB` : "—"}</span>
                      <span style={{ color: "#64748b" }}>{formatDateDDMMYY(yg.dateGiven)}</span>
                      <span>
                        {canEdit && (
                          <button
                            type="button"
                            title="Edit yarn delivery"
                            onClick={() => startEditYarn(yg.yarnGivenId)}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "#64748b",
                              padding: 0,
                              fontSize: "0.95rem",
                            }}
                          >
                            ✎
                          </button>
                        )}
                      </span>
                    </div>
                    {yg.remark && (
                      <div style={{ fontSize: "0.75rem", color: "#64748b", fontStyle: "italic", marginTop: "2px" }}>
                        Note: {yg.remark}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Actions & Summary (Image 1) ── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          {/* Prominent Live Net Payable Banner Card */}
          <div
            style={{
              background: netPayable >= 0 ? "#f0fdf4" : "#fffbeb",
              border: `1.5px solid ${netPayable >= 0 ? "#86efac" : "#fde68a"}`,
              borderRadius: "12px",
              padding: "1rem 1.25rem",
              marginBottom: "1.25rem",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: netPayable >= 0 ? "#15803d" : "#92400e",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {netPayable >= 0 ? "Net Payable to Weaver" : "Net Debit Balance"}
            </div>
            <div
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: netPayable >= 0 ? "#15803d" : "#b45309",
                margin: "0.3rem 0",
              }}
            >
              {netPayable >= 0 ? `+${netPayable.toLocaleString()} ETB` : `${netPayable.toLocaleString()} ETB`}
            </div>
            <div
              style={{
                fontSize: "0.76rem",
                color: "#64748b",
                display: "flex",
                justifyContent: "space-between",
                marginTop: "0.4rem",
                borderTop: "1px dashed rgba(0,0,0,0.08)",
                paddingTop: "0.4rem",
              }}
            >
              <span>Fabric: {totalNetFabric.toLocaleString()} ETB</span>
              <span>Yarn: -{totalYarnCost.toLocaleString()} ETB</span>
            </div>
          </div>

          <h3
            style={{
              margin: "0 0 1rem 0",
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Actions
          </h3>

          {/* Action Buttons (Image 1) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {canRecordFabric && (
              <button
                type="button"
                onClick={() => {
                  setEditingFabricReturn(null);
                  setRecordReturnOpen(true);
                  const el = document.getElementById("fabric-returns-card");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  width: "100%",
                  background: "var(--brand, #c2410c)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.65rem 1rem",
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                Record fabric return
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  cancelEditYarn();
                  setGiveYarnOpen(true);
                  const el = document.getElementById("yarn-deliveries-card");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "0.65rem 1rem",
                  fontSize: "0.92rem",
                  fontWeight: 600,
                  color: "#334155",
                  cursor: "pointer",
                }}
              >
                Give yarn
              </button>
            )}

            {canMarkReturned && (
              <button
                type="button"
                onClick={handleMarkReturned}
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "0.65rem 1rem",
                  fontSize: "0.92rem",
                  fontWeight: 600,
                  color: "#334155",
                  cursor: "pointer",
                }}
              >
                Mark as returned
              </button>
            )}

            {/* Helper Caption */}
            <p
              style={{
                margin: "0.25rem 0 0.5rem 0",
                fontSize: "0.78rem",
                color: "#64748b",
                fontStyle: "italic",
                lineHeight: 1.35,
              }}
            >
              Use "Mark as returned" when the weaver has brought back all the fabric.
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#f1f5f9", margin: "1.25rem 0" }} />

          {/* Metadata Rows (Image 1) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#64748b" }}>Weaver</span>
              <Link
                to={`/admin/weavers/${order.weaverUserId}`}
                style={{
                  fontWeight: 700,
                  color: "#0f172a",
                  textDecoration: "none",
                }}
              >
                {weaverDisplayName}
              </Link>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#64748b" }}>Fabric</span>
              <span style={{ fontWeight: 700, color: "#0f172a", textAlign: "right" }}>
                {fabricDisplayName}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#64748b" }}>Yarn given</span>
              <span style={{ fontWeight: 600, color: "#334155" }}>
                {totalYarnGiven} kg ({totalYarnCost.toLocaleString()} ETB)
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#64748b" }}>Fabric returned</span>
              <span style={{ fontWeight: 700, color: "#0f172a" }}>
                {totalFabricReturned} pieces ({totalGrossFabric.toLocaleString()} ETB gross)
              </span>
            </div>

            {totalDeductions > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#64748b" }}>Quality deductions</span>
                <span style={{ fontWeight: 700, color: "#dc2626" }}>
                  -{totalDeductions.toLocaleString()} ETB
                </span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#64748b" }}>Net fabric value</span>
              <span style={{ fontWeight: 700, color: "#15803d" }}>
                {totalNetFabric.toLocaleString()} ETB
              </span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#f1f5f9", margin: "1.25rem 0" }} />

          {/* ─────────────────────────────────────────────────────────────
              STANDOUT CANCEL THIS ZIG ACTION (UI/UX Skill Design)
              - High visibility warning zone
              - Clear signifier, affordance & feedback
              - Nielsen Error Prevention safety modal
             ───────────────────────────────────────────────────────────── */}
          {canCancel && (
            <div
              style={{
                background: "#fef2f2",
                border: "1.5px solid #fecaca",
                borderRadius: "10px",
                padding: "1rem",
                marginTop: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "#991b1b",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "0.35rem",
                }}
              >
                <span>⚠️</span>
                <span>Danger Zone</span>
              </div>
              <p
                style={{
                  margin: "0 0 0.85rem 0",
                  fontSize: "0.78rem",
                  color: "#7f1d1d",
                  lineHeight: 1.4,
                }}
              >
                Permanently cancel this zig. Production will be terminated and remaining unreturned yarn will be logged.
              </p>
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "2px solid #dc2626",
                  color: "#dc2626",
                  borderRadius: "8px",
                  padding: "0.55rem 1rem",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  boxShadow: "0 1px 2px rgba(220, 38, 38, 0.08)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#dc2626";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.color = "#dc2626";
                }}
              >
                <span>✕</span> Cancel this zig…
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SAFETY CONFIRMATION MODAL FOR CANCELLING ZIG (Design for Error)
         ───────────────────────────────────────────────────────────── */}
      {isCancelModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !cancelling) {
              setIsCancelModalOpen(false);
            }
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: 460,
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              padding: "1.75rem",
              border: "1px solid #fecaca",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem",
                  flexShrink: 0,
                }}
              >
                ⚠️
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  color: "#991b1b",
                }}
              >
                Cancel Zig {order.zigId}?
              </h3>
            </div>

            <p
              style={{
                margin: "0 0 1rem 0",
                fontSize: "0.92rem",
                color: "#334155",
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to cancel this work order for <strong>{weaverDisplayName}</strong>?
            </p>

            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                marginBottom: "1.5rem",
                fontSize: "0.82rem",
                color: "#991b1b",
                lineHeight: 1.45,
              }}
            >
              <strong>Notice:</strong> This action permanently halts work order {order.zigId}. It cannot be undone, and the weaver will not be able to return additional fabric against this zig.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setIsCancelModalOpen(false)}
                style={{
                  padding: "0.6rem 1.25rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                }}
              >
                Keep Zig
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancelZig}
                style={{
                  padding: "0.6rem 1.35rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "#dc2626",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  cursor: cancelling ? "not-allowed" : "pointer",
                  boxShadow: "0 1px 2px rgba(220, 38, 38, 0.2)",
                }}
              >
                {cancelling ? "Cancelling…" : "Yes, Cancel This Zig"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ZigDetailView;
