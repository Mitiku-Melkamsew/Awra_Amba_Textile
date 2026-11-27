import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import type { ZigLedgerItem } from "../../domain/models";
import { toTitleCase } from "../../utils/formatters";

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
  const [statusFilter, setStatusFilter] = useState<"all" | "ready_to_settle" | "ongoing">("all");

  const filteredData = useMemo(() => {
    if (statusFilter === "ready_to_settle") {
      return data.filter((item) => item.status === "returned");
    }
    if (statusFilter === "ongoing") {
      return data.filter((item) => item.status === "assigned" || item.status === "in_progress");
    }
    return data;
  }, [data, statusFilter]);

  const toggleFilter = (filter: "ready_to_settle" | "ongoing") => {
    setStatusFilter((curr) => (curr === filter ? "all" : filter));
  };

  return (
    <div>
      {/* ── Two Interactive Filter KPI Cards ── */}
      <div className="settlement-kpi-grid">
        {/* Card 1: Ready to settle (Peach Background) */}
        <div
          role="button"
          tabIndex={0}
          className={`settlement-kpi-card settlement-kpi-peach clickable ${
            statusFilter === "ready_to_settle" ? "active-filter" : ""
          }`}
          onClick={() => toggleFilter("ready_to_settle")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleFilter("ready_to_settle");
            }
          }}
          title={
            statusFilter === "ready_to_settle"
              ? "Click to view all zigs"
              : "Click to filter zigs ready to settle"
          }
        >
          <div className="settlement-kpi-label">Ready to settle</div>
          <div className="settlement-kpi-val rust">
            {Math.round(readyToSettleAmount).toLocaleString()} ETB
          </div>
          <div className="settlement-kpi-sub">
            {returnedZigsCount} returned zigs, not yet settled
          </div>
        </div>

        {/* Card 2: Ongoing (White Card) */}
        <div
          role="button"
          tabIndex={0}
          className={`settlement-kpi-card settlement-kpi-white clickable ${
            statusFilter === "ongoing" ? "active-filter" : ""
          }`}
          onClick={() => toggleFilter("ongoing")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleFilter("ongoing");
            }
          }}
          title={
            statusFilter === "ongoing"
              ? "Click to view all zigs"
              : "Click to filter ongoing zigs only"
          }
        >
          <div className="settlement-kpi-label">Ongoing</div>
          <div className="settlement-kpi-val dark">
            {ongoingZigsCount} zigs
          </div>
          <div className="settlement-kpi-sub">
            assigned or in progress
          </div>
        </div>
      </div>

      {/* ── Active Filter Bar ── */}
      {statusFilter !== "all" && (
        <div className="settlement-filter-bar">
          <div className="settlement-filter-info">
            <span>Filtered by:</span>
            <span className="settlement-filter-tag">
              {statusFilter === "ready_to_settle"
                ? `Ready to settle (${filteredData.length})`
                : `Ongoing (${filteredData.length})`}
            </span>
          </div>
          <button
            type="button"
            className="settlement-filter-clear"
            onClick={() => setStatusFilter("all")}
          >
            Show all zigs
          </button>
        </div>
      )}

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
              <th className="settlement-th"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="settlement-loading-state">
                  ⏳ Loading zigs ledger…
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="settlement-empty-state">
                  {statusFilter === "all"
                    ? "No zigs found in ledger."
                    : "No zigs found matching the selected filter."}
                </td>
              </tr>
            ) : (
              filteredData.map((item) => {
                const isOngoing = item.status === "assigned" || item.status === "in_progress";
                const isReturned = item.status === "returned";
                const isReconciled = item.status === "reconciled" || item.isSettled;

                const fabricDetails = [
                  toTitleCase(item.fabricName),
                  item.warpColor && item.weftColor
                    ? `${toTitleCase(item.warpColor)}/${toTitleCase(item.weftColor)}`
                    : toTitleCase(item.warpColor || item.weftColor),
                  toTitleCase(item.design),
                ].filter(Boolean).join(" · ");

                return (
                  <tr key={item.zigId} className="settlement-tr">
                    <td className="settlement-td">
                      <Link to={`/admin/zigs/${item.zigId}`} className="settlement-row-link">
                        {item.zigId}
                      </Link>
                    </td>

                    <td className="settlement-td">
                      <Link
                        to={`/admin/weavers/${item.weaverUserId}`}
                        className="settlement-weaver-link"
                      >
                        {toTitleCase(item.weaverName)}
                      </Link>
                    </td>

                    <td className="settlement-td">
                      <span className="settlement-fabric-name">
                        {fabricDetails || toTitleCase(item.fabricName) || "Standard Fabric"}
                      </span>
                    </td>

                    <td className="settlement-td text-center">
                      <span className="settlement-pcs-count">
                        {isOngoing ? "—" : item.fabric?.receivedQuantity || 0}
                      </span>
                    </td>

                    <td className="settlement-td text-right">
                      {isOngoing ? (
                        <span className="settlement-empty-val">—</span>
                      ) : (
                        <strong className="settlement-payable-val">
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

                    <td className="settlement-td text-right">
                      <Link
                        to={`/admin/zigs/${item.zigId}`}
                        className="settlement-chevron-link"
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
      <div className="settlement-footnote">
        Select a zig to see its yarn, returns and deductions.
      </div>
    </div>
  );
}
