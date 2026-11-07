import { useEffect, useState, useMemo } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  catalogApi,
  type FabricPriceRow,
  type YarnPriceRow,
  type Fabric,
  type Supplier,
} from "../../api";
import { formatDateDDMMYY } from "../../utils/formatDate";

export function PricesPage() {
  const [tab, setTab] = useState<"fabricPrices" | "yarnPrices">("fabricPrices");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showClosed, setShowClosed] = useState(false);

  // Catalogs
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [yarns, setYarns] = useState<Array<{ yarnId: number; name: string }>>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Prices
  const [fabricPrices, setFabricPrices] = useState<FabricPriceRow[]>([]);
  const [yarnPrices, setYarnPrices] = useState<YarnPriceRow[]>([]);

  // Add Fabric Price state
  const [priceFabricId, setPriceFabricId] = useState("");
  const [priceWeaverRate, setPriceWeaverRate] = useState("");
  const [priceSellingPrice, setPriceSellingPrice] = useState("");
  const [priceEffectiveDate, setPriceEffectiveDate] = useState("");

  // Add Yarn Price state
  const [priceYarnId, setPriceYarnId] = useState("");
  const [priceYarnSupplierId, setPriceYarnSupplierId] = useState("");
  const [priceYarnPurchasePrice, setPriceYarnPurchasePrice] = useState("");
  const [priceYarnSellingPrice, setPriceYarnSellingPrice] = useState("");
  const [priceYarnEffectiveDate, setPriceYarnEffectiveDate] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [fabList, yarnList, supList, fpList, ypList] = await Promise.all([
        catalogApi.fabrics(),
        catalogApi.yarns(),
        catalogApi.suppliers(),
        catalogApi.fabricPrices(),
        catalogApi.yarnPrices(),
      ]);
      setFabrics(fabList);
      setYarns(yarnList as any);
      setSuppliers(supList);
      setFabricPrices(fpList);
      setYarnPrices(ypList);

      if (fabList[0] && !priceFabricId) setPriceFabricId(String(fabList[0].fabricId));
      if (yarnList[0] && !priceYarnId) setPriceYarnId(String(yarnList[0].yarnId));
      if (supList[0] && !priceYarnSupplierId) setPriceYarnSupplierId(String(supList[0].supplierId));
    } catch (err: any) {
      setError(err.message || "Failed to load pricing data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddFabricPrice(e: FormEvent) {
    e.preventDefault();
    if (!priceFabricId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await catalogApi.createFabricPrice({
        fabricId: Number(priceFabricId),
        weaverRate: Number(priceWeaverRate),
        sellingPrice: Number(priceSellingPrice),
        effectiveFrom: priceEffectiveDate || undefined,
      });
      setPriceWeaverRate("");
      setPriceSellingPrice("");
      setPriceEffectiveDate("");
      setMessage("Fabric price version added successfully.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to create fabric price");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddYarnPrice(e: FormEvent) {
    e.preventDefault();
    if (!priceYarnId || !priceYarnSupplierId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await catalogApi.createYarnPrice({
        yarnId: Number(priceYarnId),
        supplierId: Number(priceYarnSupplierId),
        purchasePrice: Number(priceYarnPurchasePrice),
        sellingPrice: Number(priceYarnSellingPrice),
        effectiveFrom: priceYarnEffectiveDate || undefined,
      });
      setPriceYarnPurchasePrice("");
      setPriceYarnSellingPrice("");
      setPriceYarnEffectiveDate("");
      setMessage("Yarn price schedule updated successfully.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to create yarn price");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(type: "fabricPrice" | "yarnPrice", id: number, currentActive: boolean) {
    setError("");
    setMessage("");
    try {
      if (type === "fabricPrice") {
        await catalogApi.updateFabricPrice(id, { isActive: !currentActive });
        setMessage(`Fabric price ${currentActive ? "closed" : "reactivated"}.`);
      } else {
        await catalogApi.updateYarnPrice(id, { isActive: !currentActive });
        setMessage(`Yarn price ${currentActive ? "closed" : "reactivated"}.`);
      }
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update price status");
    }
  }

  const q = search.toLowerCase().trim();

  const filteredFabricPrices = useMemo(() => {
    return fabricPrices.filter((p) => {
      if (!showClosed && !p.isActive) return false;
      if (!q) return true;
      const fName = (p.fabric?.name ?? "").toLowerCase();
      return fName.includes(q) || String(p.fabricId).includes(q);
    });
  }, [fabricPrices, showClosed, q]);

  const filteredYarnPrices = useMemo(() => {
    return yarnPrices.filter((p) => {
      if (!showClosed && !p.isActive) return false;
      if (!q) return true;
      const yName = (p.yarn?.name ?? "").toLowerCase();
      const sName = (p.supplier?.name ?? "").toLowerCase();
      return yName.includes(q) || sName.includes(q);
    });
  }, [yarnPrices, showClosed, q]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">የዋጋ አስተዳደር / Price Management</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="page-title">Price Schedules & Rate Versioning</h1>
            <span className="badge badge-gray">
              {fabricPrices.length} Fabric Rates · {yarnPrices.length} Yarn Rates
            </span>
          </div>
          <p className="page-subtitle">
            Configure piece rates paid to artisans for weaving and commercial selling prices charged to merchants.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className={tab === "fabricPrices" ? "tab-pill active" : "tab-pill"}
            onClick={() => {
              setTab("fabricPrices");
              setSearch("");
            }}
          >
            🪢 Fabric Prices / የጨርቅ ዋጋ ({fabricPrices.length})
          </button>
          <button
            type="button"
            className={tab === "yarnPrices" ? "tab-pill active" : "tab-pill"}
            onClick={() => {
              setTab("yarnPrices");
              setSearch("");
            }}
          >
            🧶 Yarn Prices / የክር ዋጋ ({yarnPrices.length})
          </button>
        </div>
      </div>

      {message && (
        <div className="success-msg">
          <span>✅</span> {message}
        </div>
      )}
      {error && (
        <div className="error-msg">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Add Price Card */}
      {tab === "fabricPrices" && (
        <form className="card form inline-add-form" onSubmit={handleAddFabricPrice}>
          <p className="section-title">
            <span>🏷️</span> Add New Fabric Price Schedule / አዲስ የጨርቅ ዋጋ መዝግብ
          </p>
          <div className="form-row">
            <label>
              <span>Fabric / ጨርቅ</span>
              <select
                value={priceFabricId}
                onChange={(e) => setPriceFabricId(e.target.value)}
                required
              >
                {fabrics.map((f) => (
                  <option key={f.fabricId} value={f.fabricId}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Weaver Rate (ETB) / የሸማኔ ዋጋ</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={priceWeaverRate}
                onChange={(e) => setPriceWeaverRate(e.target.value)}
                placeholder="e.g. 350.00"
                required
              />
            </label>
            <label>
              <span>Selling Price (ETB) / የሽያጭ ዋጋ</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={priceSellingPrice}
                onChange={(e) => setPriceSellingPrice(e.target.value)}
                placeholder="e.g. 850.00"
                required
              />
            </label>
            <label>
              <span>Effective From (Date)</span>
              <input
                type="date"
                value={priceEffectiveDate}
                onChange={(e) => setPriceEffectiveDate(e.target.value)}
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "+ Record Fabric Price / መዝግብ"}
            </button>
          </div>
        </form>
      )}

      {tab === "yarnPrices" && (
        <form className="card form inline-add-form" onSubmit={handleAddYarnPrice}>
          <p className="section-title">
            <span>💵</span> Add New Yarn Price Schedule / አዲስ የክር ዋጋ መዝግብ
          </p>
          <div className="form-row">
            <label>
              <span>Yarn Type / ጥጥ</span>
              <select
                value={priceYarnId}
                onChange={(e) => setPriceYarnId(e.target.value)}
                required
              >
                {yarns.map((y) => (
                  <option key={y.yarnId} value={y.yarnId}>
                    {y.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Supplier / አቅራቢ</span>
              <select
                value={priceYarnSupplierId}
                onChange={(e) => setPriceYarnSupplierId(e.target.value)}
                required
              >
                {suppliers.map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Purchase Price (ETB/piece)</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={priceYarnPurchasePrice}
                onChange={(e) => setPriceYarnPurchasePrice(e.target.value)}
                placeholder="e.g. 450.00"
                required
              />
            </label>
            <label>
              <span>Selling Price (ETB/piece)</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={priceYarnSellingPrice}
                onChange={(e) => setPriceYarnSellingPrice(e.target.value)}
                placeholder="e.g. 520.00"
                required
              />
            </label>
            <label>
              <span>Effective Date</span>
              <input
                type="date"
                value={priceYarnEffectiveDate}
                onChange={(e) => setPriceYarnEffectiveDate(e.target.value)}
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "+ Record Yarn Price / መዝግብ"}
            </button>
          </div>
        </form>
      )}

      {/* Toolbar */}
      <div className="toolbar" style={{ marginTop: "1rem" }}>
        <input
          className="search-input"
          placeholder={
            tab === "fabricPrices"
              ? "🔍 Filter fabric rates by name or id…"
              : "🔍 Filter yarn rates by material or supplier…"
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="checkbox-label" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: 13, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showClosed}
            onChange={(e) => setShowClosed(e.target.checked)}
          />
          Show Closed Rates / ዝግ ዋጋዎችን አሳይ
        </label>
      </div>

      {/* Tables */}
      <div className="card table-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading"><span>⏳</span> Loading price tables…</div>
        ) : tab === "fabricPrices" ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fabric</th>
                  <th>Weaver Rate (ETB)</th>
                  <th>Selling Price (ETB)</th>
                  <th>Gross Margin</th>
                  <th>Effective From</th>
                  <th>Effective To</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFabricPrices.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <span className="empty-icon">🏷️</span>
                        No fabric price records matching criteria.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredFabricPrices.map((p) => {
                    const weaver = Number(p.weaverRate);
                    const selling = Number(p.sellingPrice);
                    const margin = selling > 0 ? (((selling - weaver) / selling) * 100).toFixed(1) : "0";
                    return (
                      <tr key={p.fabricPriceId}>
                        <td style={{ fontWeight: 700 }}>
                          {p.fabric?.name ?? `Fabric #${p.fabricId}`}
                        </td>
                        <td style={{ fontWeight: 700, color: "var(--accent)" }}>
                          {weaver.toLocaleString()} ETB
                        </td>
                        <td style={{ fontWeight: 700, color: "#0284C7" }}>
                          {selling.toLocaleString()} ETB
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: Number(margin) >= 20 ? "var(--green)" : "var(--text-muted)" }}>
                            {margin}%
                          </span>
                        </td>
                        <td>{formatDateDDMMYY(p.effectiveFrom)}</td>
                        <td>
                          {p.effectiveTo ? formatDateDDMMYY(p.effectiveTo) : "Active"}
                        </td>
                        <td>
                          <span className={`badge ${p.isActive ? "badge-green" : "badge-gray"}`}>
                            {p.isActive ? "Active" : "Closed"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn-link"
                            style={{
                              color: p.isActive ? "var(--red)" : "var(--green)",
                              cursor: "pointer",
                            }}
                            onClick={() => toggleActive("fabricPrice", p.fabricPriceId, p.isActive)}
                          >
                            {p.isActive ? "Close Rate" : "Reopen Rate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Yarn Material</th>
                  <th>Supplier</th>
                  <th>Purchase Price (ETB/piece)</th>
                  <th>Selling Price (ETB/piece)</th>
                  <th>Gross Margin</th>
                  <th>Effective From</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredYarnPrices.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <span className="empty-icon">💵</span>
                        No yarn price records matching criteria.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredYarnPrices.map((p) => {
                    const purchase = Number(p.purchasePrice);
                    const selling = Number(p.sellingPrice);
                    const margin = selling > 0 ? (((selling - purchase) / selling) * 100).toFixed(1) : "0";
                    return (
                      <tr key={p.yarnPriceId}>
                        <td style={{ fontWeight: 700 }}>
                          {p.yarn?.name ?? `Yarn #${p.yarnId}`}
                        </td>
                        <td>{p.supplier?.name ?? `Supplier #${p.supplierId}`}</td>
                        <td style={{ fontWeight: 700, color: "var(--accent)" }}>
                          {purchase.toLocaleString()} ETB
                        </td>
                        <td style={{ fontWeight: 700, color: "#0284C7" }}>
                          {selling.toLocaleString()} ETB
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: Number(margin) >= 15 ? "var(--green)" : "var(--text-muted)" }}>
                            {margin}%
                          </span>
                        </td>
                        <td>{formatDateDDMMYY(p.effectiveFrom)}</td>
                        <td>
                          <span className={`badge ${p.isActive ? "badge-green" : "badge-gray"}`}>
                            {p.isActive ? "Active" : "Closed"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn-link"
                            style={{
                              color: p.isActive ? "var(--red)" : "var(--green)",
                              cursor: "pointer",
                            }}
                            onClick={() => toggleActive("yarnPrice", p.yarnPriceId, p.isActive)}
                          >
                            {p.isActive ? "Close Rate" : "Reopen Rate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="muted" style={{ fontSize: "12.5px", marginTop: "1rem" }}>
        Looking for fabric specifications or yarn catalog items? Go to{" "}
        <Link to="/admin/catalog" style={{ color: "var(--brand)", fontWeight: 600 }}>
          Catalog & Specs →
        </Link>
      </p>
    </div>
  );
}

export default PricesPage;
