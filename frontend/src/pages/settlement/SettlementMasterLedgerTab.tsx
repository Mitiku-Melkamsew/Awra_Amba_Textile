import type { ZigLedgerItem } from "../../domain/models";

export interface SettlementMasterLedgerTabProps {
  ledgerStatus: string;
  setLedgerStatus: (val: string) => void;
  ledgerData: ZigLedgerItem[];
  ledgerLoading: boolean;
}

const LEDGER_STATUSES = [
  { key: "all", label: "All Zigs" },
  { key: "ongoing", label: "Ongoing (WIP)" },
  { key: "returned", label: "Returned (Ready)" },
  { key: "reconciled", label: "Settled / Paid" },
];

export function SettlementMasterLedgerTab({
  ledgerStatus,
  setLedgerStatus,
  ledgerData,
  ledgerLoading,
}: SettlementMasterLedgerTabProps) {
  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h3 className="section-title" style={{ margin: 0 }}>
            Master Work Orders (Zigs) Ledger
          </h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "13px", color: "var(--color-text-muted, #64748b)" }}>
            Track the production lifecycle, yarn issued, fabric delivered, and payment status of all zigs.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.4rem" }}>
          {LEDGER_STATUSES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setLedgerStatus(s.key)}
              className={`btn btn-sm ${ledgerStatus === s.key ? "btn-primary" : "btn-secondary"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {ledgerLoading ? (
        <p className="muted">Loading zigs ledger…</p>
      ) : ledgerData.length === 0 ? (
        <p className="muted">No work orders match the selected filter.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Zig ID</th>
                <th>Weaver</th>
                <th>Fabric Specification</th>
                <th>Status</th>
                <th>Yarn (Issued / Ret / Net)</th>
                <th>Fabric (Recv / Def / Billable)</th>
                <th style={{ textAlign: "right" }}>Settlement Status</th>
              </tr>
            </thead>
            <tbody>
              {ledgerData.map((zig) => (
                <tr key={zig.zigId}>
                  <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{zig.zigId}</td>
                  <td>
                    <strong>{zig.weaverName}</strong>
                    {zig.weaverPhone && (
                      <div style={{ fontSize: "11px", color: "var(--color-text-muted, #64748b)" }}>
                        {zig.weaverPhone}
                      </div>
                    )}
                  </td>
                  <td>
                    <strong>{zig.fabricName}</strong> ({zig.standardWeightG}g)
                    {(zig.warpColor || zig.weftColor) && (
                      <div style={{ fontSize: "11px", color: "var(--color-text-muted, #64748b)" }}>
                        {zig.warpColor && `Warp: ${zig.warpColor}`} · {zig.weftColor && `Weft: ${zig.weftColor}`}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        zig.status === "reconciled"
                          ? "badge--success"
                          : zig.status === "returned"
                          ? "badge--warning"
                          : "badge--neutral"
                      }`}
                    >
                      {zig.status}
                    </span>
                  </td>
                  <td>
                    <div>
                      {zig.yarn.issuedQuantity} issued / {zig.yarn.returnedQuantity} ret ={" "}
                      <strong>{zig.yarn.netQuantity} net</strong>
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--color-text-muted, #64748b)" }}>
                      Cost: {zig.yarn.totalCost.toLocaleString()} ETB
                    </div>
                  </td>
                  <td>
                    <div>
                      {zig.fabric.receivedQuantity} recv / {zig.fabric.defectiveQuantity} def ={" "}
                      <strong>{zig.fabric.billableQuantity} pcs</strong>
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--color-text-muted, #64748b)" }}>
                      Avg Weight: {zig.fabric.averageWeight}g
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {zig.settlement ? (
                      <div>
                        <span className="badge badge--success">Batch #{zig.settlement.batchId}</span>
                        <div style={{ fontWeight: 700, marginTop: "0.2rem" }}>
                          {zig.settlement.amount?.toLocaleString()} ETB
                        </div>
                      </div>
                    ) : zig.status === "returned" ? (
                      <span className="badge badge--warning">Ready to Settle</span>
                    ) : (
                      <span style={{ fontSize: "12px", color: "var(--color-text-muted, #64748b)" }}>In Progress</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
