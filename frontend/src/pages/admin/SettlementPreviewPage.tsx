import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { calculationsApi } from "../../api";
import { formatDateDDMMYY } from "../../utils/formatDate";

interface PreviewData {
  previewId: string;
  status: string;
  weaverCount: number;
  grandTotal: number;
  amharicAmountInWords: string;
  generatedAt: string;
  weavers: Array<{
    weaverId: number;
    weaverName: string;
    netSettlement: number;
    zigIds: string[];
    zigDetails: Array<{
      zigId: string;
      returns: Array<{
        returnId: number;
        fabricType: string;
        quantityReturned: number;
        avgWeight: number;
        unitPrice: number;
        netCredit: number;
      }>;
      yarnQty: number;
      yarnTotal: number;
      netProfit: number;
    }>;
  }>;
}

export function SettlementPreviewPage() {
  const { previewId } = useParams<{ previewId: string }>();
  const [data, setData] = useState<PreviewData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!previewId) return;
    calculationsApi
      .getSettlementPreview(previewId)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [previewId]);

  if (!data && !error) return <p className="muted">Loading...</p>;
  if (!data) return <p className="error">{error}</p>;

  return (
    <div className="hisab-print">
      <div className="no-print hisab-print-toolbar">
        <Link to="/admin/settlement">← Settlement</Link>
        <button type="button" onClick={() => window.print()}>
          Print / PDF
        </button>
        <button type="button" onClick={() => calculationsApi.downloadPreviewCsv(data.previewId)}>
          Download CSV
        </button>
      </div>

      <header className="hisab-print-header">
        <h2>Settlement Preview — {data.previewId}</h2>
        <p className="muted">
          Generated {formatDateDDMMYY(data.generatedAt)} · Status: {data.status}
        </p>
        <p>
          <strong>{data.weaverCount}</strong> weavers · <strong>{data.grandTotal}</strong> ETB
        </p>
        <p className="hisab-amharic">{data.amharicAmountInWords}</p>
        <p className="muted">
          Share this with weavers to confirm before recording settlements.
        </p>
      </header>

      {data.weavers.map((weaver) => (
        <section key={weaver.weaverId} style={{ marginBottom: "2rem" }}>
          <h3>
            {weaver.weaverName} — {weaver.netSettlement} ETB
          </h3>
          <p className="muted">Zigs: {weaver.zigIds.join(", ")}</p>
          <table className="hisab-table">
            <thead>
              <tr>
                <th>Zig</th>
                <th>Return</th>
                <th>Fabric</th>
                <th>Qty</th>
                <th>Avg wt</th>
                <th>Price</th>
                <th>Net</th>
                <th>Yarn qty</th>
                <th>Yarn total</th>
                <th>Zig profit</th>
              </tr>
            </thead>
            <tbody>
              {weaver.zigDetails.flatMap((zig) =>
                zig.returns.length > 0
                  ? zig.returns.map((ret) => (
                      <tr key={`${zig.zigId}-${ret.returnId}`}>
                        <td>{zig.zigId}</td>
                        <td>{ret.returnId}</td>
                        <td>{ret.fabricType}</td>
                        <td>{ret.quantityReturned}</td>
                        <td>{ret.avgWeight.toFixed(2)}</td>
                        <td>{ret.unitPrice}</td>
                        <td>{ret.netCredit}</td>
                        <td>{zig.yarnQty}</td>
                        <td>{zig.yarnTotal.toFixed(2)}</td>
                        <td>{zig.netProfit.toFixed(2)}</td>
                      </tr>
                    ))
                  : [
                      <tr key={zig.zigId}>
                        <td>{zig.zigId}</td>
                        <td colSpan={6} className="muted">
                          No returns
                        </td>
                        <td>{zig.yarnQty}</td>
                        <td>{zig.yarnTotal.toFixed(2)}</td>
                        <td>{zig.netProfit.toFixed(2)}</td>
                      </tr>,
                    ],
              )}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}