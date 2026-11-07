import { useEffect, useState } from "react";
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
  const [notes, setNotes] = useState("");
  const [yarnLines, setYarnLines] = useState<YarnLineDraft[]>([createYarnLineDraft()]);
  const [fabricLines, setFabricLines] = useState<FabricLineDraft[]>([
    createFabricLineDraft(undefined, "catalog"),
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
        setYarnLines([createYarnLineDraft(lookup)]);
        setFabricLines([createFabricLineDraft(lookup, isFabricPurchase ? "catalog" : "variant")]);

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

  async function handleAddMerchant() {
    if (!newMerchantPhone) return;
    const merchant = await merchantsApi.create({
      companyName: newMerchantName || undefined,
      contactPhone: newMerchantPhone,
    });
    setMerchants((prev) => [...prev, merchant]);
    setMerchantId(String(merchant.merchantId));
    setNewMerchantName("");
    setNewMerchantPhone("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!txnType) return;
    setSaving(true);
    setError("");

    try {
      const lines = isFabric ? parseFabricLines(fabricLines) : parseYarnLines(yarnLines);
      if (lines.length === 0) {
        setError("Add at least one line with valid quantity and unit price.");
        setSaving(false);
        return;
      }

      if (txnType === "fabric_sale") {
        for (const l of lines as any[]) {
          if (l.fabricVariantId) {
            const v = fabricVariants.find((fv) => fv.fabricVariantId === l.fabricVariantId);
            const stock = v ? Number((v as any).stockSnapshot ?? 0) : 0;
            if (l.quantity > stock) {
              setError(`Cannot sell ${l.quantity} pcs of "${v?.sku ?? "fabric"}": available stock is ${stock} pcs.`);
              setSaving(false);
              return;
            }
          }
        }
      }

      if (txnType === "yarn_sale") {
        for (const l of lines as any[]) {
          if (l.yarnVariantId) {
            const v = yarnVariants.find((yv) => yv.yarnVariantId === l.yarnVariantId);
            const stock = v ? Number((v as any).stockSnapshot ?? 0) : 0;
            if (l.quantity > stock) {
              setError(`Cannot sell ${l.quantity} pieces of "${v?.sku ?? "yarn"}": available stock is ${stock} pieces.`);
              setSaving(false);
              return;
            }
          }
        }
      }

      const txn = await transactionsApi.create({
        transactionId,
        type: txnType,
        paymentTerms,
        supplierId: txnType === "yarn_purchase" ? Number(supplierId) : undefined,
        weaverId: txnType === "fabric_purchase" ? Number(weaverId) : undefined,
        merchantId:
          txnType === "fabric_sale" || txnType === "yarn_sale"
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
          ? "Sell Yarn Cones to Merchant"
          : "Sell Finished Fabric to Merchant";

  return (
    <div className="page">
      <Link to={`/admin/transactions/new/${direction}`} className="back-link">
        ← Back to Step 2
      </Link>

      <div className="page-header">
        <div>
          <p className="eyebrow">ደረጃ 3 ከ 3 / Final Step</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="page-title">{title}</h1>
            <span style={{ fontFamily: "monospace", fontWeight: 700, background: "var(--brand-light)", color: "var(--brand)", padding: "0.2rem 0.6rem", borderRadius: "8px" }}>
              #{transactionId}
            </span>
          </div>
          <p className="page-subtitle">
            Configure counterparties, payment terms, and item lines. Stock adjusts automatically upon delivery confirmation.
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

        {(txnType === "fabric_sale" || txnType === "yarn_sale") && (
          <>
            <label>
              <span>Merchant (Buyer) / ገዢ ነጋዴ</span>
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

            <div style={{ background: "var(--bg-subtle)", padding: "1rem", borderRadius: "10px", marginTop: "0.25rem" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
                + Add a New Merchant (if not in list)
              </span>
              <div className="form-row">
                <label>
                  <span>Company Name</span>
                  <input
                    value={newMerchantName}
                    onChange={(e) => setNewMerchantName(e.target.value)}
                    placeholder="e.g. Merkato Textile Wholesalers"
                  />
                </label>
                <label>
                  <span>Phone Number</span>
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

        <div style={{ borderTop: "1.5px solid var(--border)", paddingTop: "1.25rem", marginTop: "0.5rem" }}>
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

        <label style={{ marginTop: "0.5rem" }}>
          <span>Internal Transaction Notes / ማስታወሻ (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add delivery location, terms, or reference notes…"
            rows={2}
          />
        </label>

        {error && <div className="error-msg"><span>⚠️</span> {error}</div>}

        <div className="form-actions" style={{ marginTop: "1rem" }}>
          <button type="submit" className="btn-primary" disabled={saving}>
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
