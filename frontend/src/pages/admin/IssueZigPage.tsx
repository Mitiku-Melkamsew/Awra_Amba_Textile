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
    Promise.all([weaversApi.get(Number(weaverId)), catalogApi.lookup(), workOrdersApi.nextId()])
      .then(([w, lookup, next]) => {
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

  if (!weaver) return <p className="muted">Loading...</p>;

  const selectedProduct = products.find((p) => String(p.productId) === productId);

  return (
    <section>
      <p>
        <Link to={`/admin/weavers/${weaverId}`}>← Back to {weaver.firstName}</Link>
      </p>
      <h2>አዲስ ዝግ / Issue Zig</h2>
      <p className="muted">
        {weaver.firstName} {weaver.lastName} · Zig ID: {zigId}
      </p>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        Issue fabric target and yarn in one step. Add multiple yarn variants if needed — leave
        quantity at 0 to skip a line.
      </p>

      <form className="card form" onSubmit={handleSubmit}>
        <h3>Fabric / ጨርቅ</h3>
        <label>
          Product / ዓይነት
          <select value={productId} onChange={(e) => handleProductChange(e.target.value)} required>
            {products.map((p) => (
              <option key={p.productId} value={p.productId}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {selectedProduct && (
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Standard: {selectedProduct.standardWidthCm ?? "—"} ×{" "}
            {selectedProduct.standardLengthCm ?? "—"} cm
          </p>
        )}
        <label>
          Design / ዲዛይን
          <select value={designId} onChange={(e) => setDesignId(e.target.value)}>
            <option value="">None</option>
            {designs.map((d) => (
              <option key={d.designId} value={d.designId}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <div className="form-row">
          <label>
            Warp color / ውርፍ
            <select value={warpColorId} onChange={(e) => setWarpColorId(e.target.value)} required>
              {colors.map((c) => (
                <option key={c.colorId} value={c.colorId}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Weft color / ስፍ
            <select value={weftColorId} onChange={(e) => setWeftColorId(e.target.value)} required>
              {colors.map((c) => (
                <option key={c.colorId} value={c.colorId}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Unit price / ዋጋ
          <input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
        </label>

        <h3 style={{ marginTop: "1rem" }}>Yarn / ጥጥ</h3>
        <YarnLinesEditor
          lines={yarnLines}
          onChange={setYarnLines}
          lookup={yarnLookup}
          quantityHint="0 = skip this line"
        />

        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Issuing..." : "Issue Zig"}
        </button>
      </form>
    </section>
  );
}