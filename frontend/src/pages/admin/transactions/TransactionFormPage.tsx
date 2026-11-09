import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FabricLinesEditor } from "../../../components/FabricLinesEditor";
import { YarnLinesEditor } from "../../../components/YarnLinesEditor";
import {
  catalogApi,
  merchantsApi,
  transactionsApi,
  weaversApi,
  type PaymentTerms,
} from "../../../api";
import {
  createFabricLineDraft,
  parseFabricLines,
  type FabricCatalogLookup,
  type FabricLineDraft,
} from "../../../utils/fabricLines";
import { PAYMENT_TERMS_LABELS, txnTypeFromRoute } from "../../../utils/transactionTypes";
import {
  createYarnLineDraft,
  parseYarnLines,
  type YarnCatalogLookup,
  type YarnLineDraft,
  type YarnVariantOption,
} from "../../../utils/yarnLines";

export function TransactionFormPage() {
  const { direction, goods } = useParams<{ direction: string; goods: string }>();
  const navigate = useNavigate();
  const txnType = txnTypeFromRoute(direction ?? "", goods ?? "");

  const [transactionId, setTransactionId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>("on_delivery");
  const [supplierId, setSupplierId] = useState("");
  const [weaverId, setWeaverId] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [yarnBuyerType, setYarnBuyerType] = useState<"weaver" | "merchant">("weaver");
  const [notes, setNotes] = useState("");
  const [yarnLines, setYarnLines] = useState<YarnLineDraft[]>([createYarnLineDraft()]);
  const [fabricLines, setFabricLines] = useState<FabricLineDraft[]>([
    createFabricLineDraft(undefined, "variant"),
  ]);

  const [catalogLookup, setCatalogLookup] = useState<FabricCatalogLookup & YarnCatalogLookup>({
    colors: [],
    designs: [],
    products: [],
    suppliers: [],
    yarnTypes: [],
  });
  const [weavers, setWeavers] = useState<
    Array<{ weaverId: number; firstName: string; lastName: string }>
  >([]);
  const [merchants, setMerchants] = useState<
    Array<{ merchantId: number; companyName: string | null; contactPhone: string }>
  >([]);
  const [yarnVariants, setYarnVariants] = useState<YarnVariantOption[]>([]);
  const [fabricVariants, setFabricVariants] = useState<
    Awaited<ReturnType<typeof catalogApi.fabricVariants>>
  >([]);
  const [newMerchantName, setNewMerchantName] = useState("");
  const [newMerchantPhone, setNewMerchantPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isFabric = goods === "fabric";
  const isFabricPurchase = txnType === "fabric_purchase";
  const isSale = txnType === "fabric_sale" || txnType === "yarn_sale";

  useEffect(() => {
    if (!txnType) return;
    let isMounted = true;

    async function loadData() {
      try {
        const [next, lookup, w, m, y, f] = await Promise.all([
          transactionsApi.nextId().catch(() => ({
            transactionId: `TXN-${Date.now().toString().slice(-4)}`,
          })),
          catalogApi.lookup(),
          weaversApi.list().catch(() => []),
          merchantsApi.list().catch(() => []),
          catalogApi.yarnVariants().catch(() => []),
          catalogApi.fabricVariants().catch(() => []),
        ]);

        if (!isMounted) return;

        setTransactionId(next.transactionId);
        setCatalogLookup(lookup);
        setWeavers(w);
        setMerchants(m);
        setYarnVariants(y as YarnVariantOption[]);
        setFabricVariants(f);

        // Pre-initialize lines for sale vs purchase
        if (txnType === "fabric_sale") {
          const inStock = f.filter((v: any) => v.isActive !== false && Number(v.stockSnapshot ?? 0) > 0);
          const first = inStock[0] ?? f[0];
          const draft = createFabricLineDraft(lookup, "variant");
          if (first) {
            const autoPrice = (first as any).sellingPrice ?? (first as any).product?.sellingPrice ?? first.basePrice;
            draft.fabricVariantId = String(first.fabricVariantId);
            draft.productId = String(first.fabricId ?? first.fabric?.fabricId ?? "");
            draft.unitPrice = autoPrice ? String(autoPrice) : "";
            draft.quantity = "1";
          }
          setFabricLines([draft]);
        } else {
          setFabricLines([createFabricLineDraft(lookup, isFabricPurchase ? "catalog" : "variant")]);
        }

        if (txnType === "yarn_sale") {
          const inStock = (y as any[]).filter((v: any) => v.isActive !== false && Number(v.stockSnapshot ?? 0) > 0);
          const first = inStock[0] ?? y[0];
          const draft = createYarnLineDraft(lookup);
          if (first) {
            const autoPrice = (first as any).sellingPrice ?? first.basePrice;
            draft.entryMode = "variant";
            draft.yarnVariantId = String(first.yarnVariantId);
            draft.yarnTypeId = String(first.yarnTypeId ?? (first as any).yarnId ?? "");
            draft.supplierId = String(first.supplierId ?? "");
            draft.colorId = String(first.colorId ?? "");
            draft.unitPrice = autoPrice ? String(autoPrice) : "";
            draft.quantity = "1";
          }
          setYarnLines([draft]);
        } else {
          setYarnLines([createYarnLineDraft(lookup)]);
        }

        if (lookup.suppliers?.[0]) setSupplierId(String(lookup.suppliers[0].supplierId));
        if (w?.[0]) setWeaverId(String(w[0].weaverId));
        if (m?.[0]) setMerchantId(String(m[0].merchantId));
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load transaction data");
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [txnType, isFabricPurchase]);

  // Compute live totals and stock warnings
  const parsedLines = useMemo(() => {
    return isFabric ? parseFabricLines(fabricLines) : parseYarnLines(yarnLines);
  }, [isFabric, fabricLines, yarnLines]);

  const totalQuantity = useMemo(() => {
    return parsedLines.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
  }, [parsedLines]);

  const grandTotal = useMemo(() => {
    return parsedLines.reduce(
      (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0),
      0,
    );
  }, [parsedLines]);

  const stockValidationErrors = useMemo(() => {
    const errs: string[] = [];
    if (txnType === "fabric_sale") {
      fabricLines.forEach((l, idx) => {
        if (!l.fabricVariantId) {
          errs.push(`Line ${idx + 1}: Please select an available fabric variant.`);
          return;
        }
        const v = fabricVariants.find((fv) => String(fv.fabricVariantId) === l.fabricVariantId);
        const stock = v ? Number((v as any).stockSnapshot ?? 0) : 0;
        const qty = Number(l.quantity || 0);
        if (qty <= 0) {
          errs.push(`Line ${idx + 1}: Quantity must be at least 1 piece.`);
        } else if (qty > stock) {
          errs.push(`Line ${idx + 1}: Requested ${qty} pcs exceeds available stock (${stock} pcs).`);
        }
      });
    } else if (txnType === "yarn_sale") {
      yarnLines.forEach((l, idx) => {
        if (!l.yarnVariantId) {
          errs.push(`Line ${idx + 1}: Please select an available yarn variant.`);
          return;
        }
        const v = yarnVariants.find((yv) => String(yv.yarnVariantId) === l.yarnVariantId);
        const stock = v ? Number((v as any).stockSnapshot ?? 0) : 0;
        const qty = Number(l.quantity || 0);
        if (qty <= 0) {
          errs.push(`Line ${idx + 1}: Quantity must be at least 1 piece.`);
        } else if (qty > stock) {
          errs.push(`Line ${idx + 1}: Requested ${qty} pieces exceeds available stock (${stock} pieces).`);
        }
      });
    }
    return errs;
  }, [txnType, fabricLines, yarnLines, fabricVariants, yarnVariants]);

  async function handleAddMerchant() {
    if (!newMerchantPhone) return;
    try {
      const merchant = await merchantsApi.create({
        companyName: newMerchantName || undefined,
        contactPhone: newMerchantPhone,
      });
      setMerchants((prev) => [...prev, merchant]);
      setMerchantId(String(merchant.merchantId));
      setNewMerchantName("");
      setNewMerchantPhone("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register merchant");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!txnType) return;
    setSaving(true);
    setError("");

    try {
      if (stockValidationErrors.length > 0) {
        setError(stockValidationErrors[0]);
        setSaving(false);
        return;
      }

      const lines = isFabric ? parseFabricLines(fabricLines) : parseYarnLines(yarnLines);
      if (lines.length === 0) {
        setError("Add at least one item line with valid quantity and price.");
        setSaving(false);
        return;
      }

      if (txnType === "fabric_sale") {
        for (const l of lines as any[]) {
          if (!l.fabricVariantId) {
            setError("Please select an available fabric variant for every line.");
            setSaving(false);
            return;
          }
          const v = fabricVariants.find((fv) => fv.fabricVariantId === l.fabricVariantId);
          const stock = v ? Number((v as any).stockSnapshot ?? 0) : 0;
          if (l.quantity > stock) {
            setError(`Cannot sell ${l.quantity} pcs of "${v?.sku ?? "fabric"}": available stock is ${stock} pcs.`);
            setSaving(false);
            return;
          }
        }
      }

      if (txnType === "yarn_sale") {
        for (const l of lines as any[]) {
          if (!l.yarnVariantId) {
            setError("Please select an available yarn variant for every line.");
            setSaving(false);
            return;
          }
          const v = yarnVariants.find((yv) => yv.yarnVariantId === l.yarnVariantId);
          const stock = v ? Number((v as any).stockSnapshot ?? 0) : 0;
          if (l.quantity > stock) {
            setError(`Cannot sell ${l.quantity} pieces of "${v?.sku ?? "yarn"}": available stock is ${stock} pieces.`);
            setSaving(false);
            return;
          }
        }
      }

      const txn = await transactionsApi.create({
        transactionId,
        type: txnType,
        paymentTerms,
        supplierId: txnType === "yarn_purchase" ? Number(supplierId) : undefined,
        weaverId:
          txnType === "fabric_purchase" || (txnType === "yarn_sale" && yarnBuyerType === "weaver")
            ? Number(weaverId)
            : undefined,
        merchantId:
          txnType === "fabric_sale" || (txnType === "yarn_sale" && yarnBuyerType === "merchant")
            ? Number(merchantId)
            : undefined,
        notes: notes || undefined,
        lines,
      });

      navigate(`/admin/transactions/${txn.transactionId ?? txn.directTransactionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  }

  if (!txnType) {
    return (
      <div className="page">
        <div className="error-msg"><span>⚠️</span> Invalid transaction route or parameters.</div>
        <Link to="/admin/transactions" className="back-link">Back to Transactions</Link>
      </div>
    );
  }

  const title =
    txnType === "yarn_purchase"
      ? "Buy Raw Yarn from Supplier"
      : txnType === "fabric_purchase"
        ? "Buy Handwoven Fabric from Weaver"
        : txnType === "yarn_sale"
          ? "Sell Yarn Cones"
          : "Sell Finished Fabric to Merchant";

  return (
    <div className="page">
      <Link to={`/admin/transactions/new/${direction}`} className="back-link">
        ← Back to Step 2
      </Link>

      <div className="page-header">
        <div>
          <p className="eyebrow">ደረጃ 3 ከ 3 / Final Step</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1 className="page-title">{title}</h1>
            <span
              style={{
                fontFamily: "monospace",
                fontWeight: 700,
                background: "var(--brand-light, #eff6ff)",
                color: "var(--brand, #2563eb)",
                padding: "0.2rem 0.6rem",
                borderRadius: "8px",
              }}
            >
              #{transactionId}
            </span>
          </div>
          <p className="page-subtitle">
            {isSale
              ? "Select from available warehouse stock. Inventory decreases automatically upon transaction confirmation."
              : "Configure counterparties, payment terms, and item lines. Stock adjusts automatically upon confirmation."}
          </p>
        </div>
      </div>

      <form className="card form" onSubmit={handleSubmit} style={{ maxWidth: 880 }}>
        <h3 className="section-title" style={{ margin: 0 }}>
          <span>📋</span> General Transaction Details
        </h3>

        <label>
          <span>Payment Terms / የክፍያ ሁኔታ</span>
          <select
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
            style={{ height: 42 }}
          >
            {Object.entries(PAYMENT_TERMS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {/* Counterparty for Yarn Purchase */}
        {txnType === "yarn_purchase" && (
          <label>
            <span>Yarn Supplier / የጥጥ አቅራቢ</span>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required style={{ height: 42 }}>
              {catalogLookup.suppliers.length === 0 ? (
                <option value="">No active suppliers configured</option>
              ) : (
                catalogLookup.suppliers.map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.name}
                  </option>
                ))
              )}
            </select>
          </label>
        )}

        {/* Counterparty for Fabric Purchase */}
        {txnType === "fabric_purchase" && (
          <label>
            <span>Artisan Weaver (Seller) / አሸጋይ</span>
            <select value={weaverId} onChange={(e) => setWeaverId(e.target.value)} required style={{ height: 42 }}>
              {weavers.length === 0 ? (
                <option value="">No active weavers found</option>
              ) : (
                weavers.map((w) => (
                  <option key={w.weaverId} value={w.weaverId}>
                    {w.firstName} {w.lastName} (#{w.weaverId})
                  </option>
                ))
              )}
            </select>
          </label>
        )}

        {/* Counterparty for Yarn Sale (can sell to Weaver or Merchant) */}
        {txnType === "yarn_sale" && (
          <>
            <div className="form-row">
              <label>
                <span>Buyer Type / የገዢ ዓይነት</span>
                <select
                  value={yarnBuyerType}
                  onChange={(e) => setYarnBuyerType(e.target.value as "weaver" | "merchant")}
                  style={{ height: 42 }}
                >
                  <option value="weaver">Artisan Weaver / አሸጋይ</option>
                  <option value="merchant">Merchant / ነጋዴ</option>
                </select>
              </label>

              {yarnBuyerType === "weaver" ? (
                <label>
                  <span>Weaver (Buyer) / አሸጋይ ገዢ</span>
                  <select value={weaverId} onChange={(e) => setWeaverId(e.target.value)} required style={{ height: 42 }}>
                    {weavers.length === 0 ? (
                      <option value="">No weavers registered</option>
                    ) : (
                      weavers.map((w) => (
                        <option key={w.weaverId} value={w.weaverId}>
                          {w.firstName} {w.lastName} (#{w.weaverId})
                        </option>
                      ))
                    )}
                  </select>
                </label>
              ) : (
                <label>
                  <span>Merchant (Buyer) / ገዢ ነጋዴ</span>
                  <select value={merchantId} onChange={(e) => setMerchantId(e.target.value)} required style={{ height: 42 }}>
                    {merchants.length === 0 ? (
                      <option value="">No merchants registered yet</option>
                    ) : (
                      merchants.map((m) => (
                        <option key={m.merchantId} value={m.merchantId}>
                          {m.companyName ?? m.contactPhone}
                        </option>
                      ))
                    )}
                  </select>
                </label>
              )}
            </div>
          </>
        )}

        {/* Counterparty for Fabric Sale */}
        {txnType === "fabric_sale" && (
          <>
            <label>
              <span>Merchant (Buyer) / ገዢ ነጋዴ <span style={{ color: "var(--red, #dc2626)" }}>*</span></span>
              <select value={merchantId} onChange={(e) => setMerchantId(e.target.value)} required style={{ height: 42 }}>
                {merchants.length === 0 ? (
                  <option value="">No merchants registered yet — register below</option>
                ) : (
                  merchants.map((m) => (
                    <option key={m.merchantId} value={m.merchantId}>
                      {m.companyName ?? m.contactPhone}
                    </option>
                  ))
                )}
              </select>
            </label>

            <div style={{ background: "var(--bg-subtle, #f8fafc)", padding: "1rem", borderRadius: "10px", marginTop: "0.25rem", border: "1px dashed var(--border, #cbd5e1)" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted, #64748b)", display: "block", marginBottom: "0.5rem" }}>
                + Register New Merchant (if not in dropdown)
              </span>
              <div className="form-row">
                <label>
                  <span>Company Name / የድርጅት ስም</span>
                  <input
                    value={newMerchantName}
                    onChange={(e) => setNewMerchantName(e.target.value)}
                    placeholder="e.g. Merkato Textile Wholesalers"
                  />
                </label>
                <label>
                  <span>Phone Number / ስልክ ቁጥር</span>
                  <input
                    value={newMerchantPhone}
                    onChange={(e) => setNewMerchantPhone(e.target.value)}
                    placeholder="+251 9xx xxx xxx"
                  />
                </label>
              </div>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={handleAddMerchant}
                style={{ marginTop: "0.75rem" }}
              >
                + Register Merchant
              </button>
            </div>
          </>
        )}

        {/* Transaction Items */}
        <div style={{ borderTop: "1.5px solid var(--border, #e2e8f0)", paddingTop: "1.25rem", marginTop: "0.75rem" }}>
          <h3 className="section-title">
            <span>📦</span> Transaction Lines / የዕቃ ዝርዝር
          </h3>

          {isFabric ? (
            <FabricLinesEditor
              lines={fabricLines}
              onChange={setFabricLines}
              lookup={catalogLookup}
              fabricVariants={fabricVariants}
              defaultEntryMode={isFabricPurchase ? "catalog" : "variant"}
              txnType={txnType}
            />
          ) : (
            <YarnLinesEditor
              lines={yarnLines}
              onChange={setYarnLines}
              lookup={catalogLookup}
              yarnVariants={yarnVariants}
              txnType={txnType}
            />
          )}
        </div>

        {/* Live Order Summary Card */}
        <div
          style={{
            background: "var(--bg-subtle, #f8fafc)",
            border: "1.5px solid var(--border, #e2e8f0)",
            borderRadius: "10px",
            padding: "1.1rem 1.25rem",
            marginTop: "1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main, #0f172a)" }}>
              Order Summary / ጠቅላላ ማጠቃለያ
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted, #64748b)", marginTop: "4px" }}>
              Total lines: <strong>{parsedLines.length}</strong> · Quantity: <strong>{totalQuantity} {isFabric ? "pieces" : "pieces/cones"}</strong>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", display: "block", textTransform: "uppercase", fontWeight: 600 }}>
              Grand Total
            </span>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--brand, #2563eb)" }}>
              ETB {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <label style={{ marginTop: "0.75rem" }}>
          <span>Internal Transaction Notes / ማስታወሻ (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add delivery location, terms, or reference notes…"
            rows={2}
          />
        </label>

        {/* Errors Banner */}
        {error && (
          <div className="error-msg" style={{ marginTop: "0.5rem" }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {stockValidationErrors.length > 0 && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              marginTop: "0.5rem",
              color: "#b91c1c",
              fontSize: "0.88rem",
            }}
          >
            <strong>⚠️ Cannot proceed — inventory stock issues:</strong>
            <ul style={{ margin: "0.4rem 0 0 1.25rem", padding: 0 }}>
              {stockValidationErrors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="form-actions" style={{ marginTop: "1rem" }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || stockValidationErrors.length > 0}
            style={{ minWidth: 200 }}
          >
            {saving ? "Creating Transaction…" : "✓ Create Transaction / መዝግብ"}
          </button>
          <Link to="/admin/transactions" className="btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default TransactionFormPage;
