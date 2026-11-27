import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { weaverPortalApi } from "../../api";
import type { WorkOrderDetail } from "../../api";
import { formatDateDDMMYY } from "../../utils/formatDate";
import { fabricVariantName } from "../../utils/variantNames";

export function WeaverZigDetailPage() {
  const { zigId } = useParams<{ zigId: string }>();
  const [order, setOrder] = useState<WorkOrderDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!zigId) return;
    setLoading(true);
    try {
      const data = await weaverPortalApi.workOrder(zigId);
      setOrder(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load work order detail");
    } finally {
      setLoading(false);
    }
  }, [zigId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="loading" style={{ padding: "4rem 2rem", textAlign: "center" }}>
        <span>⏳</span> Loading zig details…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <Link to="/weaver/zigs" className="back-link" style={{ display: "inline-flex", marginBottom: "1rem" }}>
          ‹ My zigs
        </Link>
        <div className="error-msg">
          <span>⚠️</span> {error || "Work order not found"}
        </div>
      </div>
    );
  }

  const s = String(order.status || "").toLowerCase();
  const isAssigned = true;
  const isInProgress = s === "in_progress" || s === "returned" || s === "reconciled" || s === "paid";
  const isReturned = s === "returned" || s === "reconciled" || s === "paid";
  const isPaid = s === "reconciled" || s === "paid";

  const fabricTitle = order.fabricVariant
    ? fabricVariantName(order.fabricVariant)
    : order.fabric?.name || "Standard Fabric";

  const yarnGivenList = order.yarnGiven || [];
  const fabricReturnsList = order.fabricReturns || [];

  const totalFabricPieces = fabricReturnsList.reduce(
    (sum, r: any) => sum + (parseInt(String(r.quantityReturned || 0), 10) || 0),
    0
  );

  return (
    <div>
      {/* ── Back Navigation Link & Header (Image 4) ── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <Link
          to="/weaver/zigs"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            color: "var(--text, #0F172A)",
            textDecoration: "none",
            fontSize: "1.65rem",
            fontWeight: 800,
            marginBottom: "0.25rem",
          }}
        >
          <span>‹</span> [{order.zigId}]
        </Link>
        <div style={{ fontSize: "1.05rem", color: "var(--text-muted, #64748B)", fontWeight: 500 }}>
          {fabricTitle}
        </div>
      </div>

      {/* ── Horizontal Stepper Card (Image 4) ── */}
      <div className="weaver-stepper-card">
        {/* Step 1: Assigned */}
        <div className={`weaver-stepper-item ${isAssigned ? "completed" : ""}`}>
          <div className={`weaver-stepper-dot ${isAssigned ? "completed" : ""}`}>✓</div>
          <span>Assigned</span>
        </div>

        {/* Step 2: In progress */}
        <div
          className={`weaver-stepper-item ${
            s === "in_progress" ? "current" : isInProgress ? "completed" : ""
          }`}
        >
          <div
            className={`weaver-stepper-dot ${
              s === "in_progress" ? "current" : isInProgress ? "completed" : ""
            }`}
          >
            {s === "in_progress" ? "●" : isInProgress ? "✓" : "○"}
          </div>
          <span>In progress</span>
        </div>

        {/* Step 3: Returned */}
        <div
          className={`weaver-stepper-item ${
            s === "returned" ? "current" : isReturned ? "completed" : ""
          }`}
        >
          <div
            className={`weaver-stepper-dot ${
              s === "returned" ? "current" : isReturned ? "completed" : ""
            }`}
          >
            {s === "returned" ? "●" : isReturned ? "✓" : "○"}
          </div>
          <span>Returned</span>
        </div>

        {/* Step 4: Paid */}
        <div className={`weaver-stepper-item ${isPaid ? "completed" : ""}`}>
          <div className={`weaver-stepper-dot ${isPaid ? "completed" : ""}`}>
            {isPaid ? "✓" : "○"}
          </div>
          <span>Paid</span>
        </div>
      </div>

      {/* ── Card 1: Yarn Received (Image 4) ── */}
      <div className="weaver-rates-card">
        <h2 className="weaver-rates-title">Yarn received</h2>
        {yarnGivenList.length === 0 ? (
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>
            No yarn disbursement recorded.
          </p>
        ) : (
          yarnGivenList.map((y: any, idx: number) => {
            const yarnName = y.yarnVariant?.yarn?.name || "cotton";
            const colorName = y.yarnVariant?.color?.name || "natural";
            const qty = parseFloat(String(y.quantity || 0));
            const dateStr = y.dateGiven ? formatDateDDMMYY(y.dateGiven) : "—";

            return (
              <div key={y.yarnGivenId || idx} className="weaver-rate-row">
                <div>
                  <div className="weaver-rate-name">
                    {yarnName} · {colorName}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted, #64748B)", marginTop: "2px" }}>
                    {dateStr}
                  </div>
                </div>
                <div className="weaver-rate-price">{qty} pcs</div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Card 2: Fabric Returned (Image 4) ── */}
      <div className="weaver-rates-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
          <h2 className="weaver-rates-title" style={{ margin: 0 }}>
            Fabric returned
          </h2>
          <span style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
            {fabricReturnsList.length} {fabricReturnsList.length === 1 ? "return" : "returns"}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.85rem", borderBottom: "1px solid var(--border-subtle, #F1F5F9)" }}>
          <span style={{ fontWeight: 700, color: "var(--text)" }}>{fabricTitle}</span>
          <span style={{ fontWeight: 800, color: "var(--text)" }}>{totalFabricPieces} pieces</span>
        </div>

        {fabricReturnsList.length === 0 ? (
          <p style={{ color: "var(--text-muted)", margin: "0.85rem 0 0", fontSize: "0.9rem" }}>
            No fabric returns recorded yet. When you return woven pieces to the cooperative inspection desk, they will appear here.
          </p>
        ) : (
          fabricReturnsList.map((ret: any, idx: number) => {
            const qty = parseInt(String(ret.quantityReturned || 0), 10);
            const weight = parseFloat(String(ret.totalWeight || 0));

            return (
              <div key={ret.returnId || idx} className="weaver-rate-row">
                <div>
                  <div className="weaver-rate-name">Return {idx + 1}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted, #64748B)", marginTop: "2px" }}>
                    {weight > 0 ? `${weight.toLocaleString()} g` : "—"}
                  </div>
                </div>
                <div className="weaver-rate-price">{qty} pcs</div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer Note (Image 4) ── */}
      <p style={{ fontSize: "0.85rem", color: "var(--text-muted, #64748B)", margin: "1.5rem 0 0", lineHeight: 1.4 }}>
        Your payment is worked out when the cooperative settles this zig.
      </p>
    </div>
  );
}

export default WeaverZigDetailPage;
