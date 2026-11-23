import { useState, useEffect, useMemo, type FormEvent } from "react";
import { catalogApi, type FabricPriceRow, type YarnPriceRow } from "../../../api";
import type { FabricPriceItem, YarnPriceItem } from "./types";

export function usePricesManager() {
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
  const [newModalFabricName, setNewModalFabricName] = useState("");
  const [newModalWeaverRate, setNewModalWeaverRate] = useState("");
  const [newModalSellingPrice, setNewModalSellingPrice] = useState("");
  const [newModalYarnName, setNewModalYarnName] = useState("");
  const [newModalSupplierName, setNewModalSupplierName] = useState("");
  const [newModalYarnPurchasePrice, setNewModalYarnPurchasePrice] = useState("");
  const [newModalYarnSellingPrice, setNewModalYarnSellingPrice] = useState("");

  async function loadLiveData() {
    try {
      const [fpList, ypList] = await Promise.all([
        catalogApi.fabricPrices(),
        catalogApi.yarnPrices(),
      ]);

      if (fpList && fpList.length > 0) {
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
      } else {
        setFabricPrices([]);
        setSelectedFabricId(null);
        setNewWeaverRate("");
        setNewSellingPrice("");
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
        setYarnPrices([]);
        setSelectedYarnId(null);
        setNewYarnPurchasePrice("");
        setNewYarnSellingPrice("");
      }
    } catch {
      setFabricPrices([]);
      setYarnPrices([]);
    }
  }

  useEffect(() => {
    loadLiveData();
  }, []);

  const selectedFabricItem = useMemo(() => {
    if (selectedFabricId === null) return null;
    return fabricPrices.find((f) => f.id === selectedFabricId) ?? null;
  }, [fabricPrices, selectedFabricId]);

  const selectedYarnItem = useMemo(() => {
    if (selectedYarnId === null) return null;
    return yarnPrices.find((y) => y.id === selectedYarnId) ?? null;
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

  return {
    tab,
    setTab,
    search,
    setSearch,
    showClosed,
    setShowClosed,
    fabricPrices,
    yarnPrices,
    selectedFabricId,
    setSelectedFabricId,
    selectedFabricItem,
    selectedYarnId,
    setSelectedYarnId,
    selectedYarnItem,
    newWeaverRate,
    setNewWeaverRate,
    newSellingPrice,
    setNewSellingPrice,
    takesEffectDate,
    setTakesEffectDate,
    newYarnPurchasePrice,
    setNewYarnPurchasePrice,
    newYarnSellingPrice,
    setNewYarnSellingPrice,
    yarnTakesEffectDate,
    setYarnTakesEffectDate,
    isSaving,
    setIsSaving,
    statusMessage,
    setStatusMessage,
    showNewPriceModal,
    setShowNewPriceModal,
    newModalFabricName,
    setNewModalFabricName,
    newModalWeaverRate,
    setNewModalWeaverRate,
    newModalSellingPrice,
    setNewModalSellingPrice,
    newModalYarnName,
    setNewModalYarnName,
    newModalSupplierName,
    setNewModalSupplierName,
    newModalYarnPurchasePrice,
    setNewModalYarnPurchasePrice,
    newModalYarnSellingPrice,
    setNewModalYarnSellingPrice,
    handleSelectFabric,
    handleSelectYarn,
    handleSaveFabricPrice,
    handleSaveYarnPrice,
    filteredFabricPrices,
    filteredYarnPrices,
    loadLiveData,
  };
}
