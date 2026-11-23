import { Link } from "react-router-dom";
import { formatDateDDMMYY } from "../../../utils/formatDate";
import type { ZigLedgerItem } from "./types";

interface ProductionReportTableProps {
  data: ZigLedgerItem[];
  loading: boolean;
}

export function ProductionReportTable({ data, loading }: ProductionReportTableProps) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Zig ID</th>
            <th>Artisan Weaver</th>
            <th>Fabric Spec</th>
            <th>Status</th>
            <th>Yarn Issued</th>
            <th>Fabric Returns</th>
            <th style={{ textAlign: "right" }}>Net Balance</th>
            <th>Dates</th>
            <th>Settlement</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={9} style={{ textAlign: "center", padding: "3rem" }}>
                ⏳ Loading production ledger…
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                No work orders found matching current criteria.
              </td>
            </tr>
          ) : (
            data.map((d) => {
              const isUnderweight = d.fabric.averageWeight > 0 && d.fabric.averageWeight < d.standardWeightG;

              return (
                <tr key={d.zigId}>
                  <td>
                    <Link
                      to={`/admin/zigs/${d.zigId}`}
                      style={{ fontWeight: 700, color: "var(--brand, #c2410c)", textDecoration: "none" }}
                    >
                      {d.zigId}
                    </Link>
                  </td>

                  <td>
                    <Link
                      to={`/admin/weavers/${d.weaverUserId}`}
                      style={{ fontWeight: 600, color: "#0f172a", textDecoration: "none" }}
                    >
                      {d.weaverName}
                    </Link>
                    {d.weaverPhone && (
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{d.weaverPhone}</div>
                    )}
                  </td>

                  <td>
                    <div style={{ fontWeight: 600, color: "#334155" }}>{d.fabricName}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {[d.warpColor, d.weftColor, d.design].filter(Boolean).join(" · ")}
                    </div>
                  </td>

                  <td>
                    <span
                      style={{
                        background:
                          d.status === "in_progress"
                            ? "#e0f2fe"
                            : d.status === "returned"
                            ? "#fef3c7"
                            : d.status === "reconciled"
                            ? "#dcfce7"
                            : d.status === "cancelled"
                            ? "#fee2e2"
                            : "#f1f5f9",
                        color:
                          d.status === "in_progress"
                            ? "#0369a1"
                            : d.status === "returned"
                            ? "#b45309"
                            : d.status === "reconciled"
                            ? "#15803d"
                            : d.status === "cancelled"
                            ? "#b91c1c"
                            : "#475569",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "capitalize",
                      }}
                    >
                      {d.status.replace("_", " ")}
                    </span>
                  </td>

                  <td>
                    <div>{d.yarn.issuedQuantity} kg</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {d.yarn.totalCost.toLocaleString()} ETB
                    </div>
                  </td>

                  <td>
                    <div>
                      <strong>{d.fabric.receivedQuantity}</strong> pcs ({d.fabric.totalWeight.toLocaleString()} g)
                    </div>
                    {d.fabric.receivedQuantity > 0 && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: isUnderweight ? "#dc2626" : "#15803d",
                          fontWeight: 600,
                        }}
                      >
                        Avg {d.fabric.averageWeight} g {isUnderweight ? `(std ${d.standardWeightG}g)` : "✓"}
                      </div>
                    )}
                  </td>

                  <td style={{ textAlign: "right" }}>
                    <span
                      style={{
                        fontWeight: 800,
                        color: d.netPayable >= 0 ? "#15803d" : "#b45309",
                      }}
                    >
                      {d.netPayable >= 0 ? `+${d.netPayable.toLocaleString()}` : d.netPayable.toLocaleString()} ETB
                    </span>
                    {d.fabric.deductionAmount > 0 && (
                      <div style={{ fontSize: "0.72rem", color: "#dc2626" }}>
                        -{d.fabric.deductionAmount.toLocaleString()} ded.
                      </div>
                    )}
                  </td>

                  <td style={{ fontSize: "0.82rem", color: "#475569" }}>
                    <div>Issued {formatDateDDMMYY(d.dateIssued)}</div>
                    {d.dateReturned && (
                      <div style={{ color: "#059669", fontWeight: 500 }}>
                        Ret. {formatDateDDMMYY(d.dateReturned)}
                      </div>
                    )}
                  </td>

                  <td>
                    {d.settlement ? (
                      <span
                        style={{
                          background: "#dcfce7",
                          color: "#15803d",
                          padding: "2px 7px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        Batch #{d.settlement.batchId}
                      </span>
                    ) : d.status === "returned" ? (
                      <span
                        style={{
                          background: "#fef3c7",
                          color: "#92400e",
                          padding: "2px 7px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        Ready to settle
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>—</span>
                    )}
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
