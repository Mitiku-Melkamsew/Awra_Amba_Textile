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
    Promise.all([
      transactionsApi.nextId(),
      catalogApi.lookup(),
      weaversApi.list(),
      merchantsApi.list(),
      catalogApi.yarnVariants(),
      catalogApi.fabricVariants(),
    ])
      .then(([next, lookup, w, m, y, f]) => {
        setTransactionId(next.transactionId);
        setCatalogLookup(lookup);
        setWeavers(w);
        setMerchants(m);
        setYarnVariants(y as YarnVariantOption[]);
        setFabricVariants(f);
        setYarnLines([createYarnLineDraft(lookup)]);
        setFabricLines([createFabricLineDraft(lookup, isFabricPurchase ? "catalog" : "variant")]);
        if (lookup.suppliers[0]) setSupplierId(String(lookup.suppliers[0].supplierId));
        if (w[0]) setWeaverId(String(w[0].weaverId));
        if (m[0]) setMerchantId(String(m[0].merchantId));
      })
      .catch((err) => setError(err.message));
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

    const lines = isFabric ? parseFabricLines(fabricLines) : parseYarnLines(yarnLines);
    if (lines.length === 0) {
      setError("Add at least one valid line.");
      return;
    }

    setSaving(true);
    setError("");
    try {
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
      navigate(`/admin/transactions/${txn.transactionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!txnType) {
    return (
      <section>
        <p className="error">Invalid transaction type.</p>
        <Link to="/admin/transactions">Back</Link>
      </section>
    );
  }

  const title =
    txnType === "yarn_purchase"
      ? "Buy Yarn"
      : txnType === "fabric_purchase"
        ? "Buy Fabric from Weaver"
        : txnType === "yarn_sale"
          ? "Sell Yarn"
          : "Sell Fabric";

  return (
    <section>
      <p>
        <Link to={`/admin/transactions/new/${direction}`}>← Back</Link>
      </p>
      <p className="eyebrow">Step 4 of 4</p>
      <h2>{title}</h2>
      <p className="muted">
        ID: {transactionId}
        {isFabricPurchase &&
          " · Describe fabric like a zig return — new variants are created automatically."}
      </p>

      <form className="card form" onSubmit={handleSubmit}>
        <label>
          Payment terms
          <select
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
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
            Supplier
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
              {catalogLookup.suppliers.map((s) => (
                <option key={s.supplierId} value={s.supplierId}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {txnType === "fabric_purchase" && (
          <label>
            Weaver (seller)
            <select value={weaverId} onChange={(e) => setWeaverId(e.target.value)} required>
              {weavers.map((w) => (
                <option key={w.weaverId} value={w.weaverId}>
                  {w.firstName} {w.lastName}
                </option>
              ))}
            </select>
          </label>
        )}

        {(txnType === "fabric_sale" || txnType === "yarn_sale") && (
          <>
            <label>
              Merchant (buyer)
              <select value={merchantId} onChange={(e) => setMerchantId(e.target.value)} required>
                {merchants.map((m) => (
                  <option key={m.merchantId} value={m.merchantId}>
                    {m.companyName ?? m.contactPhone}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <label>
                New merchant name
                <input
                  value={newMerchantName}
                  onChange={(e) => setNewMerchantName(e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label>
                Phone
                <input
                  value={newMerchantPhone}
                  onChange={(e) => setNewMerchantPhone(e.target.value)}
                />
              </label>
            </div>
            <button type="button" className="btn-secondary" onClick={handleAddMerchant}>
              Add merchant
            </button>
          </>
        )}

        <h3 style={{ marginTop: "1rem" }}>Lines</h3>
        {isFabric ? (
          <FabricLinesEditor
            lines={fabricLines}
            onChange={setFabricLines}
            lookup={catalogLookup}
            fabricVariants={fabricVariants}
            defaultEntryMode={isFabricPurchase ? "catalog" : "variant"}
          />
        ) : (
          <YarnLinesEditor
            lines={yarnLines}
            onChange={setYarnLines}
            lookup={catalogLookup}
            yarnVariants={yarnVariants}
          />
        )}

        <label>
          Notes
          <input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Create transaction"}
        </button>
      </form>
    </section>
  );
}