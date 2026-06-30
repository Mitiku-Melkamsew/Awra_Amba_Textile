import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { catalogApi, procurementApi } from "../../api";

interface Supplier {
  supplierId: number;
  name: string;
}

interface YarnVariant {
  yarnVariantId: number;
  sku: string;
}

export function ProcurementPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [yarnVariants, setYarnVariants] = useState<YarnVariant[]>([]);
  const [purchases, setPurchases] = useState<unknown[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [yarnVariantId, setYarnVariantId] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [unitPrice, setUnitPrice] = useState("400");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const [s, y, p] = await Promise.all([
      catalogApi.suppliers() as Promise<Supplier[]>,
      catalogApi.yarnVariants() as Promise<YarnVariant[]>,
      procurementApi.list(),
    ]);
    setSuppliers(s);
    setYarnVariants(y);
    setPurchases(p);
    if (!supplierId && s[0]) setSupplierId(String(s[0].supplierId));
    if (!yarnVariantId && y[0]) setYarnVariantId(String(y[0].yarnVariantId));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await procurementApi.create({
        supplierId: Number(supplierId),
        notes: notes || undefined,
        lines: [
          {
            yarnVariantId: Number(yarnVariantId),
            quantity: Number(quantity),
            unitPrice: Number(unitPrice),
          },
        ],
      });
      setMessage("Procurement recorded. Stock updated.");
      setNotes("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">ግዛት / Procurement</p>
          <h2>Add Yarn Purchase</h2>
        </div>
      </header>

      <form className="card form" onSubmit={handleSubmit}>
        <label>
          Supplier
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            {suppliers.map((s) => (
              <option key={s.supplierId} value={s.supplierId}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Yarn variant
          <select value={yarnVariantId} onChange={(e) => setYarnVariantId(e.target.value)}>
            {yarnVariants.map((v) => (
              <option key={v.yarnVariantId} value={v.yarnVariantId}>
                {v.sku}
              </option>
            ))}
          </select>
        </label>
        <div className="form-row">
          <label>
            Quantity
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
          <label>
            Unit price
            <input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          </label>
        </div>
        <label>
          Notes
          <input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary">
          Save Purchase
        </button>
      </form>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>Recent Purchases ({purchases.length})</h3>
        <p className="muted">Latest yarn purchases increase stock automatically.</p>
      </div>
    </section>
  );
}