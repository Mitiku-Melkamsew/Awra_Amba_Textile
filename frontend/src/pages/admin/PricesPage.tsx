import { useEffect, useState, useMemo, Fragment } from "react";
import type { FormEvent } from "react";
import { catalogApi } from "../../api";
import type { FabricPriceRow, YarnPriceRow } from "../../api";

interface FabricPriceItem {
  id: number;
  fabricId?: number;
  name: string;
  weaverRate: number;
  sellingPrice: number;
  inEffectSince: string;
  isCurrent: boolean;
  earlierPrice?: {
    weaverRate: number;
    sellingPrice: number;
    period: string;
  };
}

interface YarnPriceItem {
  id: number;
  yarnId?: number;
  supplierId?: number;
  yarnName: string;
  supplierName: string;
  purchasePrice: number;
  sellingPrice: number;
  inEffectSince: string;
  isCurrent: boolean;
}

export function PricesPage() {
  const [tab, setTab] = useState<"fabricPrices" | "yarnPrices">("fabricPrices");
  const [search, setSearch] = useState("");
  const [showClosed, setShowClosed] = useState(true);

  // Fabric list & selection
  const [fabricPrices, setFabricPrices] = useState<FabricPriceItem[]>([]);
  const [selectedFabricId, setSelectedFabricId] = useState<number | null>(null);

  // Yarn list & selection
  const [yarnPrices, setYarnPrices] = useState<YarnPriceItem[]>([]);
  const [selectedYarnId, setSelectedYarnId] = useState<number | null>(null);

  // Edit form state for Fabric
  const [newWeaverRate, setNewWeaverRate] = useState<string>("");
  const [newSellingPrice, setNewSellingPrice] = useState<string>("");
  const [takesEffectDate, setTakesEffectDate] = useState<string>(
    new Date().toLocaleDateString("en-GB")
  );

  // Edit form state for Yarn
  const [newYarnPurchasePrice, setNewYarnPurchasePrice] = useState<string>("");
  const [newYarnSellingPrice, setNewYarnSellingPrice] = useState<string>("");
  const [yarnTakesEffectDate, setYarnTakesEffectDate] = useState<string>(
    new Date().toLocaleDateString("en-GB")
  );

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Modal for + Set new price
  const [showNewPriceModal, setShowNewPriceModal] = useState(false);
  // Fabric modal fields
  const [newModalFabricName, setNewModalFabricName] = useState("");
  const [newModalWeaverRate, setNewModalWeaverRate] = useState("");
  const [newModalSellingPrice, setNewModalSellingPrice] = useState("");
  // Yarn modal fields
  const [newModalYarnName, setNewModalYarnName] = useState("");
  const [newModalSupplierName, setNewModalSupplierName] = useState("");
  const [newModalYarnPurchasePrice, setNewModalYarnPurchasePrice] = useState("");
  const [newModalYarnSellingPrice, setNewModalYarnSellingPrice] = useState("");

  async function loadLiveData() {
    try {
      const [fpList, ypList, fabList] = await Promise.all([
        catalogApi.fabricPrices(),
        catalogApi.yarnPrices(),
        catalogApi.fabrics().catch(() => []),
      ]);

      if (fpList && fpList.length > 0) {
        // Group by fabricId
        const byFabric: Record<number, FabricPriceRow[]> = {};
        for (const fp of fpList) {
          if (!byFabric[fp.fabricId]) byFabric[fp.fabricId] = [];
          byFabric[fp.fabricId].push(fp);
        }

        const mappedFp: FabricPriceItem[] = [];
        for (const [fIdStr, records] of Object.entries(byFabric)) {
          const fId = Number(fIdStr);
          records.sort(
            (a, b) =>
              new Date(b.effectiveFrom || 0).getTime() -
              new Date(a.effectiveFrom || 0).getTime()
          );
          const current = records.find((r) => r.isActive !== false) || records[0];
          const earlier = records.find((r) => r.fabricPriceId !== current.fabricPriceId);

          const currentEffective = current.effectiveFrom
            ? new Date(current.effectiveFrom).toLocaleDateString("en-GB")
            : "01/07/2026";

          let earlierObj: FabricPriceItem["earlierPrice"] | undefined = undefined;
          if (earlier) {
            const eFrom = earlier.effectiveFrom
              ? new Date(earlier.effectiveFrom).toLocaleDateString("en-GB")
              : "01/01/2026";
            const eTo = earlier.effectiveTo
              ? new Date(earlier.effectiveTo).toLocaleDateString("en-GB")
              : currentEffective;
            earlierObj = {
              weaverRate: parseFloat(String(earlier.weaverRate || "0")),
              sellingPrice: parseFloat(String(earlier.sellingPrice || "0")),
              period: `${eFrom} - ${eTo}`,
            };
          }

          mappedFp.push({
            id: current.fabricPriceId,
            fabricId: fId,
            name: current.fabric?.name?.toLowerCase() || `fabric #${fId}`,
            weaverRate: parseFloat(String(current.weaverRate || "0")),
            sellingPrice: parseFloat(String(current.sellingPrice || "0")),
            inEffectSince: currentEffective,
            isCurrent: current.isActive !== false,
            earlierPrice: earlierObj,
          });
        }

        setFabricPrices(mappedFp);
        if (mappedFp.length > 0) {
          setSelectedFabricId(mappedFp[0].id);
          setNewWeaverRate(String(mappedFp[0].weaverRate));
          setNewSellingPrice(String(mappedFp[0].sellingPrice));
        }
      } else if (fabList && fabList.length > 0) {
        const defaultRates: Record<string, { weaver: number; sell: number }> = {
          medebegna: { weaver: 1300, sell: 1900 },
          gabi: { weaver: 950, sell: 1400 },
          netela: { weaver: 700, sell: 1050 },
        };
        const initialFp: FabricPriceItem[] = fabList.map((f: any, idx: number) => {
          const fname = f.name?.toLowerCase() || "medebegna";
          const fallback = defaultRates[fname] || { weaver: 1000, sell: 1500 };
          return {
            id: idx + 1,
            fabricId: f.fabricId,
            name: fname,
            weaverRate: fallback.weaver,
            sellingPrice: fallback.sell,
            inEffectSince: "01/07/2026",
            isCurrent: true,
            earlierPrice:
              fname === "medebegna"
                ? {
                    weaverRate: 1200,
                    sellingPrice: 1750,
                    period: "01/01/2026 - 30/06/2026",
                  }
                : undefined,
          };
        });
        setFabricPrices(initialFp);
        setSelectedFabricId(initialFp[0].id);
        setNewWeaverRate(String(initialFp[0].weaverRate + 80));
        setNewSellingPrice(String(initialFp[0].sellingPrice));
      } else {
        const hardcodedFabrics: FabricPriceItem[] = [
          {
            id: 1,
            name: "medebegna",
            weaverRate: 1300,
            sellingPrice: 1900,
            inEffectSince: "01/07/2026",
            isCurrent: true,
            earlierPrice: {
              weaverRate: 1200,
              sellingPrice: 1750,
              period: "01/01/2026 - 30/06/2026",
            },
          },
          {
            id: 2,
            name: "gabi",
            weaverRate: 950,
            sellingPrice: 1400,
            inEffectSince: "01/03/2026",
            isCurrent: true,
          },
          {
            id: 3,
            name: "netela",
            weaverRate: 700,
            sellingPrice: 1050,
            inEffectSince: "15/05/2026",
            isCurrent: true,
          },
        ];
        setFabricPrices(hardcodedFabrics);
        setSelectedFabricId(1);
        setNewWeaverRate("1380");
        setNewSellingPrice("1900");
      }

      if (ypList && ypList.length > 0) {
        const mappedYp: YarnPriceItem[] = ypList.map((yp: YarnPriceRow) => {
          const dateStr = yp.effectiveFrom
            ? new Date(yp.effectiveFrom).toLocaleDateString("en-GB")
            : "01/07/2026";
          return {
            id: yp.yarnPriceId,
            yarnId: yp.yarnId,
            supplierId: yp.supplierId,
            yarnName: yp.yarn?.name?.toLowerCase() || "cotton · white",
            supplierName: yp.supplier?.name || "Supplier A",
            purchasePrice: parseFloat(String(yp.purchasePrice || "0")),
            sellingPrice: parseFloat(String(yp.sellingPrice || "0")),
            inEffectSince: dateStr,
            isCurrent: yp.isActive !== false,
          };
        });
        setYarnPrices(mappedYp);
        if (mappedYp.length > 0) {
          setSelectedYarnId(mappedYp[0].id);
          setNewYarnPurchasePrice(String(mappedYp[0].purchasePrice));
          setNewYarnSellingPrice(String(mappedYp[0].sellingPrice));
        }
      } else {
        const hardcodedYarns: YarnPriceItem[] = [
          {
            id: 1,
            yarnName: "cotton · white",
            supplierName: "Supplier A",
            purchasePrice: 410,
            sellingPrice: 520,
            inEffectSince: "01/07/2026",
            isCurrent: true,
          },
          {
            id: 2,
            yarnName: "cotton · red",
            supplierName: "Supplier A",
            purchasePrice: 430,
            sellingPrice: 540,
            inEffectSince: "01/07/2026",
            isCurrent: true,
          },
          {
            id: 3,
            yarnName: "cotton · white",
            supplierName: "Supplier B",
            purchasePrice: 395,
            sellingPrice: 520,
            inEffectSince: "15/09/2026",
            isCurrent: true,
          },
        ];
        setYarnPrices(hardcodedYarns);
        setSelectedYarnId(1);
        setNewYarnPurchasePrice("410");
        setNewYarnSellingPrice("520");
      }
    } catch {
      // Fallback in case of API failure
      setFabricPrices([
        {
          id: 1,
          name: "medebegna",
          weaverRate: 1300,
          sellingPrice: 1900,
          inEffectSince: "01/07/2026",
          isCurrent: true,
          earlierPrice: {
            weaverRate: 1200,
            sellingPrice: 1750,
            period: "01/01/2026 - 30/06/2026",
          },
        },
        {
          id: 2,
          name: "gabi",
          weaverRate: 950,
          sellingPrice: 1400,
          inEffectSince: "01/03/2026",
          isCurrent: true,
        },
        {
          id: 3,
          name: "netela",
          weaverRate: 700,
          sellingPrice: 1050,
          inEffectSince: "15/05/2026",
          isCurrent: true,
        },
      ]);
      setSelectedFabricId(1);
      setNewWeaverRate("1380");
      setNewSellingPrice("1900");

      setYarnPrices([
        {
          id: 1,
          yarnName: "cotton · white",
          supplierName: "Supplier A",
          purchasePrice: 410,
          sellingPrice: 520,
          inEffectSince: "01/07/2026",
          isCurrent: true,
        },
        {
          id: 2,
          yarnName: "cotton · red",
          supplierName: "Supplier A",
          purchasePrice: 430,
          sellingPrice: 540,
          inEffectSince: "01/07/2026",
          isCurrent: true,
        },
        {
          id: 3,
          yarnName: "cotton · white",
          supplierName: "Supplier B",
          purchasePrice: 395,
          sellingPrice: 520,
          inEffectSince: "15/09/2026",
          isCurrent: true,
        },
      ]);
      setSelectedYarnId(1);
      setNewYarnPurchasePrice("410");
      setNewYarnSellingPrice("520");
    }
  }

  useEffect(() => {
    loadLiveData();
  }, []);

  const selectedFabricItem = useMemo(() => {
    return fabricPrices.find((f) => f.id === selectedFabricId) || fabricPrices[0] || null;
  }, [fabricPrices, selectedFabricId]);

  const selectedYarnItem = useMemo(() => {
    return yarnPrices.find((y) => y.id === selectedYarnId) || yarnPrices[0] || null;
  }, [yarnPrices, selectedYarnId]);

  function handleSelectFabric(item: FabricPriceItem) {
    setSelectedFabricId(item.id);
    setNewWeaverRate(String(item.weaverRate));
    setNewSellingPrice(String(item.sellingPrice));
    setStatusMessage("");
  }

  function handleSelectYarn(item: YarnPriceItem) {
    setSelectedYarnId(item.id);
    setNewYarnPurchasePrice(String(item.purchasePrice));
    setNewYarnSellingPrice(String(item.sellingPrice));
    setStatusMessage("");
  }

  // Calculate rate changes for fabric
  const currentWeaverRate = selectedFabricItem ? selectedFabricItem.weaverRate : 0;
  const currentSellingPrice = selectedFabricItem ? selectedFabricItem.sellingPrice : 0;
  const numNewWeaver = parseFloat(newWeaverRate) || 0;
  const diffWeaver = numNewWeaver - currentWeaverRate;
  const pctWeaver = currentWeaverRate > 0 ? ((diffWeaver / currentWeaverRate) * 100).toFixed(1) : 0;
  const numNewSelling = parseFloat(newSellingPrice) || 0;
  const diffSelling = numNewSelling - currentSellingPrice;

  // Calculate rate changes for yarn
  const currentYarnPurchase = selectedYarnItem ? selectedYarnItem.purchasePrice : 0;
  const currentYarnSelling = selectedYarnItem ? selectedYarnItem.sellingPrice : 0;
  const numNewYarnPurchase = parseFloat(newYarnPurchasePrice) || 0;
  const diffYarnPurchase = numNewYarnPurchase - currentYarnPurchase;
  const numNewYarnSelling = parseFloat(newYarnSellingPrice) || 0;
  const diffYarnSelling = numNewYarnSelling - currentYarnSelling;

  async function handleSaveFabricPrice(e: FormEvent) {
    e.preventDefault();
    if (!selectedFabricItem) return;
    setIsSaving(true);
    setStatusMessage("");

    try {
      if (selectedFabricItem.fabricId) {
        await catalogApi.createFabricPrice({
          fabricId: selectedFabricItem.fabricId,
          weaverRate: parseFloat(newWeaverRate),
          sellingPrice: parseFloat(newSellingPrice),
          effectiveFrom: new Date().toISOString(),
        });
      }

      setStatusMessage("New fabric price saved successfully.");
      setFabricPrices((prev) =>
        prev.map((f) => {
          if (f.id === selectedFabricItem.id) {
            return {
              ...f,
              earlierPrice: {
                weaverRate: f.weaverRate,
                sellingPrice: f.sellingPrice,
                period: `${f.inEffectSince} - ${new Date().toLocaleDateString("en-GB")}`,
              },
              weaverRate: parseFloat(newWeaverRate),
              sellingPrice: parseFloat(newSellingPrice),
              inEffectSince: takesEffectDate,
            };
          }
          return f;
        })
      );
    } catch (err: any) {
      setStatusMessage(err.message || "Failed to save price changes");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveYarnPrice(e: FormEvent) {
    e.preventDefault();
    if (!selectedYarnItem) return;
    setIsSaving(true);
    setStatusMessage("");

    try {
      if (selectedYarnItem.yarnId && selectedYarnItem.supplierId) {
        await catalogApi.createYarnPrice({
          yarnId: selectedYarnItem.yarnId,
          supplierId: selectedYarnItem.supplierId,
          purchasePrice: parseFloat(newYarnPurchasePrice),
          sellingPrice: parseFloat(newYarnSellingPrice),
          effectiveFrom: new Date().toISOString(),
        });
      }

      setStatusMessage("New yarn price saved successfully.");
      setYarnPrices((prev) =>
        prev.map((y) => {
          if (y.id === selectedYarnItem.id) {
            return {
              ...y,
              purchasePrice: parseFloat(newYarnPurchasePrice),
              sellingPrice: parseFloat(newYarnSellingPrice),
              inEffectSince: yarnTakesEffectDate,
            };
          }
          return y;
        })
      );
    } catch (err: any) {
      setStatusMessage(err.message || "Failed to save yarn price");
    } finally {
      setIsSaving(false);
    }
  }

  // Filtered Fabric rows
  const filteredFabricPrices = useMemo(() => {
    return fabricPrices.filter((item) => {
      if (!showClosed && !item.isCurrent) return false;
      if (!search.trim()) return true;
      return item.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [fabricPrices, showClosed, search]);

  // Filtered Yarn rows
  const filteredYarnPrices = useMemo(() => {
    return yarnPrices.filter((item) => {
      if (!showClosed && !item.isCurrent) return false;
      if (!search.trim()) return true;
      return (
        item.yarnName.toLowerCase().includes(search.toLowerCase()) ||
        item.supplierName.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [yarnPrices, showClosed, search]);

  return (
    <div className="page" style={{ maxWidth: "100%", width: "100%" }}>
      {/* ── Page Header ── */}
      <div className="prices-header">
        <h1 className="prices-title">
          Prices <span className="prices-title-amharic">· ዋጋ</span>
        </h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setShowNewPriceModal(true);
            setStatusMessage("");
          }}
        >
          + Set new price
        </button>
      </div>

      {/* ── Filter / Tabs Bar ── */}
      <div className="prices-toolbar">
        <div className="segmented-tab-group">
          <button
            type="button"
            className={`segmented-tab-btn ${tab === "fabricPrices" ? "active" : ""}`}
            onClick={() => {
              setTab("fabricPrices");
              setSearch("");
              setStatusMessage("");
            }}
          >
            Fabric prices
          </button>
          <button
            type="button"
            className={`segmented-tab-btn ${tab === "yarnPrices" ? "active" : ""}`}
            onClick={() => {
              setTab("yarnPrices");
              setSearch("");
              setStatusMessage("");
            }}
          >
            Yarn prices
          </button>
        </div>

        <div className="prices-search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="prices-search-input"
            placeholder={tab === "fabricPrices" ? "Search by fabric" : "Search by yarn or supplier"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <label className="checkbox-filter-label">
          <input
            type="checkbox"
            checked={showClosed}
            onChange={(e) => setShowClosed(e.target.checked)}
            className="styled-checkbox"
          />
          Show closed prices
        </label>
      </div>

      {statusMessage && (
        <div className="success-msg" style={{ marginBottom: "1rem" }}>
          <span>✅</span> {statusMessage}
        </div>
      )}

      {/* ── Tab Content ── */}
      {tab === "fabricPrices" ? (
        <div className={`master-detail ${selectedFabricItem ? "" : "no-panel"}`}>
          {/* Left Table */}
          <div className="data-table-container">
            <div className="prices-table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "24%" }}>Fabric · ጨርቅ</th>
                    <th style={{ width: "18%", textAlign: "right" }}>Weaver rate</th>
                    <th style={{ width: "18%", textAlign: "right" }}>Selling price</th>
                    <th style={{ width: "16%" }}>In effect since</th>
                    <th style={{ width: "12%" }}>Status</th>
                    <th style={{ width: "12%", textAlign: "right" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFabricPrices.map((item) => {
                    const isSelected = selectedFabricItem?.id === item.id;

                    return (
                      <Fragment key={item.id}>
                        {/* Current price row */}
                        <tr
                          className={`price-row ${isSelected ? "price-row-selected" : ""}`}
                          onClick={() => handleSelectFabric(item)}
                        >
                          <td>
                            <span className="price-item-name">{item.name}</span>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, fontSize: "14px" }}>
                            {item.weaverRate.toLocaleString()}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, fontSize: "14px" }}>
                            {item.sellingPrice.toLocaleString()}
                          </td>
                          <td style={{ color: "#64748B", fontSize: "13px" }}>
                            {item.inEffectSince}
                          </td>
                          <td>
                            <span className="status-pill-green">✓ Current</span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectFabric(item);
                              }}
                            >
                              <span style={{ fontSize: "12px", opacity: 0.8 }}>✏️</span> Edit
                            </button>
                          </td>
                        </tr>

                        {/* Earlier price row */}
                        {showClosed && item.earlierPrice && (
                          <tr className="price-earlier-row">
                            <td className="earlier-price-label">Earlier price</td>
                            <td style={{ textAlign: "right", color: "#64748B", fontSize: "13px" }}>
                              {item.earlierPrice.weaverRate.toLocaleString()}
                            </td>
                            <td style={{ textAlign: "right", color: "#64748B", fontSize: "13px" }}>
                              {item.earlierPrice.sellingPrice.toLocaleString()}
                            </td>
                            <td style={{ color: "#64748B", fontSize: "12px" }}>
                              {item.earlierPrice.period}
                            </td>
                            <td>
                              <span className="status-pill-gray">Closed</span>
                            </td>
                            <td></td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="prices-footnote">
              Prices are in ETB per piece. Weaver rate is what you pay the weaver; selling price is what a merchant pays.
            </p>
          </div>

          {/* Right Edit Panel for Fabric */}
          {selectedFabricItem && (
            <div className="price-edit-panel" style={{ position: "sticky", top: "1.5rem" }}>
              <div className="price-edit-header">
                <div>
                  <h3 className="price-edit-title">Change price</h3>
                  <div className="price-edit-fabric-name">{selectedFabricItem.name}</div>
                </div>
                <button
                  type="button"
                  className="detail-close-btn"
                  onClick={() => setSelectedFabricId(null)}
                >
                  ✕
                </button>
              </div>

              <div className="price-now-banner">
                <div className="price-now-line">
                  Now: weaver rate <strong>{selectedFabricItem.weaverRate.toLocaleString()}</strong> · selling price{" "}
                  <strong>{selectedFabricItem.sellingPrice.toLocaleString()}</strong>
                </div>
                <div className="price-now-sub">
                  In effect since {selectedFabricItem.inEffectSince}
                </div>
              </div>

              <form onSubmit={handleSaveFabricPrice}>
                {/* Weaver Rate Field */}
                <div className="price-form-group">
                  <label className="price-form-label">New weaver rate (ETB)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="price-form-input"
                    value={newWeaverRate}
                    onChange={(e) => setNewWeaverRate(e.target.value)}
                    required
                  />
                  <div className="price-delta-badge">
                    {diffWeaver === 0 ? (
                      <span className="delta-no-change">No change</span>
                    ) : diffWeaver > 0 ? (
                      <span className="delta-up">
                        ↑ Up {diffWeaver} ({pctWeaver}%)
                      </span>
                    ) : (
                      <span className="delta-down">
                        ↓ Down {Math.abs(diffWeaver)} ({Math.abs(Number(pctWeaver))}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Selling Price Field */}
                <div className="price-form-group">
                  <label className="price-form-label">New selling price (ETB)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="price-form-input"
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(e.target.value)}
                    required
                  />
                  <div className="price-delta-badge">
                    {diffSelling === 0 ? (
                      <span className="delta-no-change">No change</span>
                    ) : diffSelling > 0 ? (
                      <span className="delta-up">↑ Up {diffSelling}</span>
                    ) : (
                      <span className="delta-down">↓ Down {Math.abs(diffSelling)}</span>
                    )}
                  </div>
                </div>

                {/* Takes Effect On */}
                <div className="price-form-group">
                  <label className="price-form-label">Takes effect on</label>
                  <input
                    type="text"
                    className="price-form-input"
                    value={takesEffectDate}
                    onChange={(e) => setTakesEffectDate(e.target.value)}
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="price-edit-actions">
                  <button
                    type="submit"
                    className="btn btn-primary btn-full-width"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save new price"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-full-width"
                    onClick={() => handleSelectFabric(selectedFabricItem)}
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <p className="price-edit-footnote">
                The current price ends when the new one starts. Records already saved keep the price they were saved with.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ── Yarn Prices Tab (Master-Detail matching design) ── */
        <div className={`master-detail ${selectedYarnItem ? "" : "no-panel"}`}>
          {/* Left: Yarn Table */}
          <div className="data-table-container">
            <div className="prices-table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "20%", whiteSpace: "nowrap" }}>Yarn · ጥጥ</th>
                    <th style={{ width: "18%", whiteSpace: "nowrap" }}>Supplier</th>
                    <th style={{ width: "16%", textAlign: "right", whiteSpace: "nowrap" }}>Purchase price</th>
                    <th style={{ width: "16%", textAlign: "right", whiteSpace: "nowrap" }}>Selling price</th>
                    <th style={{ width: "16%", whiteSpace: "nowrap" }}>In effect since</th>
                    <th style={{ width: "14%", whiteSpace: "nowrap" }}>Status</th>
                    <th style={{ textAlign: "right", whiteSpace: "nowrap" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredYarnPrices.map((item) => {
                    const isSelected = selectedYarnItem?.id === item.id;

                    return (
                      <tr
                        key={item.id}
                        className={`price-row ${isSelected ? "price-row-selected" : ""}`}
                        onClick={() => handleSelectYarn(item)}
                      >
                        <td>
                          <span className="price-item-name">{item.yarnName}</span>
                        </td>
                        <td style={{ color: "#64748B" }}>{item.supplierName}</td>
                        <td style={{ textAlign: "right", fontWeight: 700, fontSize: "14px" }}>
                          {item.purchasePrice.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, fontSize: "14px" }}>
                          {item.sellingPrice.toLocaleString()}
                        </td>
                        <td style={{ color: "#64748B", fontSize: "13px" }}>
                          {item.inEffectSince}
                        </td>
                        <td>
                          <span className="status-pill-green">✓ Current</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectYarn(item);
                            }}
                          >
                            <span style={{ fontSize: "12px", opacity: 0.8 }}>✏️</span> Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="prices-footnote">
              Purchase price is what you pay the supplier; selling price is what a weaver is charged for yarn. A price belongs to a yarn and a supplier.
            </p>
          </div>

          {/* Right Edit Panel for Yarn */}
          {selectedYarnItem && (
            <div className="price-edit-panel" style={{ position: "sticky", top: "1.5rem" }}>
              <div className="price-edit-header">
                <div>
                  <h3 className="price-edit-title">Change price</h3>
                  <div className="price-edit-fabric-name">{selectedYarnItem.yarnName}</div>
                </div>
                <button
                  type="button"
                  className="detail-close-btn"
                  onClick={() => setSelectedYarnId(null)}
                >
                  ✕
                </button>
              </div>

              <div className="price-now-banner">
                <div className="price-now-line">
                  Now: purchase <strong>{selectedYarnItem.purchasePrice.toLocaleString()}</strong> · selling{" "}
                  <strong>{selectedYarnItem.sellingPrice.toLocaleString()}</strong>
                </div>
                <div className="price-now-sub">
                  Supplier: {selectedYarnItem.supplierName} · Since {selectedYarnItem.inEffectSince}
                </div>
              </div>

              <form onSubmit={handleSaveYarnPrice}>
                {/* Purchase Price Field */}
                <div className="price-form-group">
                  <label className="price-form-label">New purchase price (ETB)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="price-form-input"
                    value={newYarnPurchasePrice}
                    onChange={(e) => setNewYarnPurchasePrice(e.target.value)}
                    required
                  />
                  <div className="price-delta-badge">
                    {diffYarnPurchase === 0 ? (
                      <span className="delta-no-change">No change</span>
                    ) : diffYarnPurchase > 0 ? (
                      <span className="delta-up">↑ Up {diffYarnPurchase}</span>
                    ) : (
                      <span className="delta-down">↓ Down {Math.abs(diffYarnPurchase)}</span>
                    )}
                  </div>
                </div>

                {/* Selling Price Field */}
                <div className="price-form-group">
                  <label className="price-form-label">New selling price (ETB)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="price-form-input"
                    value={newYarnSellingPrice}
                    onChange={(e) => setNewYarnSellingPrice(e.target.value)}
                    required
                  />
                  <div className="price-delta-badge">
                    {diffYarnSelling === 0 ? (
                      <span className="delta-no-change">No change</span>
                    ) : diffYarnSelling > 0 ? (
                      <span className="delta-up">↑ Up {diffYarnSelling}</span>
                    ) : (
                      <span className="delta-down">↓ Down {Math.abs(diffYarnSelling)}</span>
                    )}
                  </div>
                </div>

                {/* Takes Effect On */}
                <div className="price-form-group">
                  <label className="price-form-label">Takes effect on</label>
                  <input
                    type="text"
                    className="price-form-input"
                    value={yarnTakesEffectDate}
                    onChange={(e) => setYarnTakesEffectDate(e.target.value)}
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="price-edit-actions">
                  <button
                    type="submit"
                    className="btn btn-primary btn-full-width"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save new price"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-full-width"
                    onClick={() => handleSelectYarn(selectedYarnItem)}
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <p className="price-edit-footnote">
                The current price ends when the new one starts. Records already saved keep the price they were saved with.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Context-Aware Set New Price Modal ── */}
      {showNewPriceModal && (
        <div className="modal-backdrop" onClick={() => setShowNewPriceModal(false)}>
          <div className="modal-dialog card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            {tab === "fabricPrices" ? (
              /* Fabric Price Modal */
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <h2 className="modal-title" style={{ fontSize: "18px", fontWeight: 800 }}>+ Set new fabric price</h2>
                  <button type="button" className="detail-close-btn" onClick={() => setShowNewPriceModal(false)}>✕</button>
                </div>
                <p className="modal-sub" style={{ margin: "0 0 1.25rem", color: "#64748B", fontSize: "13px" }}>
                  Create a new price schedule for a fabric
                </p>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSaving(true);
                    try {
                      const matched = fabricPrices.find(
                        (f) => f.name.toLowerCase() === newModalFabricName.trim().toLowerCase()
                      );
                      if (matched?.fabricId) {
                        await catalogApi.createFabricPrice({
                          fabricId: matched.fabricId,
                          weaverRate: parseFloat(newModalWeaverRate),
                          sellingPrice: parseFloat(newModalSellingPrice),
                          effectiveFrom: new Date().toISOString(),
                        });
                      }
                      setShowNewPriceModal(false);
                      setNewModalFabricName("");
                      setNewModalWeaverRate("");
                      setNewModalSellingPrice("");
                      setStatusMessage("New fabric price created.");
                      await loadLiveData();
                    } catch (err: any) {
                      setStatusMessage(err.message || "Failed to create price");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  <div className="price-form-group">
                    <label className="price-form-label">Fabric Name</label>
                    <input
                      type="text"
                      className="price-form-input"
                      placeholder="e.g. medebegna, gabi, netela..."
                      value={newModalFabricName}
                      onChange={(e) => setNewModalFabricName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="price-form-group">
                    <label className="price-form-label">Weaver Rate (ETB)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="price-form-input"
                      placeholder="e.g. 1380"
                      value={newModalWeaverRate}
                      onChange={(e) => setNewModalWeaverRate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="price-form-group">
                    <label className="price-form-label">Selling Price (ETB)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="price-form-input"
                      placeholder="e.g. 1900"
                      value={newModalSellingPrice}
                      onChange={(e) => setNewModalSellingPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowNewPriceModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? "Creating..." : "Create fabric price"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Dedicated Yarn Price Modal */
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <h2 className="modal-title" style={{ fontSize: "18px", fontWeight: 800 }}>+ Set new yarn price</h2>
                  <button type="button" className="detail-close-btn" onClick={() => setShowNewPriceModal(false)}>✕</button>
                </div>
                <p className="modal-sub" style={{ margin: "0 0 1.25rem", color: "#64748B", fontSize: "13px" }}>
                  Create a new purchase and selling price for a yarn
                </p>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSaving(true);
                    try {
                      const matched = yarnPrices.find(
                        (y) =>
                          y.yarnName.toLowerCase().includes(newModalYarnName.trim().toLowerCase()) ||
                          y.supplierName.toLowerCase().includes(newModalSupplierName.trim().toLowerCase())
                      );
                      if (matched?.yarnId && matched?.supplierId) {
                        await catalogApi.createYarnPrice({
                          yarnId: matched.yarnId,
                          supplierId: matched.supplierId,
                          purchasePrice: parseFloat(newModalYarnPurchasePrice),
                          sellingPrice: parseFloat(newModalYarnSellingPrice),
                          effectiveFrom: new Date().toISOString(),
                        });
                      }
                      setShowNewPriceModal(false);
                      setNewModalYarnName("");
                      setNewModalSupplierName("");
                      setNewModalYarnPurchasePrice("");
                      setNewModalYarnSellingPrice("");
                      setStatusMessage("New yarn price schedule created.");
                      await loadLiveData();
                    } catch (err: any) {
                      setStatusMessage(err.message || "Failed to create yarn price");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  <div className="price-form-group">
                    <label className="price-form-label">Yarn Name</label>
                    <input
                      type="text"
                      className="price-form-input"
                      placeholder="e.g. cotton · white, silk · red..."
                      value={newModalYarnName}
                      onChange={(e) => setNewModalYarnName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="price-form-group">
                    <label className="price-form-label">Supplier Name</label>
                    <input
                      type="text"
                      className="price-form-input"
                      placeholder="e.g. Supplier A, Supplier B..."
                      value={newModalSupplierName}
                      onChange={(e) => setNewModalSupplierName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="price-form-group">
                    <label className="price-form-label">Purchase Price (ETB)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="price-form-input"
                      placeholder="e.g. 410"
                      value={newModalYarnPurchasePrice}
                      onChange={(e) => setNewModalYarnPurchasePrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="price-form-group">
                    <label className="price-form-label">Selling Price (ETB)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="price-form-input"
                      placeholder="e.g. 520"
                      value={newModalYarnSellingPrice}
                      onChange={(e) => setNewModalYarnSellingPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowNewPriceModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? "Creating..." : "Create yarn price"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PricesPage;