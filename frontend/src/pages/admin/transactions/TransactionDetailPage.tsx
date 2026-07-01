import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { transactionsApi, type CommercialTransaction } from "../../../api";
import { formatDateDDMMYY } from "../../../utils/formatDate";
import { TXN_STATUS_LABELS, TXN_TYPE_LABELS } from "../../../utils/transactionTypes";

function lineLabel(line: CommercialTransaction["lines"][0]): string {
  if (line.yarnVariant) {
    const v = line.yarnVariant;
    return [v.yarnType?.materialName, v.color?.name, v.supplier?.name, v.sku]
      .filter(Boolean)
      .join(" · ");
  }
  if (line.fabricVariant) {
    const v = line.fabricVariant;
    return [v.product.name, v.sku].filter(Boolean).join(" · ");
  }
  return line.description ?? "Line";
}

export function TransactionDetailPage() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const [txn, setTxn] = useState<CommercialTransaction | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!transactionId) return;
    setTxn(await transactionsApi.get(transactionId));
  }, [transactionId]);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  const balance =
    txn ? Math.max(0, Number(txn.totalAmount) - Number(txn.amountPaid)) : 0;
  const isStockTxn = txn && txn.type !== "weaver_payout";
  const fullyDelivered =
    txn &&
    isStockTxn &&
    txn.lines.every((l) => Number(l.deliveredQuantity) >= Number(l.quantity));

  async function handleDeliver() {
    if (!transactionId) return;
    setBusy(true);
    setError("");
    try {
      await transactionsApi.deliver(transactionId);
      setMessage("Delivery recorded. Stock updated.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delivery failed");
    } finally {
      setBusy(false);
    }
  }

  async function handlePayment(event: FormEvent) {
    event.preventDefault();
    if (!transactionId || !payAmount) return;
    setBusy(true);
    setError("");
    try {
      await transactionsApi.addPayment(transactionId, {
        amount: Number(payAmount),
        paymentMethod: payMethod || undefined,
        notes: payNotes || undefined,
      });
      setMessage("Payment recorded.");
      setPayAmount("");
      setPayMethod("");
      setPayNotes("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!transactionId || !confirm("Cancel this transaction?")) return;
    setBusy(true);
    try {
      await transactionsApi.cancel(transactionId);
      setMessage("Transaction cancelled.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setBusy(false);
    }
  }

  if (!txn && !error) return <p className="muted">Loading...</p>;
  if (!txn) return <p className="error">{error}</p>;

  return (
    <section>
      <p>
        <Link to="/admin/transactions">← Transactions</Link>
      </p>

      <header className="zig-detail-header">
        <div>
          <h2>{txn.transactionId}</h2>
          <p className="muted">
            {TXN_TYPE_LABELS[txn.type]} · {formatDateDDMMYY(txn.createdAt)}
          </p>
          {txn.notes && <p className="muted">{txn.notes}</p>}
        </div>
        <span className={`badge ${txn.status}`}>
          {TXN_STATUS_LABELS[txn.status] ?? txn.status}
        </span>
      </header>

      <div className="grid" style={{ marginTop: "1rem" }}>
        <div className="card">
          <h3>Summary</h3>
          <p>
            Total: <strong>{txn.totalAmount}</strong>
          </p>
          <p>
            Paid: <strong>{txn.amountPaid}</strong>
          </p>
          <p>
            Balance: <strong>{balance.toFixed(2)}</strong>
          </p>
          {txn.deliveredAt && (
            <p className="muted">Delivered: {formatDateDDMMYY(txn.deliveredAt)}</p>
          )}
          {txn.type === "weaver_payout" && txn.linkedPaymentId && (
            <p className="muted">Settlement payment #{txn.linkedPaymentId}</p>
          )}
        </div>

        <div className="card">
          <h3>Lines ({txn.lines.length})</h3>
          <ul className="record-list">
            {txn.lines.map((line) => (
              <li key={line.lineId}>
                <strong>{lineLabel(line)}</strong>
                <span>
                  {line.quantity} @ {line.unitPrice}
                  {isStockTxn &&
                    ` · delivered ${line.deliveredQuantity}/${line.quantity}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {isStockTxn && txn.status !== "cancelled" && txn.status !== "completed" && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h3>Delivery</h3>
          <p className="muted">
            Confirm delivery to update stock. Payment can be recorded before or after.
          </p>
          {!fullyDelivered ? (
            <button
              type="button"
              className="btn-primary"
              onClick={handleDeliver}
              disabled={busy}
            >
              Mark all delivered
            </button>
          ) : (
            <p className="success">All lines delivered.</p>
          )}
        </div>
      )}

      {txn.type !== "weaver_payout" &&
        txn.status !== "cancelled" &&
        txn.status !== "completed" && (
          <form className="card form" style={{ marginTop: "1rem" }} onSubmit={handlePayment}>
            <h3>Record payment / installment</h3>
            <p className="muted">References {txn.transactionId}</p>
            <div className="form-row">
              <label>
                Amount
                <input
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={balance > 0 ? String(balance) : ""}
                  required
                />
              </label>
              <label>
                Method
                <input value={payMethod} onChange={(e) => setPayMethod(e.target.value)} />
              </label>
            </div>
            <label>
              Notes
              <input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
            </label>
            <button type="submit" className="btn-primary" disabled={busy}>
              Add payment
            </button>
          </form>
        )}

      {txn.payments.length > 0 && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h3>Payments ({txn.payments.length})</h3>
          <ul className="record-list">
            {txn.payments.map((p) => (
              <li key={p.installmentId}>
                <strong>
                  {p.amount} {p.paymentMethod ? `· ${p.paymentMethod}` : ""}
                </strong>
                <span>{formatDateDDMMYY(p.paymentDate)}</span>
                {p.notes && <em className="muted">{p.notes}</em>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {txn.status !== "completed" && txn.status !== "cancelled" && (
        <button
          type="button"
          className="btn-secondary"
          style={{ marginTop: "1rem" }}
          onClick={handleCancel}
          disabled={busy}
        >
          Cancel transaction
        </button>
      )}

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}