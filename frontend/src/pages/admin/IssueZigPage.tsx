import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { YarnLinesEditor } from "../../components/YarnLinesEditor";
import { catalogApi, weaversApi, workOrdersApi } from "../../api";
import type { Product, Weaver } from "../../api";
import { findZigZagDesignId } from "../../utils/defaultDesign";
import {
  createYarnLineDraft,
  parseYarnLines,
  type YarnCatalogLookup,
  type YarnLineDraft,
} from "../../utils/yarnLines";

export function IssueZigPage() {
  const { weaverId } = useParams<{ weaverId: string }>();
  const navigate = useNavigate();
  const [weaver, setWeaver] = useState<Weaver | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [colors, setColors] = useState<Array<{ colorId: number; colorCode: string; name: string }>>(
    [],
  );
  const [designs, setDesigns] = useState<Array<{ designId: number; name: string }>>([]);
  const [yarnLookup, setYarnLookup] = useState<YarnCatalogLookup>({
    colors: [],
    suppliers: [],
    yarnTypes: [],
  });
  const [yarnVariants, setYarnVariants] = useState<
    import("../../utils/yarnLines").YarnVariantOption[]
  >([]);
  const [yarnLines, setYarnLines] = useState<YarnLineDraft[]>([createYarnLineDraft(undefined, "0")]);

  const [zigId, setZigId] = useState("");
  const [productId, setProductId] = useState("");
  const [warpColorId, setWarpColorId] = useState("");
  const [weftColorId, setWeftColorId] = useState("");
  const [designId, setDesignId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!weaverId) return;
    Promise.all([
      weaversApi.get(Number(weaverId)),
      catalogApi.lookup(),
      workOrdersApi.nextId(),
      catalogApi.yarnVariants(),
    ])
      .then(([w, lookup, next, yv]) => {
        setWeaver(w);
        setZigId(next.zigId);
        const fabricProducts = lookup.products.filter((p) => p.category === "fabric");
        setProducts(fabricProducts);
        setColors(lookup.colors);
        setDesigns(lookup.designs);
        setYarnLookup({
          colors: lookup.colors,
          suppliers: lookup.suppliers,
          yarnTypes: lookup.yarnTypes,
        });
        setYarnVariants(yv as typeof yarnVariants);
        setYarnLines([createYarnLineDraft(lookup, "0")]);

        if (fabricProducts[0]) {
          setProductId(String(fabricProducts[0].productId));
          setUnitPrice(String(fabricProducts[0].basePrice));
        }
        if (lookup.colors[0]) {
          setWarpColorId(String(lookup.colors[0].colorId));
          setWeftColorId(String(lookup.colors[0].colorId));
        }
        const zigZagId = findZigZagDesignId(lookup.designs);
        if (zigZagId) setDesignId(String(zigZagId));
      })
      .catch((err) => setError(err.message));
  }, [weaverId]);

  function handleProductChange(id: string) {
    setProductId(id);
    const product = products.find((p) => String(p.productId) === id);
    if (product) setUnitPrice(String(product.basePrice));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!weaverId || !productId) return;
    setSaving(true);
    setError("");
    try {
      await workOrdersApi.create({
        zigId,
        weaverId: Number(weaverId),
        productId: Number(productId),
        warpColorId: Number(warpColorId),
        weftColorId: Number(weftColorId),
        designId: designId ? Number(designId) : undefined,
        unitPrice: unitPrice ? Number(unitPrice) : undefined,
        yarnLines: parseYarnLines(yarnLines),
      });
      navigate(`/admin/weavers/${weaverId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to issue zig");
    } finally {
      setSaving(false);
    }
  }

  if (!weaver) {
    return (
      <div className="page">
        <div className="loading"><span>⏳</span> Loading weaver details…</div>
      </div>
    );
  }

  const selectedProduct = products.find((p) => String(p.productId) === productId);

  return (
    <div className="page">
      <Link to={`/admin/weavers/${weaverId}`} className="back-link">
        ← Back to {weaver.firstName} {weaver.lastName}
      </Link>

      <div className="page-header">
        <div>
          <p className="eyebrow">አዲስ ዝግ / Issue Work Order</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className="page-title">Issue New Zig</h1>
            <span style={{ fontFamily: "monospace", fontWeight: 700, background: "var(--brand-light)", color: "var(--brand)", padding: "0.2rem 0.6rem", borderRadius: "8px" }}>
              #{zigId}
            </span>
          </div>
          <p className="page-subtitle">
            Artisan: <strong>{weaver.firstName} {weaver.lastName}</strong> (#{weaver.weaverId}) &middot; Issue fabric target and initial yarn cones in one step.
          </p>
        </div>
      </div>

      <form className="card form" onSubmit={handleSubmit} style={{ maxWidth: 840 }}>
        <h3 className="section-title" style={{ margin: 0 }}>
          <span>🪢</span> Fabric Target / የሚመረተው ጨርቅ
        </h3>

        <label>
          <span>Fabric Product / ዓይነት</span>
          <select value={productId} onChange={(e) => handleProductChange(e.target.value)} required>
            {products.map((p) => (
              <option key={p.productId} value={p.productId}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        {selectedProduct && (
          <div style={{ fontSize: "12.5px", color: "var(--text-muted)", background: "var(--bg-subtle)", padding: "0.5rem 0.85rem", borderRadius: "8px" }}>
            📏 Standard Dimensions: <strong>{selectedProduct.standardWidthCm ?? "—"} cm width</strong> × <strong>{selectedProduct.standardLengthCm ?? "—"} cm length</strong>
          </div>
        )}

        <label>
          <span>Pattern Design / ዲዛይን</span>
          <select value={designId} onChange={(e) => setDesignId(e.target.value)}>
            <option value="">None / መደበኛ</option>
            {designs.map((d) => (
              <option key={d.designId} value={d.designId}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <div className="form-row">
          <label>
            <span>Warp color / ውርፍ</span>
            <select value={warpColorId} onChange={(e) => setWarpColorId(e.target.value)} required>
              {colors.map((c) => (
                <option key={c.colorId} value={c.colorId}>
                  {c.name} ({c.colorCode})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Weft color / ስፍ</span>
            <select value={weftColorId} onChange={(e) => setWeftColorId(e.target.value)} required>
              {colors.map((c) => (
                <option key={c.colorId} value={c.colorId}>
                  {c.name} ({c.colorCode})
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          <span>Piece Unit Price (ETB) / ዋጋ በቁራጭ</span>
          <input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
        </label>

        <div style={{ borderTop: "1.5px solid var(--border)", paddingTop: "1.25rem", marginTop: "0.5rem" }}>
          <h3 className="section-title">
            <span>🧶</span> Yarn Given / የሚሰጥ ጥጥ
          </h3>
          <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "-0.5rem", marginBottom: "1rem" }}>
            Add one or more yarn variants. Leave quantity at 0 to skip any unused line.
          </p>
          <YarnLinesEditor
            lines={yarnLines}
            onChange={setYarnLines}
            lookup={yarnLookup}
            yarnVariants={yarnVariants}
            quantityHint="0 = skip this line"
          />
        </div>

        {error && <div className="error-msg"><span>⚠️</span> {error}</div>}

        <div className="form-actions" style={{ marginTop: "1rem" }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Issuing Zig…" : "✓ Confirm & Issue Zig / ዝግ ስጥ"}
          </button>
          <Link to={`/admin/weavers/${weaverId}`} className="btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default IssueZigPage;
