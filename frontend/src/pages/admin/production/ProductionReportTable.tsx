import { Link, useNavigate } from "react-router-dom";
import { formatDateDDMMYY } from "../../../utils/formatDate";
import { toTitleCase } from "../../../utils/formatters";
import type { ZigLedgerItem } from "./types";

interface ProductionReportTableProps {
  data: ZigLedgerItem[];
  loading: boolean;
}

export function ProductionReportTable({ data, loading }: ProductionReportTableProps) {
  const navigate = useNavigate();

  return (
    <div className="reports-table-container">
      <table className="reports-table">
        <thead>
          <tr>
            <th className="reports-th">Zig ID</th>
            <th className="reports-th">Weaver</th>
            <th className="reports-th">Fabric Spec</th>
            <th className="reports-th text-center">Status</th>
            <th className="reports-th">Yarn Issued</th>
            <th className="reports-th">Fabric Returns</th>
            <th className="reports-th text-right">Net Balance</th>
            <th className="reports-th">Dates</th>
            <th className="reports-th text-center">Settlement</th>
            <th className="reports-th" style={{ width: "36px" }}></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={10} className="reports-td text-center" style={{ padding: "3rem", color: "#64748B" }}>
                ⏳ Loading production ledger…
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={10} className="reports-td text-center" style={{ padding: "3rem", color: "#94A3B8" }}>
                No work orders found matching current criteria.
              </td>
            </tr>
          ) : (
            data.map((d) => {
              const isUnderweight = d.fabric.averageWeight > 0 && d.fabric.averageWeight < d.standardWeightG;
              const isOngoing = d.status === "assigned" || d.status === "in_progress";
              const isReturned = d.status === "returned";
              const isReconciled = d.status === "reconciled" || d.isSettled;
              const isCancelled = d.status === "cancelled";

              return (
                <tr
                  key={d.zigId}
                  className="reports-tr"
                  onClick={() => navigate(`/admin/zigs/${d.zigId}`)}
                  title={`Click to view work order ${d.zigId}`}
                >
                  {/* Zig ID */}
                  <td className="reports-td">
                    <Link
                      to={`/admin/zigs/${d.zigId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="reports-link-zig"
                    >
                      {d.zigId}
                    </Link>
                  </td>

                  {/* Weaver Name & Phone */}
                  <td className="reports-td">
                    <Link
                      to={`/admin/weavers/${d.weaverUserId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="reports-link-weaver"
                    >
                      {toTitleCase(d.weaverName)}
                    </Link>
                    {d.weaverPhone && (
                      <div className="reports-subtext">{d.weaverPhone}</div>
                    )}
                  </td>

                  {/* Fabric Spec */}
                  <td className="reports-td">
                    <div style={{ fontWeight: 600, color: "#334155" }}>{toTitleCase(d.fabricName)}</div>
                    <div className="reports-subtext">
                      {[d.warpColor, d.weftColor, d.design].filter(Boolean).map(toTitleCase).join(" · ")}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="reports-td text-center">
                    {isReturned ? (
                      <span className="badge-ready-settle">Returned</span>
                    ) : isOngoing ? (
                      <span className="badge-in-progress">
                        {d.status === "in_progress" ? "In progress" : "Assigned"}
                      </span>
                    ) : isReconciled ? (
                      <span className="badge-settled">✓ Reconciled</span>
                    ) : isCancelled ? (
                      <span className="badge-cancelled">Cancelled</span>
                    ) : (
                      <span className="badge-unpaid">{d.status}</span>
                    )}
                  </td>

                  {/* Yarn Issued */}
                  <td className="reports-td">
                    <div>{d.yarn.issuedQuantity} pcs</div>
                    <div className="reports-subtext">
                      {d.yarn.totalCost.toLocaleString()} ETB
                    </div>
                  </td>

                  {/* Fabric Returns & Compliance */}
                  <td className="reports-td">
                    <div>
                      <strong>{d.fabric.receivedQuantity}</strong> pcs ({d.fabric.totalWeight.toLocaleString()} g)
                    </div>
                    {d.fabric.receivedQuantity > 0 && (
                      <div className={isUnderweight ? "reports-weight-under" : "reports-weight-pass"}>
                        Avg {d.fabric.averageWeight} g {isUnderweight ? `(std ${d.standardWeightG}g)` : "✓"}
                      </div>
                    )}
                  </td>

                  {/* Net Balance */}
                  <td className="reports-td text-right">
                    <span className={d.netPayable >= 0 ? "reports-net-positive" : "reports-net-negative"}>
                      {d.netPayable >= 0 ? `+${d.netPayable.toLocaleString()}` : d.netPayable.toLocaleString()} ETB
                    </span>
                    {d.fabric.deductionAmount > 0 && (
                      <div className="reports-weight-under">
                        -{d.fabric.deductionAmount.toLocaleString()} ded.
                      </div>
                    )}
                  </td>

                  {/* Dates */}
                  <td className="reports-td">
                    <div className="reports-subtext">Issued {formatDateDDMMYY(d.dateIssued)}</div>
                    {d.dateReturned && (
                      <div style={{ color: "#059669", fontWeight: 500, fontSize: "0.75rem" }}>
                        Ret. {formatDateDDMMYY(d.dateReturned)}
                      </div>
                    )}
                  </td>

                  {/* Settlement Batch / Status */}
                  <td className="reports-td text-center">
                    {d.settlement ? (
                      <Link
                        to={`/admin/settlement/runs/${d.settlement.batchId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="reports-link-batch"
                        title={`View settlement run BATCH #${d.settlement.batchId}`}
                      >
                        Batch #{d.settlement.batchId}
                      </Link>
                    ) : d.status === "returned" ? (
                      <Link
                        to="/admin/settlement?tab=zigs"
                        onClick={(e) => e.stopPropagation()}
                        className="badge-ready-settle"
                        style={{ textDecoration: "none" }}
                        title="Ready for hisab settlement"
                      >
                        Ready to settle
                      </Link>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>—</span>
                    )}
                  </td>

                  {/* Row Navigation Arrow */}
                  <td className="reports-td text-right" style={{ padding: "0.5rem" }}>
                    <span className="reports-action-arrow">›</span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ProductionReportTable;
