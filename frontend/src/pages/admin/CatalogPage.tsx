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
      } else if (tab === "yarn") {
        await catalogApi.createYarnVariant({
          yarnTypeId: Number(yarnTypeId),
          colorId: Number(yarnColorId),
          supplierId: Number(yarnSupplierId),
          basePrice: yarnPrice ? Number(yarnPrice) : undefined,
        });
      }
      setMessage("Saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  const tabs: Array<{ key: CatalogTab; label: string }> = [
    { key: "products", label: "Products" },
    { key: "colors", label: "Colors" },
    { key: "designs", label: "Designs" },
    { key: "yarnTypes", label: "Yarn Types" },
    { key: "suppliers", label: "Suppliers" },
    { key: "fabric", label: "Fabric Variants" },
    { key: "yarn", label: "Yarn Variants" },
  ];

  return (
    <section>
      <header className="page-header">
        <div>
          <p className="eyebrow">ካታሎግ / Catalog</p>
          <h2>Manage Products & Variants</h2>
        </div>
      </header>

      <div className="tab-bar">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? "tab active" : "tab"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form className="card form" onSubmit={handleCreate} style={{ marginTop: "1rem" }}>
          <h3>Add New</h3>
          {tab === "colors" && (
            <>
              <label>
                Color code
                <input value={colorCode} onChange={(e) => setColorCode(e.target.value)} required />
              </label>
              <label>
                Name
                <input value={colorName} onChange={(e) => setColorName(e.target.value)} required />
              </label>
            </>
          )}
          {tab === "designs" && (
            <label>
              Design name
              <input value={designName} onChange={(e) => setDesignName(e.target.value)} required />
            </label>
          )}
          {tab === "yarnTypes" && (
            <label>
              Material name
              <input
                value={yarnTypeName}
                onChange={(e) => setYarnTypeName(e.target.value)}
                required
              />
            </label>
          )}
          {tab === "products" && (
            <>
              <label>
                Product name
                <input value={productName} onChange={(e) => setProductName(e.target.value)} required />
              </label>
              <label>
                Base price
                <input value={productPrice} onChange={(e) => setProductPrice(e.target.value)} required />
              </label>
              <div className="form-row">
                <label>
                  Standard length (cm)
                  <input value={productLength} onChange={(e) => setProductLength(e.target.value)} />
                </label>
                <label>
                  Standard width (cm)
                  <input value={productWidth} onChange={(e) => setProductWidth(e.target.value)} />
                </label>
              </div>
            </>
          )}
          {tab === "suppliers" && (
            <>
              <label>
                Supplier name
                <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required />
              </label>
              <label>
                Phone
                <input value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} />
              </label>
            </>
          )}
          {tab === "fabric" && (
            <>
              <label>
                Product
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
                  Warp color
                  <select value={fabWarpId} onChange={(e) => setFabWarpId(e.target.value)}>
                    {lookup.colors.map((c) => (
                      <option key={c.colorId} value={c.colorId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Weft color
                  <select value={fabWeftId} onChange={(e) => setFabWeftId(e.target.value)}>
                    {lookup.colors.map((c) => (
                      <option key={c.colorId} value={c.colorId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Design (optional)
                <select value={fabDesignId} onChange={(e) => setFabDesignId(e.target.value)}>
                  <option value="">None</option>
                  {lookup.designs.map((d) => (
                    <option key={d.designId} value={d.designId}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Base price
                <input value={fabPrice} onChange={(e) => setFabPrice(e.target.value)} />
              </label>
            </>
          )}
          {tab === "yarn" && (
            <>
              <label>
                Yarn type
                <select value={yarnTypeId} onChange={(e) => setYarnTypeId(e.target.value)}>
                  {lookup.yarnTypes.map((t) => (
                    <option key={t.yarnTypeId} value={t.yarnTypeId}>
                      {t.materialName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Color
                <select value={yarnColorId} onChange={(e) => setYarnColorId(e.target.value)}>
                  {lookup.colors.map((c) => (
                    <option key={c.colorId} value={c.colorId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Supplier
                <select value={yarnSupplierId} onChange={(e) => setYarnSupplierId(e.target.value)}>
                  {lookup.suppliers.map((s) => (
                    <option key={s.supplierId} value={s.supplierId}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Base price
                <input value={yarnPrice} onChange={(e) => setYarnPrice(e.target.value)} />
              </label>
            </>
          )}
          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}
          <button type="submit">Save</button>
        </form>

      <div className="card table-card" style={{ marginTop: "1rem" }}>
        {tab === "products" && (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Width</th>
                <th>Length</th>
              </tr>
            </thead>
            <tbody>
              {lookup.products.map((p) => (
                <tr key={p.productId}>
                  <td>{p.name}</td>
                  <td>{p.basePrice}</td>
                  <td>{p.standardWidthCm ?? "—"}</td>
                  <td>{p.standardLengthCm ?? "—"}</td>
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
                <th>Warp</th>
                <th>Weft</th>
                <th>Design</th>
                <th>SKU</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {fabricVariants.map((v) => (
                <tr key={v.fabricVariantId}>
                  <td>{v.product.name}</td>
                  <td>{v.warpColor?.name ?? "—"}</td>
                  <td>{v.weftColor?.name ?? "—"}</td>
                  <td>{v.design?.name ?? "—"}</td>
                  <td>{v.sku}</td>
                  <td>{v.stockSnapshot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === "yarn" && (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Color</th>
                <th>Supplier</th>
                <th>SKU</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {yarnVariants.map((v) => (
                <tr key={v.yarnVariantId}>
                  <td>{v.yarnType.materialName}</td>
                  <td>{v.color.name}</td>
                  <td>{v.supplier.name}</td>
                  <td>{v.sku}</td>
                  <td>{v.stockSnapshot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === "colors" && (
          <ul className="record-list">
            {lookup.colors.map((c) => (
              <li key={c.colorId}>
                <strong>{c.colorCode}</strong> {c.name}
              </li>
            ))}
          </ul>
        )}
        {tab === "designs" && (
          <ul className="record-list">
            {lookup.designs.map((d) => (
              <li key={d.designId}>{d.name}</li>
            ))}
          </ul>
        )}
        {tab === "yarnTypes" && (
          <ul className="record-list">
            {lookup.yarnTypes.map((t) => (
              <li key={t.yarnTypeId}>{t.materialName}</li>
            ))}
          </ul>
        )}
        {tab === "suppliers" && (
          <ul className="record-list">
            {lookup.suppliers.map((s) => (
              <li key={s.supplierId}>
                {s.name}
                {s.contactPhone ? ` · ${s.contactPhone}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}