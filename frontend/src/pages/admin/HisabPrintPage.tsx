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

  if (!report && !error)
    return (
      <div className="page">
        <div className="loading">
          <span>⏳</span> Loading official HISAB receipt…
        </div>
      </div>
    );
  if (!report)
    return (
      <div className="page">
        <div className="error-msg">
          <span>⚠️</span> {error}
        </div>
      </div>
    );

  const dataRows = report.rows.filter((r) => r.zigId || r.fabricType);

  return (
    <div
      className="hisab-print"
      style={{ maxWidth: 960, margin: "0 auto", padding: "2rem" }}
    >
      {/* On-screen Toolbar */}
      <div
        className="no-print hisab-print-toolbar"
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "1.75rem",
          alignItems: "center",
        }}
      >
        <Link to="/admin/reports" className="btn-ghost">
          ← Back to Reports
        </Link>
        <button
          type="button"
          className="btn-primary"
          onClick={() => window.print()}
        >
          🖨 Print / PDF Receipt
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => reportsApi.downloadHisabCsv(report.paymentId)}
        >
          ⬇ Download CSV Ledger
        </button>
      </div>

      <header
        className="hisab-print-header"
        style={{
          textAlign: "center",
          marginBottom: "1.75rem",
          borderBottom: "2px solid #333",
          paddingBottom: "1.25rem",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "#f5f5f5",
            padding: "0.2rem 0.8rem",
            borderRadius: "999px",
            fontSize: "11.5px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            marginBottom: "0.5rem",
          }}
        >
          አውራ አምባ ቴክስታይል ማህበር · AWRA AMBA TEXTILE COOPERATIVE
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "0.25rem 0" }}>
          HISAB — የሸማኔ ሂሳብ ደረሰኝ
        </h1>
        <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "13px" }}>
          Official Artisan Settlement Payment Receipt #{report.paymentId}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            marginTop: "1rem",
            fontSize: "13.5px",
            borderTop: "1px dashed #ccc",
            paddingTop: "0.75rem",
          }}
        >
          <div>
            ቀን / Date: <strong>{formatDateDDMMYY(report.paymentDate)}</strong>
          </div>
          <div>
            አሸጋይ / Artisan Weaver:{" "}
            <strong>
              {report.weaver.firstName} {report.weaver.lastName}
            </strong>{" "}
            (ID: #{report.weaver.weaverId})
          </div>
          <div>
            ጠቅላላ ክፍያ / Total Paid:{" "}
            <strong style={{ fontSize: "15px", color: "#166534" }}>
              {parseFloat(String(report.amount)).toLocaleString()} ETB
            </strong>
          </div>
        </div>

        <p
          className="hisab-amharic"
          style={{
            fontSize: "14.5px",
            fontWeight: 700,
            color: "#9A3412",
            marginTop: "0.75rem",
          }}
        >
          የብር መጠን በፊደል: {report.amharicAmountInWords}
        </p>
      </header>

      <table
        className="hisab-table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
          marginBottom: "2rem",
        }}
      >
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th
              style={{
                border: "1px solid #ccc",
                padding: "0.4rem 0.5rem",
                textAlign: "left",
              }}
            >
              Zig
            </th>
            <th
              style={{
                border: "1px solid #ccc",
                padding: "0.4rem 0.5rem",
                textAlign: "left",
              }}
            >
              Fabric
            </th>
            <th
              style={{
                border: "1px solid #ccc",
                padding: "0.4rem 0.5rem",
                textAlign: "right",
              }}
            >
              Qty
            </th>
            <th
              style={{
                border: "1px solid #ccc",
                padding: "0.4rem 0.5rem",
                textAlign: "right",
              }}
            >
              Avg Wt
            </th>
            <th
              style={{
                border: "1px solid #ccc",
                padding: "0.4rem 0.5rem",
                textAlign: "right",
              }}
            >
              Base Price
            </th>
            <th
              style={{
                border: "1px solid #ccc",
                padding: "0.4rem 0.5rem",
                textAlign: "right",
              }}
            >
              Deduction
            </th>
            <th
              style={{
                border: "1px solid #ccc",
                padding: "0.4rem 0.5rem",
                textAlign: "right",
              }}
            >
              Adj Price
            </th>
            <th
              style={{
                border: "1px solid #ccc",
                padding: "0.4rem 0.5rem",
                textAlign: "right",
              }}
            >
              Subtotal
            </th>
            <th
              style={{
                border: "1px solid #ccc",
                padding: "0.4rem 0.5rem",
                textAlign: "right",
              }}
            >
              Yarn (pieces)
            </th>
            <th
              style={{
                border: "1px solid #ccc",
                padding: "0.4rem 0.5rem",
                textAlign: "right",
              }}
            >
              Yarn Cost
            </th>
            <th
              style={{
                border: "1px solid #ccc",
                padding: "0.4rem 0.5rem",
                textAlign: "right",
              }}
            >
              Net Payout
            </th>
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, i) => (
            <tr key={i}>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "0.35rem 0.5rem",
                  fontWeight: 600,
                }}
              >
                {row.zigId}
              </td>
              <td
                style={{ border: "1px solid #ccc", padding: "0.35rem 0.5rem" }}
              >
                {row.fabricType}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "0.35rem 0.5rem",
                  textAlign: "right",
                }}
              >
                {row.fabricQty}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "0.35rem 0.5rem",
                  textAlign: "right",
                }}
              >
                {row.avgWeight}g
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "0.35rem 0.5rem",
                  textAlign: "right",
                }}
              >
                {row.basePrice}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "0.35rem 0.5rem",
                  textAlign: "right",
                  color: Number(row.deduction) > 0 ? "#DC2626" : undefined,
                }}
              >
                {Number(row.deduction) > 0 ? `-${row.deduction}` : "—"}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "0.35rem 0.5rem",
                  textAlign: "right",
                }}
              >
                {row.adjustedPrice}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "0.35rem 0.5rem",
                  textAlign: "right",
                }}
              >
                {row.lineSubtotal}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "0.35rem 0.5rem",
                  textAlign: "right",
                }}
              >
                {row.yarnQty}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "0.35rem 0.5rem",
                  textAlign: "right",
                }}
              >
                {row.yarnTotal}
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "0.35rem 0.5rem",
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                {row.netProfit} ETB
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signature and Verification Footer */}
      <footer
        className="hisab-print-footer"
        style={{
          marginTop: "2.5rem",
          borderTop: "1px solid #333",
          paddingTop: "1.5rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "2rem",
            textAlign: "center",
            fontSize: "12.5px",
          }}
        >
          <div>
            <p style={{ margin: "0 0 2rem", fontWeight: 700 }}>
              ክፍያውን ያዘጋጀው / Prepared by
            </p>
            <p
              style={{
                borderTop: "1px dashed #666",
                paddingTop: "0.35rem",
                margin: 0,
              }}
            >
              ፊርማ / Signature
            </p>
          </div>
          <div>
            <p style={{ margin: "0 0 2rem", fontWeight: 700 }}>
              የገንዘብ ከፋይ / Cashier
            </p>
            <p
              style={{
                borderTop: "1px dashed #666",
                paddingTop: "0.35rem",
                margin: 0,
              }}
            >
              ፊርማ / Signature
            </p>
          </div>
          <div>
            <p style={{ margin: "0 0 2rem", fontWeight: 700 }}>
              የተቀባዩ ፊርማ / Artisan Receiver
            </p>
            <p
              style={{
                borderTop: "1px dashed #666",
                paddingTop: "0.35rem",
                margin: 0,
              }}
            >
              ፊርማ / Signature
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HisabPrintPage;
