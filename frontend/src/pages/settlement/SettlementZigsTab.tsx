import { Link } from "react-router-dom";
import type { ZigLedgerItem } from "../../domain/models";

function getNetPayable(item: ZigLedgerItem): number {
  if ((item as any).netPayable !== undefined) return Number((item as any).netPayable);
  const gross = item.fabric?.grossFabricValue ?? 0;
  const deductions = item.fabric?.deductionAmount ?? 0;
  const yarn = item.yarn?.totalCost ?? 0;
  return gross - deductions - yarn;
}

export interface SettlementZigsTabProps {
  data: ZigLedgerItem[];
  loading: boolean;
  readyToSettleAmount: number;
  returnedZigsCount: number;
  ongoingZigsCount: number;
}

export function SettlementZigsTab({
  data,
  loading,
  readyToSettleAmount,
  returnedZigsCount,
  ongoingZigsCount,
}: SettlementZigsTabProps) {
  return (
    <div>
      {/* ── Two KPI Cards ── */}
      <div className="settlement-kpi-grid">
        {/* Card 1: Ready to settle (Peach Background) */}
        <div className="settlement-kpi-card settlement-kpi-peach">
          <div className="settlement-kpi-label">Ready to settle</div>
          <div className="settlement-kpi-val rust">
            {Math.round(readyToSettleAmount).toLocaleString()} ETB
          </div>
          <div className="settlement-kpi-sub">
            {returnedZigsCount} returned zigs, not yet settled
          </div>
        </div>

        {/* Card 2: Ongoing (White Card) */}
        <div className="settlement-kpi-card settlement-kpi-white">
          <div className="settlement-kpi-label">Ongoing</div>
          <div className="settlement-kpi-val dark">
            {ongoingZigsCount} zigs
          </div>
          <div className="settlement-kpi-sub">
            assigned or in progress
          </div>
        </div>
      </div>

      {/* ── Zigs Table ── */}
      <div className="settlement-table-container">
        <table className="settlement-table">
          <thead>
            <tr>
              <th className="settlement-th">Zig</th>
              <th className="settlement-th">Weaver</th>
              <th className="settlement-th">Fabric</th>
              <th className="settlement-th text-center">Billable pcs</th>
              <th className="settlement-th text-right">Net payable</th>
              <th className="settlement-th text-center">Status</th>
              <th className="settlement-th" style={{ width: "40px" }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="settlement-loading-state">
                  ⏳ Loading zigs ledger…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="settlement-empty-state">
                  No zigs found in ledger.
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const isOngoing = item.status === "assigned" || item.status === "in_progress";
                const isReturned = item.status === "returned";
                const isReconciled = item.status === "reconciled" || item.isSettled;

                const fabricDetails = [
                  item.fabricName,
                  item.warpColor && item.weftColor ? `${item.warpColor}/${item.weftColor}` : item.warpColor || item.weftColor,
                  item.design,
                ].filter(Boolean).join(" · ");

                return (
                  <tr key={item.zigId} className="settlement-tr">
                    <td className="settlement-td">
                      <Link
                        to={`/admin/zigs/${item.zigId}`}
                        style={{ fontWeight: 700, color: "#0F172A", textDecoration: "none" }}
                      >
                        {item.zigId}
                      </Link>
                    </td>

                    <td className="settlement-td" style={{ color: "#334155" }}>
                      <Link
                        to={`/admin/weavers/${item.weaverUserId}`}
                        style={{ color: "#334155", textDecoration: "none", fontWeight: 500 }}
                      >
                        {item.weaverName}
                      </Link>
                    </td>

                    <td className="settlement-td" style={{ color: "#64748B", fontSize: "0.9rem" }}>
                      {fabricDetails || item.fabricName || "Standard Fabric"}
                    </td>

                    <td className="settlement-td text-center" style={{ color: "#334155", fontWeight: 500 }}>
                      {isOngoing ? "—" : item.fabric?.receivedQuantity || 0}
                    </td>

                    <td className="settlement-td text-right">
                      {isOngoing ? (
                        <span style={{ color: "#94A3B8" }}>—</span>
                      ) : (
                        <strong style={{ color: "#0F172A", fontWeight: 700 }}>
                          {Math.round(getNetPayable(item)).toLocaleString()}
                        </strong>
                      )}
                    </td>

                    <td className="settlement-td text-center">
                      {isReturned ? (
                        <span className="badge-ready-settle">Ready to settle</span>
                      ) : isOngoing ? (
                        <span className="badge-in-progress">In progress</span>
                      ) : isReconciled ? (
                        <span className="badge-settled">
                          ✓ Settled {item.settlement?.batchId ? `· #${item.settlement.batchId}` : ""}
                        </span>
                      ) : (
                        <span className="badge-unpaid">{item.status}</span>
                      )}
                    </td>

                    <td className="settlement-td text-right" style={{ padding: "1rem" }}>
                      <Link
                        to={`/admin/zigs/${item.zigId}`}
                        style={{
                          color: "#94A3B8",
                          textDecoration: "none",
                          fontSize: "1.1rem",
                          fontWeight: 600,
                        }}
                      >
                        ›
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footnote ── */}
      <div style={{ marginTop: "0.85rem", color: "#94A3B8", fontSize: "0.85rem" }}>
        Select a zig to see its yarn, returns and deductions.
      </div>
    </div>
  );
}
