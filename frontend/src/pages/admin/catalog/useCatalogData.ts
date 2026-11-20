import { useState, useEffect, useMemo, useCallback } from "react";
import { catalogApi, type FabricVariant, type FabricPriceRow } from "../../../api";

export type CatalogTab =
  | "fabrics"
  | "fabricVariants"
  | "yarns"
  | "yarnVariants"
  | "colors"
  | "designs"
  | "suppliers";

export interface FabricWithRates {
  fabricId: number;
  name: string;
  standardLengthCm: number;
  standardWidthCm: number;
  standardWeightG: number;
  weaverRate: number;
  sellingPrice: number;
  isActive: boolean;
}

export const DEFAULT_FABRICS: FabricWithRates[] = [
  {
    fabricId: 1,
    name: "medebegna",
    standardLengthCm: 240,
    standardWidthCm: 150,
    standardWeightG: 64,
    weaverRate: 1300,
    sellingPrice: 1900,
    isActive: true,
  },
  {
    fabricId: 2,
    name: "gabi",
    standardLengthCm: 240,
    standardWidthCm: 150,
    standardWeightG: 520,
    weaverRate: 950,
    sellingPrice: 1400,
    isActive: true,
  },
  {
    fabricId: 3,
    name: "netela",
    standardLengthCm: 200,
    standardWidthCm: 100,
    standardWeightG: 150,
    weaverRate: 700,
    sellingPrice: 1050,
    isActive: true,
  },
];

