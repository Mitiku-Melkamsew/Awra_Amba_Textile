import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  catalogApi,
  workOrdersApi,
  type Color,
  type Design,
  type Fabric,
  type FabricVariant,
  type Weaver,
} from "../../api";
import { userService, workOrderService } from "../../infrastructure/services";
import { fabricNameFromParts, fabricVariantName } from "../../utils/variantNames";
import { findZigZagDesignId } from "../../utils/defaultDesign";

interface YarnLineItem {
  id: string;
  yarnVariantId: string;
  quantity: string;
  unitPrice: string;
}

export function IssueZigPage() {
  const { weaverId } = useParams<{ weaverId: string }>();
  const navigate = useNavigate();

  // Core data states
  const [weaver, setWeaver] = useState<Weaver | null>(null);
  const [lastZig, setLastZig] = useState<any | null>(null);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [fabricVariants, setFabricVariants] = useState<FabricVariant[]>([]);
  const [yarnVariants, setYarnVariants] = useState<any[]>([]);

  // Selected Fabric states
  const [fabricId, setFabricId] = useState("");
  const [warpColorId, setWarpColorId] = useState("");
  const [weftColorId, setWeftColorId] = useState("");
  const [designId, setDesignId] = useState("");
  const [weaverRate, setWeaverRate] = useState("0");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");

  // Yarn Lines
  const [yarnLines, setYarnLines] = useState<YarnLineItem[]>([
    { id: "yarn-1", yarnVariantId: "", quantity: "", unitPrice: "" },
  ]);

  // Modal State for Image 1 (Fabric Selection / Change)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalFabricId, setModalFabricId] = useState("");
  const [modalWarpColorId, setModalWarpColorId] = useState("");
  const [modalWeftColorId, setModalWeftColorId] = useState("");
  const [modalDesignId, setModalDesignId] = useState("");

  // Submission & Feedback
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    if (!weaverId) return;
    setLoading(true);

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
      catalogApi.lookup(),
      catalogApi.fabricVariants(),
      catalogApi.yarnVariants(),
      workOrdersApi.list({ weaverId: Number(weaverId) }).catch(() => []),
    ])
      .then(([w, lookup, fv, yv, orders]) => {
        setWeaver(w);
        setFabrics(lookup.fabrics);
        setColors(lookup.colors);
        setDesigns(lookup.designs);
        setFabricVariants(fv);

        // Store yarn variants with accurate stockSnapshot and price
        const enrichedYarnVariants = (yv as any[]).map((y) => ({
          ...y,
          stockSnapshot: Number(y.stockSnapshot ?? 0),
          sellingPrice: Number(y.sellingPrice ?? y.purchasePrice ?? y.basePrice ?? 0),
        }));
        setYarnVariants(enrichedYarnVariants);

        // Determine weaver's last zig
        const previousOrders = Array.isArray(orders) ? orders : [];
        const prev = previousOrders[0] ?? null;
        setLastZig(prev);

        // Initialize fabric selection
        let initialFabric = lookup.fabrics[0];
        let initialWarp = lookup.colors[0];
        let initialWeft = lookup.colors[0];
        let initialDesignId = String(findZigZagDesignId(lookup.designs as any) ?? "");

        if (prev?.fabricVariant) {
          const pv = prev.fabricVariant;
          if (pv.fabric) initialFabric = pv.fabric;
          if (pv.warpColor) initialWarp = pv.warpColor;
          if (pv.weftColor) initialWeft = pv.weftColor;
          if (pv.design) initialDesignId = String(pv.design.designId);
        }

        if (initialFabric) {
          setFabricId(String(initialFabric.fabricId));
          const p = (initialFabric as any).prices?.[0] || (initialFabric as any).currentPrice;
          if (p) setWeaverRate(String(p.weaverUnitPrice ?? p.weaverRate ?? "0"));
        }
        if (initialWarp) setWarpColorId(String(initialWarp.colorId));
        if (initialWeft) setWeftColorId(String(initialWeft.colorId));
        if (initialDesignId) setDesignId(initialDesignId);

        // Initialize first yarn line if yarn variants exist
        const inStockYarns = enrichedYarnVariants.filter((y) => y.stockSnapshot > 0);
        const defaultYarn = inStockYarns[0] ?? enrichedYarnVariants[0];
        if (defaultYarn) {
          setYarnLines([
            {
              id: `yarn-${Date.now()}-1`,
              yarnVariantId: String(defaultYarn.yarnVariantId),
              quantity: "40",
              unitPrice: String(defaultYarn.sellingPrice || defaultYarn.basePrice || "0"),
            },
          ]);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load data"))
      .finally(() => setLoading(false));
  }, [weaverId]);

  // Selected Fabric object
  const selectedFabric = useMemo(() => {
    return fabrics.find((f) => String(f.fabricId) === fabricId) ?? fabrics[0];
  }, [fabrics, fabricId]);

  const selectedWarpColor = useMemo(() => {
    return colors.find((c) => String(c.colorId) === warpColorId) ?? colors[0];
  }, [colors, warpColorId]);

  const selectedWeftColor = useMemo(() => {
    return colors.find((c) => String(c.colorId) === weftColorId) ?? colors[0];
  }, [colors, weftColorId]);

  const selectedDesign = useMemo(() => {
    return designs.find((d) => String(d.designId) === designId) ?? null;
  }, [designs, designId]);

  // Formatted Fabric Display Name (e.g. "medebegna · biret · geberdin")
  const fabricDisplayName = useMemo(() => {
    if (!selectedFabric) return "Selecting fabric...";
    const prodName = selectedFabric.name;
    const warp = selectedWarpColor?.name;
    const weft = selectedWeftColor?.name;
    const des = selectedDesign?.name;
    return fabricNameFromParts(prodName, warp, weft, des).split("-").join(" · ");
  }, [selectedFabric, selectedWarpColor, selectedWeftColor, selectedDesign]);

  // Fabric specs for reference
  const fabricSpecs = useMemo(() => {
    const weight = selectedFabric?.standardWeightG ?? 64;
    const length = selectedFabric?.standardLengthCm ?? 200;
    const width = selectedFabric?.standardWidthCm ?? 100;
    return { weight, length, width };
  }, [selectedFabric]);

  // Format yarn display name (e.g. "cotton · white")
  function formatYarnName(yv: any) {
    const mat = yv.yarnType?.materialName ?? yv.yarn?.name ?? "Yarn";
    const col = yv.color?.name ?? "Standard";
    return `${mat} · ${col}`;
  }

  // Handle "Use the same setup" button from Image 2
  function handleUseSameSetup() {
    if (!lastZig) return;
    if (lastZig.fabricVariant) {
      const pv = lastZig.fabricVariant;
      if (pv.fabric?.fabricId) setFabricId(String(pv.fabric.fabricId));
      else if (pv.fabricId) setFabricId(String(pv.fabricId));

      if (pv.warpColor?.colorId) setWarpColorId(String(pv.warpColor.colorId));
      if (pv.weftColor?.colorId) setWeftColorId(String(pv.weftColor.colorId));
      if (pv.design?.designId) setDesignId(String(pv.design.designId));

      const price = pv.basePrice ?? pv.currentPrice?.weaverUnitPrice;
      if (price) setWeaverRate(String(price));
      setSelectedVariantId(String(pv.fabricVariantId));
    } else if (lastZig.fabric?.fabricId) {
      setFabricId(String(lastZig.fabric.fabricId));
    }

    if (lastZig.yarnGiven && Array.isArray(lastZig.yarnGiven) && lastZig.yarnGiven.length > 0) {
      setYarnLines(
        lastZig.yarnGiven.map((yg: any, idx: number) => {
          const matchedVariant = yarnVariants.find(
            (y) => y.yarnVariantId === (yg.yarnVariant?.yarnVariantId ?? yg.yarnVariantId),
          );
          const price = matchedVariant?.sellingPrice ?? yg.unitPrice ?? 0;
          return {
            id: `yarn-repeat-${Date.now()}-${idx}`,
            yarnVariantId: String(yg.yarnVariant?.yarnVariantId ?? yg.yarnVariantId ?? ""),
            quantity: String(yg.quantity ?? "40"),
            unitPrice: String(price),
          };
        }),
      );
    }
  }

  // Yarn Lines Handlers
  function handleAddYarnLine() {
    const inStock = yarnVariants.filter((y) => y.stockSnapshot > 0);
    const chosen = inStock[0] ?? yarnVariants[0];
    const newRow: YarnLineItem = {
      id: `yarn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      yarnVariantId: chosen ? String(chosen.yarnVariantId) : "",
      quantity: "40",
      unitPrice: chosen ? String(chosen.sellingPrice ?? chosen.basePrice ?? "0") : "0",
    };
    setYarnLines((prev) => [...prev, newRow]);
  }

  function handleRemoveYarnLine(id: string) {
    setYarnLines((prev) => prev.filter((l) => l.id !== id));
  }

  function handleYarnVariantChange(lineId: string, variantIdStr: string) {
    const matched = yarnVariants.find((y) => String(y.yarnVariantId) === variantIdStr);
    const price = matched?.sellingPrice ?? matched?.basePrice ?? 0;
    setYarnLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? {
              ...l,
              yarnVariantId: variantIdStr,
              unitPrice: price ? String(price) : l.unitPrice,
            }
          : l,
      ),
    );
  }

  function handleQuantityChange(lineId: string, qtyStr: string) {
    setYarnLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, quantity: qtyStr } : l)),
    );
  }

  // Modal (Image 1) handlers
  function openFabricModal() {
    setModalFabricId(fabricId);
    setModalWarpColorId(warpColorId);
    setModalWeftColorId(weftColorId);
    setModalDesignId(designId);
    setModalSearch("");
    setIsModalOpen(true);
  }

  function handleSelectModalVariant(variant: FabricVariant) {
    if (variant.fabric?.fabricId) setModalFabricId(String(variant.fabric.fabricId));
    else if (variant.fabricId) setModalFabricId(String(variant.fabricId));

    if (variant.warpColor?.colorId) setModalWarpColorId(String(variant.warpColor.colorId));
    if (variant.weftColor?.colorId) setModalWeftColorId(String(variant.weftColor.colorId));
    if (variant.design?.designId) setModalDesignId(String(variant.design.designId));
    setSelectedVariantId(String(variant.fabricVariantId));
  }

  function handleApplyModalFabric() {
    setFabricId(modalFabricId);
    setWarpColorId(modalWarpColorId);
    setWeftColorId(modalWeftColorId);
    setDesignId(modalDesignId);

    const match = fabricVariants.find(
      (v) =>
        String(v.fabricId ?? v.fabric?.fabricId) === modalFabricId &&
        String(v.warpColorId ?? v.warpColor?.colorId) === modalWarpColorId &&
        String(v.weftColorId ?? v.weftColor?.colorId) === modalWeftColorId &&
        String(v.designId ?? v.design?.designId) === modalDesignId,
    );
    if (match) {
      setSelectedVariantId(String(match.fabricVariantId));
    }

    const fab = fabrics.find((f) => String(f.fabricId) === modalFabricId);
    if (fab) {
      const p = (fab as any).prices?.[0] || (fab as any).currentPrice;
      if (p) setWeaverRate(String(p.weaverUnitPrice ?? p.weaverRate ?? "0"));
    }
    setIsModalOpen(false);
  }

  // Filtered fabric variants for modal search (Image 1)
  const filteredModalVariants = useMemo(() => {
    if (!modalSearch.trim()) {
      return fabricVariants.slice(0, 8);
    }
    const q = modalSearch.toLowerCase().trim();
    return fabricVariants.filter((v) => {
      const name = fabricVariantName(v).toLowerCase();
      const sku = (v.sku || "").toLowerCase();
      return name.includes(q) || sku.includes(q);
    });
  }, [fabricVariants, modalSearch]);

  // Recently used fabric chips (Image 1)
  const recentlyUsedPills = useMemo(() => {
    const list: Array<{ label: string; variant: FabricVariant }> = [];
    fabricVariants.slice(0, 3).forEach((v) => {
      const label = fabricVariantName(v).split("-").join(" · ");
      list.push({ label, variant: v });
    });
    return list;
  }, [fabricVariants]);

  // Validation & Calculation for Sidebar Summary (Image 2)
  const lineCalculations = useMemo(() => {
    return yarnLines.map((line, idx) => {
      const variant = yarnVariants.find((y) => String(y.yarnVariantId) === line.yarnVariantId);
      const stock = variant ? Number(variant.stockSnapshot ?? 0) : 0;
      const qty = Number(line.quantity || 0);
      const price = Number(line.unitPrice || variant?.sellingPrice || 0);
      const stockAfter = stock - qty;
      const isExceeded = Boolean(line.yarnVariantId && qty > stock);
      const isMissingVariant = !line.yarnVariantId;
      const isInvalidQty = Number.isNaN(qty) || qty < 0;

      return {
        line,
        idx,
        variant,
        stock,
        qty,
        price,
        lineTotal: qty * price,
        stockAfter,
        isExceeded,
        isMissingVariant,
        isInvalidQty,
      };
    });
  }, [yarnLines, yarnVariants]);

  const totalLines = useMemo(
    () => lineCalculations.filter((c) => !c.isMissingVariant && c.qty > 0).length,
    [lineCalculations],
  );

  const totalQuantity = useMemo(
    () => lineCalculations.reduce((acc, c) => acc + (c.qty > 0 ? c.qty : 0), 0),
    [lineCalculations],
  );

  const totalYarnValue = useMemo(
    () => lineCalculations.reduce((acc, c) => acc + (c.qty > 0 ? c.lineTotal : 0), 0),
    [lineCalculations],
  );

  const validationProblems = useMemo(() => {
    const problems: string[] = [];
    if (!fabricId) problems.push("Please select a fabric type.");

    lineCalculations.forEach((c) => {
      if (c.isMissingVariant) {
        problems.push(`Yarn line ${c.idx + 1}: please choose a yarn variant or remove this line.`);
      } else if (c.isInvalidQty) {
        problems.push(`Yarn line ${c.idx + 1}: quantity cannot be negative.`);
      } else if (c.isExceeded) {
        problems.push(
          `Yarn line ${c.idx + 1} is more than the stock available (only ${c.stock} in stock).`,
        );
      }
    });

    return problems;
  }, [fabricId, lineCalculations]);

  // Form Submit Handler
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!weaverId || validationProblems.length > 0) return;
    setSaving(true);
    setError("");

    try {
      let finalVariantId = selectedVariantId ? Number(selectedVariantId) : 0;
      if (!finalVariantId) {
        const match = fabricVariants.find(
          (v) =>
            String(v.fabricId ?? v.fabric?.fabricId) === fabricId &&
            String(v.warpColorId ?? v.warpColor?.colorId) === warpColorId &&
            String(v.weftColorId ?? v.weftColor?.colorId) === weftColorId &&
            String(v.designId ?? v.design?.designId) === designId,
        );
        if (match) {
          finalVariantId = match.fabricVariantId;
        } else if (fabricId) {
          const createdFv = await catalogApi.createFabricVariant({
            fabricId: Number(fabricId),
            warpColorId: warpColorId ? Number(warpColorId) : null,
            weftColorId: weftColorId ? Number(weftColorId) : null,
            designId: designId ? Number(designId) : null,
          });
          finalVariantId = createdFv.fabricVariantId;
        }
      }

      if (!finalVariantId) {
        throw new Error("Please select a valid fabric variant");
      }

      await workOrderService.createWorkOrder({
        weaverUserId: Number(weaverId),
        fabricVariantId: finalVariantId,
        yarnLines: lineCalculations
          .filter((c) => c.line.yarnVariantId && c.qty > 0)
          .map((c) => ({
            yarnVariantId: Number(c.line.yarnVariantId),
            quantity: c.qty,
            unitPrice: c.price,
          })),
      });

      navigate(`/admin/weavers/${weaverId}`);
    } catch (err: any) {
      setError(err.message || "Failed to issue work order");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !weaver) {
    return (
      <div className="page" style={{ padding: "3rem 2rem", textAlign: "center" }}>
        <div style={{ fontSize: "1.2rem", color: "var(--text-muted, #64748b)" }}>
          ⏳ Loading work order setup for artisan…
        </div>
      </div>
    );
  }

  const lastZigFabricTitle = lastZig
    ? lastZig.fabricVariant
      ? fabricVariantName(lastZig.fabricVariant).split("-").join(" · ")
      : lastZig.fabric?.name ?? "Fabric"
    : null;

  return (
    <div className="page" style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1.75rem" }}>
      {/* Top Breadcrumb Link (Image 2) */}
      <Link
        to={`/admin/weavers/${weaverId}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          textDecoration: "none",
          color: "var(--brand, #c2410c)",
          fontSize: "0.88rem",
          fontWeight: 600,
          marginBottom: "0.75rem",
        }}
      >
        <span>‹</span> {weaver.firstName} {weaver.lastName}
      </Link>

      {/* Page Header (Image 2) */}
      <div style={{ marginBottom: "1.25rem" }}>
        <p
          style={{
            margin: 0,
            textTransform: "uppercase",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "var(--brand, #c2410c)",
            letterSpacing: "0.5px",
          }}
        >
          አዲስ ዝግ · NEW ZIG
        </p>
        <h1
          style={{
            margin: "0.2rem 0 0",
            fontSize: "1.85rem",
            fontWeight: 800,
            color: "var(--text-main, #0f172a)",
          }}
        >
          Issue zig for {weaver.firstName} {weaver.lastName}
        </h1>
      </div>

      {/* Top Banner: Last zig for this weaver (Image 2) */}
      {lastZig && (
        <div
          style={{
            background: "#fff7ed",
            border: "1px solid #ffedd5",
            borderRadius: "10px",
            padding: "0.85rem 1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ fontSize: "0.92rem", color: "#9a3412" }}>
            Last zig for this weaver:{" "}
            <strong>
              {lastZig.zigId} · {lastZigFabricTitle}
            </strong>
          </div>
          <button
            type="button"
            onClick={handleUseSameSetup}
            style={{
              background: "#ffffff",
              border: "1px solid #fdba74",
              color: "#c2410c",
              fontWeight: 700,
              fontSize: "0.85rem",
              padding: "0.45rem 0.9rem",
              borderRadius: "8px",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            Use the same setup
          </button>
        </div>
      )}

      {/* Main Two-Column Layout (Image 2) */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.85fr) minmax(300px, 1.15fr)",
            gap: "1.75rem",
            alignItems: "start",
          }}
        >
          {/* LEFT COLUMN: Main Form Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Card 1: Fabric · ጨርቅ (Image 2) */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid var(--border, #e2e8f0)",
                borderRadius: "12px",
                padding: "1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <h2
                style={{
                  margin: "0 0 1rem",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "var(--text-main, #0f172a)",
                }}
              >
                Fabric · ጨርቅ
              </h2>

              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#475569",
                  marginBottom: "0.35rem",
                }}
              >
                Fabric
              </label>

              {/* Selected Fabric Display Box (Image 2) */}
              <div
                style={{
                  background: "#fffaf5",
                  border: "1px solid #fed7aa",
                  borderRadius: "8px",
                  padding: "0.85rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "var(--brand, #ea580c)",
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: "#7c2d12" }}>
                    {fabricDisplayName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openFabricModal}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #fed7aa",
                    color: "#9a3412",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    padding: "0.35rem 0.85rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Change
                </button>
              </div>

              {/* Reference Sub-Box (Image 2) */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "0.85rem 1rem",
                  fontSize: "0.85rem",
                  color: "#475569",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "0.35rem",
                  }}
                >
                  <span>ℹ️</span> For reference · not saved on the zig
                </div>
                <div style={{ marginBottom: "0.2rem" }}>
                  Fabric standard: weight {fabricSpecs.weight} g · {fabricSpecs.length} × {fabricSpecs.width} cm
                </div>
                <div>
                  Weaver rate today: {weaverRate} ETB, applied when fabric is returned
                </div>
              </div>
            </div>

            {/* Card 2: Yarn to give · የሚሰጥ ጥጥ (Image 2) */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid var(--border, #e2e8f0)",
                borderRadius: "12px",
                padding: "1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1.25rem",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--text-main, #0f172a)",
                  }}
                >
                  Yarn to give · የሚሰጥ ጥጥ
                </h2>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  Stock is checked as you type
                </span>
              </div>

              {/* Table Headers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.8fr 1.1fr 1.1fr 1.6fr 40px",
                  gap: "0.85rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: "0.6rem",
                  padding: "0 0.25rem",
                }}
              >
                <div>Yarn</div>
                <div>Quantity</div>
                <div>Price</div>
                <div>Stock after</div>
                <div />
              </div>

              {/* Table Rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {yarnLines.length === 0 ? (
                  <div
                    style={{
                      padding: "1.5rem",
                      textAlign: "center",
                      background: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px dashed #cbd5e1",
                      color: "#64748b",
                      fontSize: "0.88rem",
                    }}
                  >
                    No yarn lines added. This zig will be assigned without yarn. Click &ldquo;+ Add yarn line&rdquo; below to issue yarn.
                  </div>
                ) : (
                  lineCalculations.map((item) => {
                    const { line, stock, isExceeded, isInvalidQty } = item;
                    const hasStockProblem = isExceeded;
                    const stockAfterNum = stock - item.qty;

                    return (
                      <div
                        key={line.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.8fr 1.1fr 1.1fr 1.6fr 40px",
                          gap: "0.85rem",
                          alignItems: "center",
                          background: "#ffffff",
                          padding: "0.25rem 0",
                        }}
                      >
                        {/* Yarn Dropdown */}
                        <div>
                          <select
                            value={line.yarnVariantId}
                            onChange={(e) => handleYarnVariantChange(line.id, e.target.value)}
                            style={{
                              width: "100%",
                              height: 40,
                              padding: "0 0.65rem",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontSize: "0.9rem",
                              background: "#ffffff",
                            }}
                          >
                            <option value="">-- Choose yarn --</option>
                            {yarnVariants.map((y) => (
                              <option key={y.yarnVariantId} value={y.yarnVariantId}>
                                {formatYarnName(y)} ({y.stockSnapshot} pcs in stock)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity Input */}
                        <div>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={line.quantity}
                            onChange={(e) => handleQuantityChange(line.id, e.target.value)}
                            placeholder="e.g. 40"
                            style={{
                              width: "100%",
                              height: 40,
                              padding: "0 0.65rem",
                              borderRadius: "6px",
                              fontSize: "0.95rem",
                              fontWeight: 600,
                              border: hasStockProblem ? "1.5px solid #f87171" : "1px solid #cbd5e1",
                              background: hasStockProblem ? "#fef2f2" : "#ffffff",
                              color: hasStockProblem ? "#991b1b" : "inherit",
                            }}
                          />
                        </div>

                        {/* Price Column */}
                        <div>
                          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>
                            {item.price} ETB
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>price list</div>
                        </div>

                        {/* Stock After Pill Indicator (Image 2) */}
                        <div>
                          {!line.yarnVariantId ? (
                            <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>—</span>
                          ) : isInvalidQty ? (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "0.25rem 0.6rem",
                                borderRadius: "9999px",
                                fontSize: "12px",
                                fontWeight: 600,
                                background: "#f1f5f9",
                                color: "#475569",
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              {stock} in stock
                            </span>
                          ) : !isExceeded ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                padding: "0.25rem 0.65rem",
                                borderRadius: "9999px",
                                fontSize: "12px",
                                fontWeight: 600,
                                background: "#f0fdf4",
                                color: "#15803d",
                                border: "1px solid #bbf7d0",
                              }}
                            >
                              <span>✓</span> {stock} → {stockAfterNum}
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                padding: "0.25rem 0.65rem",
                                borderRadius: "9999px",
                                fontSize: "12px",
                                fontWeight: 600,
                                background: "#fef2f2",
                                color: "#dc2626",
                                border: "1px solid #fecaca",
                              }}
                            >
                              <span>⚠</span> {stock > 0 ? `Only ${stock} in stock` : "0 in stock"}
                            </span>
                          )}
                        </div>

                        {/* Delete Icon */}
                        <div style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveYarnLine(line.id)}
                            title="Remove yarn line"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "1.1rem",
                              color: "#94a3b8",
                              padding: "0.25rem",
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Yarn Line Button */}
              <button
                type="button"
                onClick={handleAddYarnLine}
                style={{
                  width: "100%",
                  marginTop: "1.25rem",
                  padding: "0.75rem",
                  border: "1.5px dashed #fed7aa",
                  background: "#fffaf5",
                  borderRadius: "8px",
                  color: "var(--brand, #c2410c)",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.35rem",
                }}
              >
                <span>+</span> Add yarn line
              </button>

              <div style={{ marginTop: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#64748b", marginBottom: "0.25rem" }}>
                  Work order notes / special instructions (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Special order, expedited weave..."
                  style={{ width: "100%", height: 38, padding: "0 0.65rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Summary Sidebar (Image 2) */}
          <div style={{ position: "sticky", top: "1.5rem" }}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid var(--border, #e2e8f0)",
                borderRadius: "12px",
                padding: "1.5rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 1.25rem",
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: "var(--text-main, #0f172a)",
                }}
              >
                Summary
              </h3>

              {/* Summary Rows (Image 2) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                  fontSize: "0.88rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Weaver</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>
                    {weaver.firstName} {weaver.lastName}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                  <span style={{ color: "#64748b" }}>Fabric</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: "#0f172a",
                      textAlign: "right",
                      maxWidth: 190,
                      wordBreak: "break-word",
                    }}
                  >
                    {fabricDisplayName}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Yarn</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>
                    {totalLines === 0
                      ? "0 lines · 0 pcs (No yarn)"
                      : `${totalLines} line${totalLines > 1 ? "s" : ""} · ${totalQuantity} pcs`}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Yarn value charged</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>
                    {totalYarnValue.toFixed(2)} ETB
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Zig ID</span>
                  <span style={{ fontWeight: 600, color: "#64748b", fontStyle: "italic" }}>
                    Assigned when issued
                  </span>
                </div>
              </div>

              {/* Problem Alert Box (Image 2) */}
              {validationProblems.length > 0 && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "0.85rem 1rem",
                    marginBottom: "1.25rem",
                    color: "#991b1b",
                    fontSize: "0.85rem",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      marginBottom: "0.35rem",
                    }}
                  >
                    <span>⚠</span> {validationProblems.length} problem
                    {validationProblems.length > 1 ? "s" : ""} to fix
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.45 }}>
                    {validationProblems.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Error message from backend */}
              {error && (
                <div
                  style={{
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    color: "#b91c1c",
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Action Buttons (Image 2) */}
              <button
                type="submit"
                disabled={saving || validationProblems.length > 0}
                style={{
                  width: "100%",
                  height: 44,
                  background:
                    validationProblems.length > 0
                      ? "#e2e8f0"
                      : "var(--brand, #c2410c)",
                  color: validationProblems.length > 0 ? "#94a3b8" : "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: validationProblems.length > 0 ? "not-allowed" : "pointer",
                  marginBottom: "0.75rem",
                  transition: "background 0.15s ease",
                }}
              >
                {saving ? "Issuing zig…" : "Issue zig · ዝግ ስጥ"}
              </button>

              <Link
                to={`/admin/weavers/${weaverId}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: 40,
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  textDecoration: "none",
                  marginBottom: "1rem",
                }}
              >
                Cancel
              </Link>

              {/* Footnote (Image 2) */}
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  lineHeight: 1.45,
                  color: "#64748b",
                  textAlign: "center",
                }}
              >
                Issuing takes the yarn out of stock right away. The yarn value is charged to the weaver at settlement.
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* FABRIC SELECTION MODAL (Image 1: Record Fabric Return / Changing Fabric) */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: 520,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              padding: "1.75rem",
              border: "1px solid #e2e8f0",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Modal Header (Image 1) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "var(--text-main, #0f172a)",
                }}
              >
                Select fabric / ጨርቅ ምረጡ
              </h3>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Changing fabric</span>
            </div>

            {/* Find existing fabric Search (Image 1) */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "0.4rem",
                }}
              >
                Find an existing fabric
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                >
                  🔍
                </span>
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="e.g. biret geberdin"
                  style={{
                    width: "100%",
                    height: 42,
                    padding: "0 0.75rem 0 2.25rem",
                    borderRadius: "8px",
                    border: "1.5px solid #fed7aa",
                    fontSize: "0.95rem",
                    background: "#ffffff",
                    boxShadow: "0 0 0 2px rgba(254, 215, 170, 0.2)",
                  }}
                />
              </div>
            </div>

            {/* Search Results List (Image 1) */}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                overflow: "hidden",
                marginBottom: "1rem",
                maxHeight: 180,
                overflowY: "auto",
              }}
            >
              {filteredModalVariants.length === 0 ? (
                <div style={{ padding: "0.85rem", fontSize: "0.85rem", color: "#94a3b8", textAlign: "center" }}>
                  No matching fabric variants found
                </div>
              ) : (
                filteredModalVariants.map((v) => {
                  const isCurrent =
                    String(v.fabricId ?? v.fabric?.fabricId) === modalFabricId &&
                    String(v.warpColorId ?? v.warpColor?.colorId) === modalWarpColorId &&
                    String(v.weftColorId ?? v.weftColor?.colorId) === modalWeftColorId &&
                    String(v.designId ?? v.design?.designId) === modalDesignId;

                  const title = fabricVariantName(v).split("-").join(" · ");

                  return (
                    <div
                      key={v.fabricVariantId}
                      onClick={() => handleSelectModalVariant(v)}
                      style={{
                        padding: "0.75rem 1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        borderBottom: "1px solid #f1f5f9",
                        background: isCurrent ? "#fffaf5" : "#ffffff",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) e.currentTarget.style.background = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) e.currentTarget.style.background = "#ffffff";
                      }}
                    >
                      <span style={{ fontSize: "0.92rem", fontWeight: isCurrent ? 700 : 500, color: "#1e293b" }}>
                        {title}
                      </span>
                      {isCurrent && (
                        <span
                          style={{
                            background: "#dcfce7",
                            color: "#15803d",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "0.15rem 0.55rem",
                            borderRadius: "9999px",
                          }}
                        >
                          Current
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Recently Used Pills (Image 1) */}
            {recentlyUsedPills.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "#64748b",
                    marginBottom: "0.4rem",
                  }}
                >
                  Recently used
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {recentlyUsedPills.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectModalVariant(p.variant)}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        padding: "0.25rem 0.65rem",
                        borderRadius: "9999px",
                        fontSize: "0.8rem",
                        color: "#334155",
                        cursor: "pointer",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Divider: Not in the list? Describe it (Image 1) */}
            <div
              style={{
                position: "relative",
                textAlign: "center",
                margin: "1.25rem 0",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  right: 0,
                  height: 1,
                  background: "#e2e8f0",
                }}
              />
              <span
                style={{
                  position: "relative",
                  background: "#ffffff",
                  padding: "0 0.75rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#64748b",
                }}
              >
                Not in the list? Describe it
              </span>
            </div>

            {/* 2x2 Grid of Dropdowns (Image 1) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.85rem",
                marginBottom: "0.75rem",
              }}
            >
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem", color: "#475569" }}>
                  Fabric type
                </label>
                <select
                  value={modalFabricId}
                  onChange={(e) => setModalFabricId(e.target.value)}
                  style={{ width: "100%", height: 38, borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 0.5rem" }}
                >
                  {fabrics.map((f) => (
                    <option key={f.fabricId} value={f.fabricId}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem", color: "#475569" }}>
                  Design
                </label>
                <select
                  value={modalDesignId}
                  onChange={(e) => setModalDesignId(e.target.value)}
                  style={{ width: "100%", height: 38, borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 0.5rem" }}
                >
                  <option value="">None / Standard</option>
                  {designs.map((d) => (
                    <option key={d.designId} value={d.designId}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem", color: "#475569" }}>
                  Warp color
                </label>
                <select
                  value={modalWarpColorId}
                  onChange={(e) => setModalWarpColorId(e.target.value)}
                  style={{ width: "100%", height: 38, borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 0.5rem" }}
                >
                  {colors.map((c) => (
                    <option key={c.colorId} value={c.colorId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem", color: "#475569" }}>
                  Weft color
                </label>
                <select
                  value={modalWeftColorId}
                  onChange={(e) => setModalWeftColorId(e.target.value)}
                  style={{ width: "100%", height: 38, borderRadius: "6px", border: "1px solid #cbd5e1", padding: "0 0.5rem" }}
                >
                  {colors.map((c) => (
                    <option key={c.colorId} value={c.colorId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Helper text (Image 1) */}
            <p
              style={{
                margin: "0 0 1.5rem",
                fontSize: "0.78rem",
                color: "#64748b",
                lineHeight: 1.4,
              }}
            >
              If this combination does not exist yet, a new fabric type is created when you save.
            </p>

            {/* Modal Buttons (Image 1) */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
              }}
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: "0.55rem 1.25rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyModalFabric}
                style={{
                  padding: "0.55rem 1.35rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--brand, #c2410c)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                Use this fabric
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IssueZigPage;
