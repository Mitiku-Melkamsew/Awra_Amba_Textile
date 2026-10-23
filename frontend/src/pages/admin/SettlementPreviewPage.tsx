import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { calculationsApi, reportsApi } from "../../api";
import { formatDateDDMMYY } from "../../utils/formatDate";

// One displayed line = all returns of the same fabric type in the zig, merged by the server.
interface ReturnLine {
  returnIds: number[];
  fabricType: string;
  quantityReturned: number;
  avgWeight: number;
  unitPrice: number;
  deductionPerPiece: number;
  adjustedPrice: number;
  lineSubtotal: number;
}

interface ZigDetail {
  zigId: string;
  groupedReturns: ReturnLine[];
  yarnQty: number;
  yarnTotal: number;
  yarnAvgPrice: number;
  fabricTotal: number;
  netProfit: number;
}

interface WeaverDetail {
  weaverId: number;
  weaverName: string;
  netSettlement: number;
  zigIds: string[];
  zigDetails: ZigDetail[];
}

interface PreviewData {
  previewId: string;
  status: string;
  weaverCount: number;
  grandTotal: number;
  amharicAmountInWords: string;
  generatedAt: string;
  cutoffDate?: string | null;
  weavers: WeaverDetail[];
}

export function SettlementPreviewPage() {
  const { previewId } = useParams<{ previewId: string }>();
  const [data, setData] = useState<PreviewData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!previewId) return;
    calculationsApi
      .getSettlementPreview(previewId)
      .then((d) => setData(d as unknown as PreviewData))
      .catch((err) => setError(err.message));
  }, [previewId]);

  if (!data && !error) return <div className="page"><p className="muted">Loading master payroll document…</p></div>;
  if (!data) return <div className="page"><div className="error-msg"><span>⚠️</span> {error}</div></div>;

  let grandFabricQty = 0;
  let grandFabricValue = 0;
  let grandYarnQty = 0;
  let grandYarnTotal = 0;
  let grandNetProfit = 0;

  for (const w of data.weavers) {
    for (const z of w.zigDetails) {
      for (const r of z.groupedReturns) {
        grandFabricQty += r.quantityReturned;
      }
      grandFabricValue += Math.round(z.fabricTotal);
      grandYarnQty += z.yarnQty;
      grandYarnTotal += Math.round(z.yarnTotal);
      grandNetProfit += Math.round(z.netProfit);
    }
  }

  return (
    <div className="hisab-print" style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem" }}>
      {/* Toolbar (hidden on print) */}
      <div className="no-print hisab-print-toolbar">
        <Link to="/admin/settlement">← Settlement</Link>
        <button type="button" onClick={() => window.print()}>Print / PDF</button>
        <button
          type="button"
          onClick={() => calculationsApi.downloadPreviewCsv(data.previewId)}
        >
          Download Master CSV
        </button>
        {data.status === "committed" && (
          <button
            type="button"
            onClick={() => reportsApi.downloadBatchHisabCsv(data.previewId)}
          >
            Download Final CSV
          </button>
        )}
      </div>

      {/* Header */}
      <header className="hisab-print-header" style={{ borderBottom: "2px solid var(--border-strong)", paddingBottom: "1rem", marginBottom: "1rem" }}>
        <p className="eyebrow">የአውራ አምባ ማህበረሰብ የሸማ ክፍያ ዝርዝር</p>
        <h1 style={{ fontSize: 24, margin: "0.25rem 0" }}>Awra Amba Textile — Master Weaver Payroll</h1>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", fontSize: 13.5, marginTop: "0.5rem" }}>
          <p style={{ margin: 0 }}>ቀን / Date: <strong>{formatDateDDMMYY(data.generatedAt)}</strong></p>
          {data.cutoffDate && (
            <p style={{ margin: 0 }}>Cutoff (የማጣሪያ ቀን): <strong>{formatDateDDMMYY(data.cutoffDate)}</strong></p>
          )}
          <p style={{ margin: 0 }}>Reference: <code>{data.previewId}</code> ({data.status})</p>
          <p style={{ margin: 0 }}>አሸጋዮች / Weavers: <strong>{data.weaverCount}</strong></p>
          <p style={{ margin: 0 }}>ጠቅላላ ክፍያ / Grand Total: <strong>{Math.round(data.grandTotal)} ETB</strong></p>
        </div>
        <p className="hisab-amharic" style={{ fontSize: 15, fontWeight: 600, color: "var(--accent)", marginTop: "0.5rem" }}>
          {data.amharicAmountInWords}
        </p>
      </header>

      {/* Unified Master Table */}
      <div style={{ overflowX: "auto" }}>
        <table className="hisab-table" style={{ fontSize: 12, width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg)", borderBottom: "2px solid var(--border-strong)" }}>
              <th>ID</th>
              <th>አሸጋይ / Weaver</th>
              <th>Zig</th>
              <th>ጨርቅ / Fabric</th>
              <th style={{ textAlign: "right" }}>Qty</th>
              <th style={{ textAlign: "right" }}>Avg Wt</th>
              <th style={{ textAlign: "right" }}>Price</th>
              <th style={{ textAlign: "right" }}>Deduct</th>
              <th style={{ textAlign: "right" }}>Adj Price</th>
              <th style={{ textAlign: "right" }}>Subtotal</th>
              <th style={{ textAlign: "right" }}>Fabric Total</th>
              <th style={{ textAlign: "right" }}>Yarn Qty</th>
              <th style={{ textAlign: "right" }}>Yarn Avg</th>
              <th style={{ textAlign: "right" }}>Yarn Total</th>
              <th style={{ textAlign: "right" }}>Net Profit</th>
              <th style={{ textAlign: "right" }}>Weaver Total</th>
            </tr>
          </thead>
          <tbody>
            {data.weavers.flatMap((weaver) => {
              const weaverTotal = Math.round(weaver.netSettlement);
              let firstWeaverRow = true;

              return weaver.zigDetails.flatMap((zig) => {
                const zigFabricTotal = Math.round(zig.fabricTotal);
                const zigYarnQty = zig.yarnQty;
                const zigYarnTotal = Math.round(zig.yarnTotal);
                const zigYarnAvg = zig.yarnQty > 0 ? Math.round(zig.yarnTotal / zig.yarnQty) : 0;
                const zigNetProfit = Math.round(zig.netProfit);

                const lines = zig.groupedReturns.length > 0 ? zig.groupedReturns : [null];
                let firstZigRow = true;

                return lines.map((ret, idx) => {
                  const adjustedPrice = ret ? ret.adjustedPrice : "";
                  const lineSubtotal = ret ? Math.round(ret.lineSubtotal) : "";
                  const avgWt = ret ? ret.avgWeight : "";

                  const showWeaver = firstWeaverRow;
                  const showZig = firstZigRow;
                  firstWeaverRow = false;
                  firstZigRow = false;

                  return (
                    <tr
                      key={`${weaver.weaverId}-${zig.zigId}-${ret ? ret.returnIds[0] : `empty-${idx}`}`}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <td>{showWeaver ? weaver.weaverId : ""}</td>
                      <td style={{ fontWeight: showWeaver ? 600 : 400 }}>{showWeaver ? weaver.weaverName : ""}</td>
                      <td>{showZig ? zig.zigId : ""}</td>
                      <td>{ret ? ret.fabricType : ""}</td>
                      <td style={{ textAlign: "right" }}>{ret ? ret.quantityReturned : ""}</td>
                      <td style={{ textAlign: "right" }}>{avgWt}</td>
                      <td style={{ textAlign: "right" }}>{ret ? ret.unitPrice : ""}</td>
                      <td style={{ textAlign: "right", color: ret && ret.deductionPerPiece > 0 ? "var(--red)" : undefined }}>
                        {ret && ret.deductionPerPiece > 0 ? ret.deductionPerPiece : (ret ? "—" : "")}
                      </td>
                      <td style={{ textAlign: "right" }}>{ret ? adjustedPrice : ""}</td>
                      <td style={{ textAlign: "right" }}>{ret ? lineSubtotal : ""}</td>
                      <td style={{ textAlign: "right", fontWeight: showZig ? 600 : 400 }}>{showZig ? zigFabricTotal : ""}</td>
                      <td style={{ textAlign: "right" }}>{showZig ? zigYarnQty : ""}</td>
                      <td style={{ textAlign: "right" }}>{showZig ? zigYarnAvg : ""}</td>
                      <td style={{ textAlign: "right" }}>{showZig ? zigYarnTotal : ""}</td>
                      <td style={{ textAlign: "right", fontWeight: showZig ? 600 : 400 }}>{showZig ? zigNetProfit : ""}</td>
                      <td style={{ textAlign: "right", fontWeight: showWeaver ? 700 : 400, color: showWeaver ? "var(--accent)" : undefined }}>
                        {showWeaver ? weaverTotal : ""}
                      </td>
                    </tr>
                  );
                });
              });
            })}

            {/* Spacer */}
            <tr><td colSpan={16} style={{ height: "1rem" }}></td></tr>

            {/* Grand Totals */}
            <tr style={{ fontWeight: 700, borderTop: "2px solid var(--border-strong)", borderBottom: "2px solid var(--border-strong)", background: "var(--bg)" }}>
              <td></td>
              <td>ድምር / Grand Total</td>
              <td></td>
              <td></td>
              <td style={{ textAlign: "right" }}>{grandFabricQty}</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td style={{ textAlign: "right" }}>{grandFabricValue}</td>
              <td style={{ textAlign: "right" }}>{grandYarnQty}</td>
              <td></td>
              <td style={{ textAlign: "right" }}>{grandYarnTotal}</td>
              <td style={{ textAlign: "right" }}>{grandNetProfit}</td>
              <td style={{ textAlign: "right" }}>{grandNetProfit}</td>
            </tr>

            {/* Amharic Text Row */}
            <tr>
              <td colSpan={16} style={{ padding: "0.875rem 0.5rem", fontWeight: 700, fontSize: 13.5 }}>
                ጠቅላላ ተከፋይ {data.amharicAmountInWords} ብር
              </td>
            </tr>

            {/* Spacers for signature */}
            <tr><td colSpan={16} style={{ height: "1.5rem" }}></td></tr>

            {/* Signature Block */}
            <tr style={{ fontWeight: 600 }}>
              <td></td>
              <td>ክፍያውን ያዘጋጀው</td>
              <td colSpan={2}>የገንዘብ ከፋይ</td>
              <td colSpan={3}>ክፍያውን ያጸደቀው</td>
              <td colSpan={9}></td>
            </tr>
            <tr style={{ height: "2.5rem" }}>
              <td>ስም</td>
              <td style={{ borderBottom: "1px dashed var(--border-strong)" }}></td>
              <td colSpan={2} style={{ borderBottom: "1px dashed var(--border-strong)" }}></td>
              <td colSpan={3} style={{ borderBottom: "1px dashed var(--border-strong)" }}></td>
              <td colSpan={9}></td>
            </tr>
            <tr style={{ height: "2.5rem" }}>
              <td>ፊርማ</td>
              <td style={{ borderBottom: "1px dashed var(--border-strong)" }}></td>
              <td colSpan={2} style={{ borderBottom: "1px dashed var(--border-strong)" }}></td>
              <td colSpan={3} style={{ borderBottom: "1px dashed var(--border-strong)" }}></td>
              <td colSpan={9}></td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer className="hisab-print-footer" style={{ marginTop: "2rem", borderTop: "1px solid var(--border)", paddingTop: "0.5rem", fontSize: 11, color: "var(--text-muted)" }}>
        <p>Awra Amba Textile Community &middot; Consolidated Payroll Document &middot; {data.previewId}</p>
      </footer>
    </div>
  );
}