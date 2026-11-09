import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  procurementService,
  catalogService,
} from "../../infrastructure/services";
import type { Supplier, YarnVariant, YarnPurchase } from "../../domain/models";

export function ProcurementPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [yarnVariants, setYarnVariants] = useState<YarnVariant[]>([]);
  const [yarns, setYarns] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<YarnPurchase[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [entryMode, setEntryMode] = useState<"variant" | "catalog">("variant");
  const [yarnVariantId, setYarnVariantId] = useState("");
  const [yarnId, setYarnId] = useState("");
  const [colorId, setColorId] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [unitCost, setUnitCost] = useState("400");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [lookup, yv, p] = await Promise.all([
        catalogService.getLookup(),
        catalogService.listYarnVariants(),
        procurementService.listPurchases(),
      ]);
      setSuppliers(lookup.suppliers);
      setYarns((lookup as any).yarns || []);
      setColors((lookup as any).colors || []);
      setYarnVariants(yv);
      setPurchases(p);
      if (!supplierId && lookup.suppliers[0])
        setSupplierId(String(lookup.suppliers[0].supplierId));
      if (!yarnVariantId && yv[0])
        setYarnVariantId(String(yv[0].yarnVariantId));
      if (!yarnId && (lookup as any).yarns?.[0])
        setYarnId(String((lookup as any).yarns[0].yarnId));
      if (!colorId && (lookup as any).colors?.[0])
        setColorId(String((lookup as any).colors[0].colorId));
    } catch (err: any) {
      setError(err.message || "Failed to load procurement data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const linePayload: any =
        entryMode === "variant"
          ? {
              yarnVariantId: Number(yarnVariantId),
              quantityKg: Number(quantity),
              unitCost: Number(unitCost),
            }
          : {
              yarnId: Number(yarnId),
              colorId: Number(colorId),
              supplierId: Number(supplierId),
              quantityKg: Number(quantity),
              unitCost: Number(unitCost),
            };

      await procurementService.recordPurchase({
        supplierId: Number(supplierId),
        notes: notes || undefined,
        lines: [linePayload],
      });
      setMessage(
        "Procurement recorded successfully. Yarn inventory stock snapshot updated.",
      );
      setNotes("");
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to record procurement");
    }
  }

  return (
    <section className="procurement-page">
      <header className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h2>Procurement / Supplier Yarn Purchases</h2>
          <p className="subtitle">
            Record supplier raw yarn receipts to replenish cooperative inventory
            and track procurement expenses.
          </p>
        </div>
      </header>

      {error && (
        <div
          className="alert alert-error"
          style={{
            padding: "1rem",
            background: "#fee2e2",
            color: "#b91c1c",
            marginBottom: "1rem",
            borderRadius: "6px",
          }}
        >
          {error}
        </div>
      )}
      {message && (
        <div
          className="alert alert-success"
          style={{
            padding: "1rem",
            background: "#dcfce7",
            color: "#166534",
            marginBottom: "1rem",
            borderRadius: "6px",
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.5fr",
          gap: "2rem",
        }}
      >
        <form
          className="card form"
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            padding: "1.5rem",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem 0" }}>Record New Yarn Purchase</h3>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "0.25rem",
              }}
            >
              Supplier *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            >
              {suppliers.map((s) => (
                <option key={s.supplierId} value={s.supplierId}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
              <label
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                {entryMode === "variant" ? "Yarn Variant SKU *" : "Yarn Material & Color *"}
              </label>
              <button
                type="button"
                onClick={() => setEntryMode(entryMode === "variant" ? "catalog" : "variant")}
                style={{ fontSize: "0.75rem", background: "none", border: "none", color: "#2563eb", cursor: "pointer", textDecoration: "underline", padding: 0 }}
              >
                {entryMode === "variant" ? "+ Enter new / other material & color" : "← Select from existing SKU"}
              </button>
            </div>

            {entryMode === "variant" ? (
              <select
                value={yarnVariantId}
                onChange={(e) => setYarnVariantId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                }}
              >
                {yarnVariants.map((v) => (
                  <option key={v.yarnVariantId} value={v.yarnVariantId}>
                    {v.sku} ({v.yarn?.materialName ?? (v as any).yarn?.name ?? "Yarn"})
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <select
                  value={yarnId}
                  onChange={(e) => setYarnId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                  }}
                  required
                >
                  {yarns.map((y) => (
                    <option key={y.yarnId} value={y.yarnId}>
                      {y.name || y.materialName}
                    </option>
                  ))}
                </select>
                <select
                  value={colorId}
                  onChange={(e) => setColorId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                  }}
                  required
                >
                  {colors.map((c) => (
                    <option key={c.colorId} value={c.colorId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                }}
              >
                Quantity (pieces) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: "0.25rem",
                }}
              >
                Cost / piece (Birr) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                }}
              />
            </div>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: "0.25rem",
              }}
            >
              Notes / Delivery Reference
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Invoice #9983 delivered to central warehouse"
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            />
          </div>
          <div
            style={{
              background: "#f8fafc",
              padding: "0.75rem",
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.9rem", color: "#64748b" }}>
              Total Purchase Cost:
            </span>
            <span
              style={{ fontSize: "1.1rem", fontWeight: 700, color: "#b91c1c" }}
            >
              {(Number(quantity) * Number(unitCost)).toFixed(2)} ETB
            </span>
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{
              padding: "0.75rem",
              cursor: "pointer",
              fontWeight: 600,
              marginTop: "0.5rem",
            }}
          >
            Record Purchase & Add Stock
          </button>
        </form>

        <div
          style={{
            background: "#fff",
            padding: "1.5rem",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ margin: "0 0 1rem 0" }}>
            Recent Yarn Purchases ({purchases.length})
          </h3>
          {loading ? (
            <div>Loading purchases...</div>
          ) : purchases.length === 0 ? (
            <div
              style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}
            >
              No procurement records yet.
            </div>
          ) : (
            <div style={{ maxHeight: "450px", overflowY: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f8fafc",
                      borderBottom: "2px solid #e2e8f0",
                    }}
                  >
                    <th style={{ padding: "0.5rem" }}>Date</th>
                    <th style={{ padding: "0.5rem" }}>Supplier</th>
                    <th style={{ padding: "0.5rem" }}>Total (ETB)</th>
                    <th style={{ padding: "0.5rem" }}>Lines</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr
                      key={p.yarnPurchaseId}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <td
                        style={{
                          padding: "0.5rem",
                          fontSize: "0.85rem",
                          color: "#64748b",
                        }}
                      >
                        {new Date(p.purchaseDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "0.5rem", fontWeight: 600 }}>
                        {p.supplier?.name ?? `Supplier #${p.supplierId}`}
                      </td>
                      <td
                        style={{
                          padding: "0.5rem",
                          fontWeight: 600,
                          color: "#b91c1c",
                        }}
                      >
                        {Number(p.totalCost).toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "0.5rem",
                          fontSize: "0.85rem",
                          color: "#64748b",
                        }}
                      >
                        {p.lines?.length ?? 1} item(s)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
