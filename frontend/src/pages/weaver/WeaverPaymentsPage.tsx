import { useEffect, useState } from "react";
import { reportsApi, weaverPortalApi } from "../../api";

interface PaymentRow {
  paymentId: number;
  amount: string;
  paymentDate: string;
  paymentMethod: string | null;
}

export function WeaverPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    weaverPortalApi
      .payments()
      .then(setPayments)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section className="weaver-page">
      <h2>Payment History</h2>
      <p className="muted">Settled payments and downloadable HISAB reports.</p>

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Payment</th>
              <th>Date</th>
              <th>Method</th>
              <th>Amount (ETB)</th>
              <th>Report</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.paymentId}>
                <td>#{payment.paymentId}</td>
                <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                <td>{payment.paymentMethod ?? "—"}</td>
                <td>{payment.amount}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => reportsApi.downloadHisabCsv(payment.paymentId)}
                  >
                    HISAB CSV
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && (
          <p className="muted">No payments yet. Completed work will appear here after admin settlement.</p>
        )}
      </div>

      {error && <p className="error">{error}</p>}
    </section>
  );
}