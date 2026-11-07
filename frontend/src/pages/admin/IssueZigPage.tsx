import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { YarnLinesEditor } from "../../components/YarnLinesEditor";
import {
  catalogService,
  userService,
  workOrderService,
} from "../../infrastructure/services";
import type { Fabric, Weaver, Color, Design } from "../../domain/models";
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
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [yarnLookup, setYarnLookup] = useState<YarnCatalogLookup>({
    colors: [],
    suppliers: [],
    yarnTypes: [],
  });
  const [yarnVariants, setYarnVariants] = useState<any[]>([]);
  const [yarnLines, setYarnLines] = useState<YarnLineDraft[]>([
    createYarnLineDraft(undefined, "0"),
  ]);

  const [fabricId, setFabricId] = useState("");
  const [warpColorId, setWarpColorId] = useState("");
  const [weftColorId, setWeftColorId] = useState("");
  const [designId, setDesignId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!weaverId) return;
    Promise.all([
      userService.getUser(Number(weaverId)).then((u) => {
        const parts = u.fullName.split(" ");
        return {
          weaverId: u.weaverProfile?.weaverId ?? u.userId,
          firstName: parts[0] || u.fullName,
          lastName: parts.slice(1).join(" ") || "",
          phone: u.phone,
          email: u.weaverProfile?.email ?? null,
          bankAccountNumber: u.weaverProfile?.bankAccountNumber ?? null,
        } as Weaver;
      }),
      catalogService.getLookup(),
      catalogService.listYarnVariants(),
    ])
      .then(([w, lookup, yv]) => {
        setWeaver(w);
        setFabrics(lookup.fabrics);
        setColors(lookup.colors);
        setDesigns(lookup.designs);
        setYarnLookup({
          colors: lookup.colors.map((c) => ({
            colorId: c.colorId,
            name: c.name,
            colorCode: c.colorCode ?? "",
          })),
          suppliers: lookup.suppliers.map((s) => ({
            supplierId: s.supplierId,
            name: s.name,
          })),
          yarnTypes: lookup.yarns.map((y) => ({
            yarnTypeId: y.yarnId,
            materialName: y.materialName,
          })),
        });
        setYarnVariants(
          yv.map((item) => ({
            yarnVariantId: item.yarnVariantId,
            sku: item.sku,
            yarnType: { materialName: item.yarn?.materialName ?? "Yarn" },
            color: { name: item.color?.name ?? "Standard" },
            supplier: { name: item.supplier?.name ?? "Cooperative" },
          })),
        );

        if (lookup.fabrics[0]) {
          const first = lookup.fabrics[0];
          setFabricId(String(first.fabricId));
          const p = first.prices?.[0] || first.currentPrice;
          if (p) setUnitPrice(String(p.weaverUnitPrice));
        }
        if (lookup.colors[0]) {
          setWarpColorId(String(lookup.colors[0].colorId));
          setWeftColorId(String(lookup.colors[0].colorId));
        }
        const zigZagId = findZigZagDesignId(lookup.designs as any);
        if (zigZagId) setDesignId(String(zigZagId));
      })
      .catch((err) => setError(err.message));
  }, [weaverId]);

  function handleFabricChange(id: string) {
    setFabricId(id);
    const fab = fabrics.find((f) => String(f.fabricId) === id);
    if (fab) {
      const p = fab.prices?.[0] || fab.currentPrice;
      if (p) setUnitPrice(String(p.weaverUnitPrice));
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!weaverId || !fabricId) return;
    setSaving(true);
    setError("");
    try {
      const parsedYarns = parseYarnLines(yarnLines);
      for (const yl of parsedYarns) {
        if (yl.yarnVariantId) {
          const v = yarnVariants.find((yv) => yv.yarnVariantId === yl.yarnVariantId);
          const stock = v ? Number((v as any).stockSnapshot ?? 0) : 0;
          if (yl.quantity > stock) {
            setError(`Cannot issue ${yl.quantity} pieces of yarn "${v?.sku ?? "yarn"}": available stock is ${stock} pieces.`);
            setSaving(false);
            return;
          }
        }
      }

      await workOrderService.createWorkOrder({
        weaverId: Number(weaverId),
        fabricId: Number(fabricId),
        warpColorId: warpColorId ? Number(warpColorId) : null,
        weftColorId: weftColorId ? Number(weftColorId) : null,
        designId: designId ? Number(designId) : null,
        notes: notes || undefined,
        yarnLines: parsedYarns.map((yl) => ({
          yarnId: Number(yl.yarnTypeId ?? yl.yarnVariantId ?? 1),
          yarnVariantId: yl.yarnVariantId,
          supplierId: yl.supplierId,
          quantityKg: yl.quantity,
          unitPrice: yl.unitPrice,
        })),
      });
      navigate(`/admin/weavers/${weaverId}`);
    } catch (err: any) {
      setError(err.message || "Failed to issue work order");
    } finally {
      setSaving(false);
    }
  }

  if (!weaver) {
    return (
      <div className="page" style={{ padding: "2rem" }}>
        <div className="loading">
          <span>⏳</span> Loading weaver details…
        </div>
      </div>
    );
  }

  const selectedFabric = fabrics.find((f) => String(f.fabricId) === fabricId);

  return (
    <div className="page" style={{ padding: "1.5rem" }}>
      <Link
        to={`/admin/weavers/${weaverId}`}
        className="back-link"
        style={{ textDecoration: "none", color: "#0284c7" }}
      >
        ← Back to {weaver.firstName} {weaver.lastName}
      </Link>

      <div className="page-header" style={{ margin: "1rem 0 1.5rem" }}>
        <div>
          <p
            className="eyebrow"
            style={{
              textTransform: "uppercase",
              fontSize: "0.75rem",
              color: "#64748b",
              margin: 0,
            }}
          >
            አዲስ ዝግ / Issue Work Order
          </p>
          <h1 className="page-title" style={{ margin: "0.25rem 0" }}>
            Issue New Work Order (Zig)
          </h1>
          <p className="page-subtitle" style={{ color: "#64748b", margin: 0 }}>
            Artisan:{" "}
            <strong>
              {weaver.firstName} {weaver.lastName}
            </strong>{" "}
            (#{weaver.weaverId}) &middot; Choose fabric details and assign
            initial yarn pieces.
          </p>
        </div>
      </div>

      <form
        className="card form"
        onSubmit={handleSubmit}
        style={{
          maxWidth: 840,
          background: "#fff",
          padding: "1.5rem",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h3 className="section-title" style={{ margin: "0 0 1rem 0" }}>
          <span>🪢</span> Fabric Details / የጨርቅ ዝርዝር
        </h3>

        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}
          >
            Fabric Type / ዓይነት *
          </label>
          <select
            value={fabricId}
            onChange={(e) => handleFabricChange(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
            }}
          >
            {fabrics.map((f) => (
              <option key={f.fabricId} value={f.fabricId}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {selectedFabric && (
          <div
            style={{
              fontSize: "13px",
              color: "#475569",
              background: "#f8fafc",
              padding: "0.6rem 0.85rem",
              borderRadius: "6px",
              marginBottom: "1rem",
            }}
          >
            📏 Standard Specs:{" "}
            <strong>{selectedFabric.standardWidthCm ?? "—"} cm width</strong> ×{" "}
            <strong>{selectedFabric.standardLengthCm ?? "—"} cm length</strong>{" "}
            &middot; Target Weight:{" "}
            <strong>{selectedFabric.standardWeightG ?? "—"} g</strong>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(240px, 360px)",
            gap: "1rem",
            marginBottom: "1rem",
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
              Piece Unit Rate (ETB) / ዋጋ በቁራጭ *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}
          >
            Pattern Design / ዲዛይን
          </label>
          <select
            value={designId}
            onChange={(e) => setDesignId(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
            }}
          >
            <option value="">None / Standard</option>
            {designs.map((d) => (
              <option key={d.designId} value={d.designId}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1rem",
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
              Warp Color / ውርፍ *
            </label>
            <select
              value={warpColorId}
              onChange={(e) => setWarpColorId(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            >
              {colors.map((c) => (
                <option key={c.colorId} value={c.colorId}>
                  {c.name}
                </option>
              ))}
            </select>
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
              Weft Color / ስፍ *
            </label>
            <select
              value={weftColorId}
              onChange={(e) => setWeftColorId(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            >
              {colors.map((c) => (
                <option key={c.colorId} value={c.colorId}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            borderTop: "1.5px solid #e2e8f0",
            paddingTop: "1.25rem",
            marginTop: "1rem",
          }}
        >
          <h3 className="section-title" style={{ margin: "0 0 0.5rem 0" }}>
            <span>🧶</span> Yarn Given Lines / የሚሰጥ ጥጥ
          </h3>
          <p
            style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 1rem" }}
          >
            Add the number of yarn pieces issued to the artisan for this work
            order.
          </p>
          <YarnLinesEditor
            lines={yarnLines}
            onChange={setYarnLines}
            lookup={yarnLookup}
            yarnVariants={yarnVariants}
            quantityHint="0 = skip this line"
            txnType="issue_zig"
          />
        </div>

        <div style={{ marginTop: "1rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}
          >
            Work Order Notes / Special Instructions
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Expedited batch for export customer..."
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
            }}
          />
        </div>

        {error && (
          <div
            className="error-msg"
            style={{
              padding: "0.75rem",
              background: "#fee2e2",
              color: "#b91c1c",
              borderRadius: "6px",
              marginTop: "1rem",
            }}
          >
            <span>⚠️</span> {error}
          </div>
        )}

        <div
          className="form-actions"
          style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}
        >
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
            style={{
              padding: "0.6rem 1.25rem",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {saving ? "Issuing Zig…" : "✓ Confirm & Issue Zig / ዝግ ስጥ"}
          </button>
          <Link
            to={`/admin/weavers/${weaverId}`}
            className="btn-ghost"
            style={{
              padding: "0.6rem 1.25rem",
              textDecoration: "none",
              color: "#64748b",
            }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default IssueZigPage;
