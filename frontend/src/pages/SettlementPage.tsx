import { useEffect, useState } from "react";
import { calculationsApi, reportsApi, weaversApi } from "../api";
import type { SettlementPreview, Weaver } from "../api";

export function SettlementPage() {
  const [weavers, setWeavers] = useState<Weaver[]>([]);
  const [weaverId, setWeaverId] = useState("");
  const [returnIds, setReturnIds] = useState<number[]>([]);
  const [yarnGivenIds, setYarnGivenIds] = useState<number[]>([]);
  const [preview, setPreview] = useState<SettlementPreview | null>(null);
  const [message, setMessage] = useState("");
  const [lastPaymentId, setLastPaymentId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    weaversApi
      .list()
      .then((list) => {
        setWeavers(list);
        if (list[0]) setWeaverId(String(list[0].weaverId));
      })
      .catch((err) => setError(err.message));
  }, []);

  async function loadUnsettled() {
    if (!weaverId) return;
    setError("");
    const data = await weaversApi.unsettled(Number(weaverId));
    setReturnIds(
      (data.returns as Array<{ returnId: number }>).map((row) => row.returnId),
    );
    setYarnGivenIds(
      (data.yarnGiven as Array<{ yarnGivenId: number }>).map((row) => row.yarnGivenId),
    );
  }

  async function handlePreview() {
    setError("");
    setMessage("");
    try {
      const result = await calculationsApi.previewSettlement({
        weaverId: Number(weaverId),
        returnIds,
        yarnGivenIds,
        saleIds: [],
      });
      setPreview(result);
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "Preview failed");
    }
  }

  async function handleCommit() {
    setError("");
    setMessage("");
    try {
      const result = await calculationsApi.commitSettlement({
        weaverId: Number(weaverId),
        returnIds,
        yarnGivenIds,
        saleIds: [],
        paymentMethod: "Cash",
      });
      setLastPaymentId(result.paymentId);
      setMessage(
        `Payment #${result.paymentId} committed: ${result.amount} ETB (${result.amharicAmountInWords})`,
      );
      setPreview(null);
      await loadUnsettled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commit failed");
    }
  }

  return (
    <section>
      <h2>Settlement</h2>
      <p className="muted">Preview and commit monthly weaver payments.</p>

      <div className="card form">
        <label>
          Weaver
          <select value={weaverId} onChange={(e) => setWeaverId(e.target.value)}>
            {weavers.map((weaver) => (
              <option key={weaver.weaverId} value={weaver.weaverId}>
                {weaver.firstName} {weaver.lastName}
              </option>
            ))}
          </select>
        </label>
        <div className="button-row">
          <button type="button" onClick={loadUnsettled}>
            Load Unsettled Items
          </button>
          <button type="button" onClick={handlePreview}>
            Preview Settlement
          </button>
          <button type="button" onClick={handleCommit} disabled={!preview}>
            Commit Payment
          </button>
        </div>
        <p className="muted">
          Returns: {returnIds.length} | Yarn deliveries: {yarnGivenIds.length}
        </p>
      </div>

      {preview && (
        <div className="card">
          <h3>Preview</h3>
          <p>
            Net settlement: <strong>{preview.netSettlement} ETB</strong>
          </p>
          <p>{preview.amharicAmountInWords}</p>
          <table>
            <thead>
              <tr>
                <th>Return</th>
                <th>Zig</th>
                <th>Deduction</th>
                <th>Bonus</th>
                <th>Net Credit</th>
              </tr>
            </thead>
            <tbody>
              {preview.lineItems.map((line) => (
                <tr key={line.returnId}>
                  <td>{line.returnId}</td>
                  <td>{line.zigId}</td>
                  <td>{line.deductionPerPiece}</td>
                  <td>{line.bonusAmount}</td>
                  <td>{line.netCredit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {message && <p className="success">{message}</p>}
      {lastPaymentId && (
        <button
          type="button"
          onClick={() => reportsApi.downloadHisabCsv(lastPaymentId)}
        >
          Download HISAB CSV
        </button>
      )}
      {error && <p className="error">{error}</p>}
    </section>
  );
}