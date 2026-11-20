export interface WeaverBreakdownRowProps {
  weaver: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function WeaverBreakdownRow({
  weaver,
  isExpanded,
  onToggleExpand,
}: WeaverBreakdownRowProps) {
  const yarnTotalCost = weaver.yarnDebits.reduce((sum: number, y: any) => sum + y.cost, 0);

  return (
    <>
      <tr>
        <td style={{ fontWeight: 600 }}>{weaver.weaverName}</td>
        <td>{weaver.zigIds.join(", ")}</td>
        <td style={{ textAlign: "right" }}>{weaver.returnCount} pcs</td>
        <td style={{ textAlign: "right" }}>
          {yarnTotalCost.toLocaleString()} ETB
        </td>
        <td style={{ textAlign: "right", fontWeight: 700, color: "var(--color-success, #16a34a)" }}>
          {Math.round(weaver.netSettlement).toLocaleString()} ETB
        </td>
        <td>
          {weaver.isBlocked ? (
            <span className="badge badge-danger">Blocked</span>
          ) : (
            <span className="badge badge-success">Valid</span>
          )}
        </td>
        <td style={{ textAlign: "right" }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: "0.25rem 0.5rem", fontSize: "12px" }}
            onClick={onToggleExpand}
          >
            {isExpanded ? "Hide Lines ▲" : "View Lines ▼"}
          </button>
        </td>
      </tr>

      {/* Expanded Lines View: Fabric Lines and Yarn Lines */}
      {isExpanded && (
        <tr>
          <td colSpan={7} style={{ background: "var(--color-surface-subtle, #f8fafc)", padding: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
              {/* Fabric Lines */}
              <div>
                <h4 style={{ margin: "0 0 0.5rem", fontSize: "14px", fontWeight: 700, color: "var(--color-text, #0f172a)" }}>
                  📦 Fabric Lines / የተረከብነው ጨርቅ (Earnings)
                </h4>
                <div className="table-wrap">
                  <table style={{ background: "var(--color-surface, #ffffff)", fontSize: "12.5px" }}>
                    <thead>
                      <tr>
                        <th>Zig ID</th>
                        <th>Received Pcs</th>
                        <th>Defective (Returned)</th>
                        <th>Billable Pcs</th>
                        <th>Avg Weight (g)</th>
                        <th>Rate (ETB)</th>
                        <th>Penalty / Pc</th>
                        <th>Net Fabric Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weaver.lineItems.map((li: any) => (
                        <tr key={li.returnId}>
                          <td>{li.zigId}</td>
                          <td>{li.quantityReturned ?? li.quantity}</td>
                          <td>{li.excludedQuantity ?? 0}</td>
                          <td style={{ fontWeight: 600 }}>{li.quantity}</td>
                          <td>{li.avgWeight}g</td>
                          <td>{li.unitPrice}</td>
                          <td style={{ color: li.deductionPerPiece > 0 ? "var(--color-danger, #dc2626)" : "inherit" }}>
                            {li.deductionPerPiece > 0 ? `-${li.deductionPerPiece}` : "0"}
                          </td>
                          <td style={{ fontWeight: 700 }}>{li.netCredit.toLocaleString()} ETB</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Yarn Lines */}
              <div>
                <h4 style={{ margin: "0 0 0.5rem", fontSize: "14px", fontWeight: 700, color: "var(--color-text, #0f172a)" }}>
                  🧶 Yarn Lines / የተሰጠ ክር ወጪ (Material Debits)
                </h4>
                {weaver.yarnDebits.length > 0 ? (
                  <div className="table-wrap">
                    <table style={{ background: "var(--color-surface, #ffffff)", fontSize: "12.5px" }}>
                      <thead>
                        <tr>
                          <th>Zig ID</th>
                          <th>Yarn Debit Ref</th>
                          <th style={{ textAlign: "right" }}>Total Yarn Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weaver.yarnDebits.map((yd: any, idx: number) => (
                          <tr key={idx}>
                            <td>{yd.zigId}</td>
                            <td>Yarn Given #{yd.yarnGivenId}</td>
                            <td style={{ textAlign: "right", color: "var(--color-danger, #dc2626)", fontWeight: 600 }}>
                              -{yd.cost.toLocaleString()} ETB
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted, #64748b)" }}>
                    No yarn debited for this settlement.
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
