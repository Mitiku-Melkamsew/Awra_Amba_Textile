import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { catalogApi } from "../../api";
import type { FabricVariant, Product } from "../../api";
import { findZigZagDesignId } from "../../utils/defaultDesign";

type CatalogTab =
  | "products"
  | "colors"
  | "designs"
  | "yarnTypes"
  | "suppliers"
  | "fabric"
  | "yarn";

export function CatalogPage() {
  const [tab, setTab] = useState<CatalogTab>("products");
  const [lookup, setLookup] = useState<{
    colors: Array<{ colorId: number; colorCode: string; name: string }>;
    designs: Array<{ designId: number; name: string }>;
    products: Product[];
    suppliers: Array<{ supplierId: number; name: string; contactPhone: string | null }>;
    yarnTypes: Array<{ yarnTypeId: number; materialName: string }>;
  }>({ colors: [], designs: [], products: [], suppliers: [], yarnTypes: [] });
  const [fabricVariants, setFabricVariants] = useState<FabricVariant[]>([]);
  const [yarnVariants, setYarnVariants] = useState<
    Array<{
      yarnVariantId: number;
      sku: string;
      stockSnapshot: string;
      yarnType: { materialName: string };
      color: { name: string };
      supplier: { name: string };
    }>
  >([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [colorCode, setColorCode] = useState("");
  const [colorName, setColorName] = useState("");
  const [designName, setDesignName] = useState("");
  const [yarnTypeName, setYarnTypeName] = useState("");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productLength, setProductLength] = useState("");
  const [productWidth, setProductWidth] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [fabProductId, setFabProductId] = useState("");
  const [fabWarpId, setFabWarpId] = useState("");
  const [fabWeftId, setFabWeftId] = useState("");
  const [fabDesignId, setFabDesignId] = useState("");
  const [fabPrice, setFabPrice] = useState("");
  const [yarnTypeId, setYarnTypeId] = useState("");
  const [yarnColorId, setYarnColorId] = useState("");
  const [yarnSupplierId, setYarnSupplierId] = useState("");
  const [yarnPrice, setYarnPrice] = useState("");

  async function load() {
    const [lk, f, y] = await Promise.all([
      catalogApi.lookup(),
      catalogApi.fabricVariants(),
      catalogApi.yarnVariants(),
    ]);
    setLookup(lk);
    setFabricVariants(f);
    setYarnVariants(y);
    if (!fabProductId && lk.products[0]) setFabProductId(String(lk.products[0].productId));
    if (!fabWarpId && lk.colors[0]) setFabWarpId(String(lk.colors[0].colorId));
    if (!fabWeftId && lk.colors[0]) setFabWeftId(String(lk.colors[0].colorId));
    if (!yarnTypeId && lk.yarnTypes[0]) setYarnTypeId(String(lk.yarnTypes[0].yarnTypeId));
    if (!yarnColorId && lk.colors[0]) setYarnColorId(String(lk.colors[0].colorId));
    if (!yarnSupplierId && lk.suppliers[0]) setYarnSupplierId(String(lk.suppliers[0].supplierId));
    if (!fabDesignId) {
      const zigZagId = findZigZagDesignId(lk.designs);
      if (zigZagId) setFabDesignId(String(zigZagId));
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      if (tab === "colors") {
        await catalogApi.createColor({ colorCode, name: colorName });
        setColorCode("");
        setColorName("");
      } else if (tab === "designs") {
        await catalogApi.createDesign({ name: designName });
        setDesignName("");
      } else if (tab === "yarnTypes") {
        await catalogApi.createYarnType({ materialName: yarnTypeName });
        setYarnTypeName("");
      } else if (tab === "products") {
        await catalogApi.createProduct({
          name: productName,
          category: "fabric",
          basePrice: Number(productPrice),
          standardLengthCm: productLength ? Number(productLength) : undefined,
          standardWidthCm: productWidth ? Number(productWidth) : undefined,
        });
        setProductName("");
        setProductPrice("");
        setProductLength("");
        setProductWidth("");
      } else if (tab === "suppliers") {
        await catalogApi.createSupplier({
          name: supplierName,
          contactPhone: supplierPhone || undefined,
        });
        setSupplierName("");
        setSupplierPhone("");
      } else if (tab === "fabric") {
        await catalogApi.createFabricVariant({
          productId: Number(fabProductId),
          warpColorId: Number(fabWarpId),
          weftColorId: Number(fabWeftId),
          designId: fabDesignId ? Number(fabDesignId) : undefined,
          basePrice: fabPrice ? Number(fabPrice) : undefined,
        });
        setFabPrice("");
      } else if (tab === "yarn") {
        await catalogApi.createYarnVariant({
          yarnTypeId: Number(yarnTypeId),
          colorId: Number(yarnColorId),
          supplierId: Number(yarnSupplierId),
          basePrice: yarnPrice ? Number(yarnPrice) : undefined,
        });
        setYarnPrice("");
      }
      setMessage("Saved successfully to catalog.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const tabs: Array<{ key: CatalogTab; label: string; icon: string; count: number }> = [
    { key: "products", label: "Products", icon: "📋", count: lookup.products.length },
    { key: "fabric", label: "Fabric Variants", icon: "🪢", count: fabricVariants.length },
    { key: "yarn", label: "Yarn Variants", icon: "🧶", count: yarnVariants.length },
    { key: "colors", label: "Colors", icon: "🎨", count: lookup.colors.length },
    { key: "designs", label: "Designs", icon: "✨", count: lookup.designs.length },
    { key: "yarnTypes", label: "Yarn Types", icon: "🧵", count: lookup.yarnTypes.length },
    { key: "suppliers", label: "Suppliers", icon: "🏢", count: lookup.suppliers.length },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">ካታሎግ / Master Catalog</p>
          <h1 className="page-title">Catalog & Standard Specifications</h1>
          <p className="page-subtitle">
            Configure textile products, standard dimensions, base prices, yarns, and color palettes.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? "tab-pill active" : "tab-pill"}
            onClick={() => {
              setTab(t.key);
              setMessage("");
              setError("");
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            <span className="tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Form card */}
      <form className="card form" onSubmit={handleCreate} style={{ marginBottom: "1.5rem" }}>
        <h3 className="section-title" style={{ margin: 0 }}>
          <span>➕</span> Add New {tabs.find((t) => t.key === tab)?.label.replace(/s$/, "")}
        </h3>

        {tab === "colors" && (
          <div className="form-row">
            <label>
              <span>Color code / ኮድ</span>
              <input
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                placeholder="e.g. C-01"
                required
              />
            </label>
            <label>
              <span>Color Name / የስም ዓይነት</span>
              <input
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="e.g. Indigo Blue / ሰማያዊ"
                required
              />
            </label>
          </div>
        )}

        {tab === "designs" && (
          <label>
            <span>Design name / የዲዛይን ስም</span>
            <input
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="e.g. ZigZag, Diamond, Plain"
              required
            />
          </label>
        )}

        {tab === "yarnTypes" && (
          <label>
            <span>Yarn material name / የጥጥ ዓይነት</span>
            <input
              value={yarnTypeName}
              onChange={(e) => setYarnTypeName(e.target.value)}
              placeholder="e.g. Pure Cotton 20/2, Acrylic"
              required
            />
          </label>
        )}

        {tab === "products" && (
          <>
            <div className="form-row">
              <label>
                <span>Product name / የምርት ስም</span>
                <input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Gabi / ጋቢ"
                  required
                />
              </label>
              <label>
                <span>Base price (ETB) / መነሻ ዋጋ</span>
                <input
                  type="number"
                  step="0.01"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="e.g. 1800"
                  required
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                <span>Standard length (cm) / ቁመት</span>
                <input
                  type="number"
                  value={productLength}
                  onChange={(e) => setProductLength(e.target.value)}
                  placeholder="e.g. 240"
                />
              </label>
              <label>
                <span>Standard width (cm) / ስፋት</span>
                <input
                  type="number"
                  value={productWidth}
                  onChange={(e) => setProductWidth(e.target.value)}
                  placeholder="e.g. 150"
                />
              </label>
            </div>
          </>
        )}

        {tab === "suppliers" && (
          <div className="form-row">
            <label>
              <span>Supplier name / የአቅራቢ ስም</span>
              <input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Bahir Dar Textile SC"
                required
              />
            </label>
            <label>
              <span>Phone number / ስልክ ቁጥር</span>
              <input
                type="tel"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                placeholder="+251 9xx xxx xxx"
              />
            </label>
          </div>
        )}

        {tab === "fabric" && (
          <>
            <label>
              <span>Fabric Product / ምርት</span>
              <select value={fabProductId} onChange={(e) => setFabProductId(e.target.value)}>
                {lookup.products.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <label>
                <span>Warp color / ውርፍ</span>
                <select value={fabWarpId} onChange={(e) => setFabWarpId(e.target.value)}>
                  {lookup.colors.map((c) => (
                    <option key={c.colorId} value={c.colorId}>
                      {c.name} ({c.colorCode})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Weft color / ስፍ</span>
                <select value={fabWeftId} onChange={(e) => setFabWeftId(e.target.value)}>
                  {lookup.colors.map((c) => (
                    <option key={c.colorId} value={c.colorId}>
                      {c.name} ({c.colorCode})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>
                <span>Design pattern / ዲዛይን</span>
                <select value={fabDesignId} onChange={(e) => setFabDesignId(e.target.value)}>
                  <option value="">None / መደበኛ</option>
                  {lookup.designs.map((d) => (
                    <option key={d.designId} value={d.designId}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Variant specific base price (optional)</span>
                <input
                  type="number"
                  step="0.01"
                  value={fabPrice}
                  onChange={(e) => setFabPrice(e.target.value)}
                  placeholder="Defaults to product base price"
                />
              </label>
            </div>
          </>
        )}

        {tab === "yarn" && (
          <div className="form-row">
            <label>
              <span>Yarn Material / ዓይነት</span>
              <select value={yarnTypeId} onChange={(e) => setYarnTypeId(e.target.value)}>
                {lookup.yarnTypes.map((t) => (
                  <option key={t.yarnTypeId} value={t.yarnTypeId}>
                    {t.materialName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Color / ቀለም</span>
              <select value={yarnColorId} onChange={(e) => setYarnColorId(e.target.value)}>
                {lookup.colors.map((c) => (
                  <option key={c.colorId} value={c.colorId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Supplier / አቅራቢ</span>
              <select value={yarnSupplierId} onChange={(e) => setYarnSupplierId(e.target.value)}>
                {lookup.suppliers.map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Base price / kg (optional)</span>
              <input
                type="number"
                step="0.01"
                value={yarnPrice}
                onChange={(e) => setYarnPrice(e.target.value)}
                placeholder="ETB / kg"
              />
            </label>
          </div>
        )}

        {message && <div className="success-msg"><span>✅</span> {message}</div>}
        {error && <div className="error-msg"><span>⚠️</span> {error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save to Catalog / መዝግብ"}
          </button>
        </div>
      </form>

      {/* Catalog Table Card */}
      <div className="table-wrap">
        {tab === "products" && (
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Base Price</th>
                <th>Standard Width</th>
                <th>Standard Length</th>
              </tr>
            </thead>
            <tbody>
              {lookup.products.map((p) => (
                <tr key={p.productId}>
                  <td style={{ fontWeight: 700 }}>{p.name}</td>
                  <td style={{ fontWeight: 600 }}>{p.basePrice} ETB</td>
                  <td>{p.standardWidthCm ? `${p.standardWidthCm} cm` : "—"}</td>
                  <td>{p.standardLengthCm ? `${p.standardLengthCm} cm` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "fabric" && (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Warp Color</th>
                <th>Weft Color</th>
                <th>Design</th>
                <th>SKU</th>
                <th style={{ textAlign: "right" }}>Stock</th>
              </tr>
            </thead>
            <tbody>
              {fabricVariants.map((v) => (
                <tr key={v.fabricVariantId}>
                  <td style={{ fontWeight: 700 }}>{v.product.name}</td>
                  <td>{v.warpColor?.name ?? "—"}</td>
                  <td>{v.weftColor?.name ?? "—"}</td>
                  <td>{v.design?.name ?? "—"}</td>
                  <td style={{ fontFamily: "monospace", color: "var(--accent)", fontWeight: 700 }}>
                    {v.sku}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{v.stockSnapshot} pcs</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "yarn" && (
          <table>
            <thead>
              <tr>
                <th>Material Type</th>
                <th>Color</th>
                <th>Supplier</th>
                <th>SKU</th>
                <th style={{ textAlign: "right" }}>Stock</th>
              </tr>
            </thead>
            <tbody>
              {yarnVariants.map((v) => (
                <tr key={v.yarnVariantId}>
                  <td style={{ fontWeight: 700 }}>{v.yarnType.materialName}</td>
                  <td>{v.color.name}</td>
                  <td>{v.supplier.name}</td>
                  <td style={{ fontFamily: "monospace", color: "var(--accent)", fontWeight: 700 }}>
                    {v.sku}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{v.stockSnapshot} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "colors" && (
          <table>
            <thead>
              <tr>
                <th>Color Code</th>
                <th>Color Name</th>
              </tr>
            </thead>
            <tbody>
              {lookup.colors.map((c) => (
                <tr key={c.colorId}>
                  <td style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>
                    {c.colorCode}
                  </td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "designs" && (
          <table>
            <thead>
              <tr>
                <th>Design ID</th>
                <th>Pattern Name</th>
              </tr>
            </thead>
            <tbody>
              {lookup.designs.map((d) => (
                <tr key={d.designId}>
                  <td style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>
                    #{d.designId}
                  </td>
                  <td style={{ fontWeight: 700 }}>{d.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "yarnTypes" && (
          <table>
            <thead>
              <tr>
                <th>Type ID</th>
                <th>Material Name</th>
              </tr>
            </thead>
            <tbody>
              {lookup.yarnTypes.map((t) => (
                <tr key={t.yarnTypeId}>
                  <td style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>
                    #{t.yarnTypeId}
                  </td>
                  <td style={{ fontWeight: 700 }}>{t.materialName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "suppliers" && (
          <table>
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Phone Number</th>
              </tr>
            </thead>
            <tbody>
              {lookup.suppliers.map((s) => (
                <tr key={s.supplierId}>
                  <td style={{ fontWeight: 700 }}>{s.name}</td>
                  <td>{s.contactPhone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default CatalogPage;
