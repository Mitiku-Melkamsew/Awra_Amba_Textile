import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { reportsApi } from "../../api";
import type { HisabReport } from "../../api";
import { formatDateDDMMYY } from "../../utils/formatDate";

export function HisabPrintPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const [searchParams] = useSearchParams();
  const [report, setReport] = useState<HisabReport | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!paymentId) return;
    reportsApi
      .getHisab(Number(paymentId))
      .then((data) => {
        setReport(data);
        if (searchParams.get("print") === "1") {
          setTimeout(() => window.print(), 400);
        }
      })
      .catch((err) => setError(err.message));
  }, [paymentId, searchParams]);

  if (!report && !error) return <p className="muted">Loading HISAB...</p>;
  if (!report) return <p className="error">{error}</p>;

  const dataRows = report.rows.filter((r) => r.zigId || r.fabricType);

  return (
    <div className="hisab-print">
      <div className="no-print hisab-print-toolbar">
        <Link to="/admin/settlement">← Settlement</Link>
        <button type="button" onClick={() => window.print()}>
          Print
        </button>
        <button type="button" onClick={() => reportsApi.downloadHisabCsv(report.paymentId)}>
          Download CSV
        </button>
      </div>

      <header className="hisab-print-header">
        <p className="eyebrow">አውራ አምባ ቴክስታይል</p>
        <h1>HISAB — ሂሳብ ሪፖርት</h1>
        <p>
          ቀን / Date: <strong>{formatDateDDMMYY(report.paymentDate)}</strong>
        </p>
        <p>
          አሸጋይ / Weaver:{" "}
          <strong>
            {report.weaver.firstName} {report.weaver.lastName}
          </strong>{" "}
          (#{report.weaver.weaverId})
        </p>
        <p>
          ጠቅላላ / Total: <strong>{report.amount} ETB</strong>
        </p>
        <p className="hisab-amharic">{report.amharicAmountInWords}</p>
      </header>

      <table className="hisab-table">
        <thead>
          <tr>
            <th>Zig</th>
            <th>Fabric</th>
            <th>Qty</th>
            <th>Avg Wt</th>
            <th>Price</th>
            <th>Deduction</th>
            <th>Adj Price</th>
            <th>Subtotal</th>
            <th>Yarn Qty</th>
            <th>Yarn Total</th>
            <th>Net</th>
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, i) => (
            <tr key={i}>
              <td>{row.zigId}</td>
              <td>{row.fabricType}</td>
              <td>{row.fabricQty}</td>
              <td>{row.avgWeight}</td>
              <td>{row.basePrice}</td>
              <td>{row.deduction}</td>
              <td>{row.adjustedPrice}</td>
              <td>{row.lineSubtotal}</td>
              <td>{row.yarnQty}</td>
              <td>{row.yarnTotal}</td>
              <td>{row.netProfit}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="hisab-print-footer">
        <p>ፊርማ / Signature: _______________________</p>
      </footer>
    </div>
  );
}