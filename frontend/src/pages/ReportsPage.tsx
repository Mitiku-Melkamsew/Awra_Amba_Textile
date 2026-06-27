import { useEffect, useState } from "react";
import { paymentsApi, reportsApi } from "../api";

interface Payment {
  paymentId: number;
  amount: string;
  paymentDate: string;
  weaver: { firstName: string; lastName: string };
}

export function ReportsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    paymentsApi
      .list()
      .then(setPayments)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section>
      <h2>HISAB Reports</h2>
      <p className="muted">Download settlement reports for committed payments.</p>

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Payment</th>
              <th>Weaver</th>
              <th>Date</th>
              <th>Amount (ETB)</th>
              <th>Download</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.paymentId}>
                <td>#{payment.paymentId}</td>
                <td>
                  {payment.weaver.firstName} {payment.weaver.lastName}
                </td>
                <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
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
        {payments.length === 0 && <p className="muted">No payments yet.</p>}
      </div>

      {error && <p className="error">{error}</p>}
    </section>
  );
}