export function useCatalogData() {
  const [tab, setTab] = useState<CatalogTab>("fabrics");
  const [search, setSearch] = useState("");
  const [showDeactivated, setShowDeactivated] = useState(false);

  // Data collections
  const [fabrics, setFabrics] = useState<FabricWithRates[]>(DEFAULT_FABRICS);
  const [fabricVariants, setFabricVariants] = useState<FabricVariant[]>([]);
  const [yarns, setYarns] = useState<any[]>([]);
  const [yarnVariants, setYarnVariants] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [designs, setDesigns] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Selection & edit state for fabrics tab
  const [selectedFabricId, setSelectedFabricId] = useState<number | null>(2);
  const [editWeight, setEditWeight] = useState("520");
  const [editLength, setEditLength] = useState("240");
  const [editWidth, setEditWidth] = useState("150");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [fabList, fpList, fvList, yList, yvList, colList, desList, supList] =
        await Promise.all([
          catalogApi.fabrics().catch(() => []),
          catalogApi.fabricPrices().catch(() => []),
          catalogApi.fabricVariants().catch(() => []),
          catalogApi.yarns().catch(() => []),
          catalogApi.yarnVariants().catch(() => []),
          catalogApi.colors().catch(() => []),
          catalogApi.designs().catch(() => []),
          catalogApi.suppliers().catch(() => []),
        ]);

      if (fabList && fabList.length > 0) {
        const defaultRates: Record<string, { weaver: number; sell: number }> = {
          medebegna: { weaver: 1300, sell: 1900 },
          gabi: { weaver: 950, sell: 1400 },
          netela: { weaver: 700, sell: 1050 },
        };

        const combined: FabricWithRates[] = fabList.map((f: any) => {
          const matchedPrices = fpList.filter(
            (p: FabricPriceRow) => p.fabricId === f.fabricId && p.isActive !== false
          );
          matchedPrices.sort(
            (a: FabricPriceRow, b: FabricPriceRow) =>
              new Date(b.effectiveFrom || 0).getTime() - new Date(a.effectiveFrom || 0).getTime()
          );
          const currentPrice = matchedPrices[0];
          const defRate = defaultRates[f.name.toLowerCase()] || { weaver: 1000, sell: 1500 };

          return {
            fabricId: f.fabricId,
            name: f.name,
            standardLengthCm: f.standardLengthCm ?? 240,
            standardWidthCm: f.standardWidthCm ?? 150,
            standardWeightG: f.standardWeightG ?? 520,
            weaverRate: currentPrice ? Number(currentPrice.weaverRate) : defRate.weaver,
            sellingPrice: currentPrice ? Number(currentPrice.sellingPrice) : defRate.sell,
            isActive: f.isActive ?? true,
          };
        });

        setFabrics(combined);
        const gabi = combined.find((f) => f.name.toLowerCase() === "gabi") || combined[0];
        if (gabi) {
          setSelectedFabricId(gabi.fabricId);
          setEditWeight(String(gabi.standardWeightG));
          setEditLength(String(gabi.standardLengthCm));
          setEditWidth(String(gabi.standardWidthCm));
        }
      } else {
        setFabrics(DEFAULT_FABRICS);
        setSelectedFabricId(2);
        setEditWeight("520");
        setEditLength("240");
        setEditWidth("150");
      }

      setFabricVariants(fvList || []);
      setYarns(yList || []);
      setYarnVariants(yvList || []);
      setColors(colList || []);
      setDesigns(desList || []);
      setSuppliers(supList || []);
    } catch {
      setFabrics(DEFAULT_FABRICS);
      setSelectedFabricId(2);
      setEditWeight("520");
      setEditLength("240");
      setEditWidth("150");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const selectedFabric = useMemo(() => {
    return fabrics.find((f) => f.fabricId === selectedFabricId) || null;
  }, [fabrics, selectedFabricId]);

  const handleSelectFabric = (f: FabricWithRates) => {
    setSelectedFabricId(f.fabricId);
    setEditWeight(String(f.standardWeightG));
    setEditLength(String(f.standardLengthCm));
    setEditWidth(String(f.standardWidthCm));
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleSaveFabricSpecs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFabric) return;

    const wNum = parseFloat(editWeight);
    const lNum = parseFloat(editLength);
    const wdNum = parseFloat(editWidth);

    if (isNaN(wNum) || isNaN(lNum) || isNaN(wdNum)) {
      setErrorMessage("Please enter valid numeric dimensions and weight.");
      return;
    }

    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await catalogApi.updateFabric(selectedFabric.fabricId, {
        standardWeightG: wNum,
        standardLengthCm: lNum,
        standardWidthCm: wdNum,
      });

      setStatusMessage(`Fabric "${selectedFabric.name}" specifications updated.`);
      setFabrics((prev) =>
        prev.map((f) =>
          f.fabricId === selectedFabric.fabricId
            ? { ...f, standardWeightG: wNum, standardLengthCm: lNum, standardWidthCm: wdNum }
            : f
        )
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update fabric");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFabricStatus = async () => {
    if (!selectedFabric) return;
    const nextActive = !selectedFabric.isActive;

    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await catalogApi.updateFabric(selectedFabric.fabricId, { isActive: nextActive });
      setStatusMessage(
        `Fabric "${selectedFabric.name}" ${nextActive ? "reactivated" : "deactivated"}.`
      );
      setFabrics((prev) =>
        prev.map((f) =>
          f.fabricId === selectedFabric.fabricId ? { ...f, isActive: nextActive } : f
        )
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update fabric status");
    } finally {
      setSaving(false);
    }
  };

  return {
    tab,
    setTab,
    search,
    setSearch,
    showDeactivated,
    setShowDeactivated,
    fabrics,
    setFabrics,
    fabricVariants,
    yarns,
    yarnVariants,
    colors,
    designs,
    suppliers,
    selectedFabricId,
    selectedFabric,
    handleSelectFabric,
    editWeight,
    setEditWeight,
    editLength,
    setEditLength,
    editWidth,
    setEditWidth,
    handleSaveFabricSpecs,
    handleToggleFabricStatus,
    loading,
    saving,
    statusMessage,
    setStatusMessage,
    errorMessage,
    setErrorMessage,
    loadAllData,
  };
}
