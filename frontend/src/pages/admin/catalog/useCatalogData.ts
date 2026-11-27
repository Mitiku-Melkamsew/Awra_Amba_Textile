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

export function useCatalogData() {
  const [tab, setTab] = useState<CatalogTab>("fabrics");
  const [search, setSearch] = useState("");
  const [showDeactivated, setShowDeactivated] = useState(false);

  // Data collections
  const [fabrics, setFabrics] = useState<FabricWithRates[]>([]);
  const [fabricVariants, setFabricVariants] = useState<FabricVariant[]>([]);
  const [yarns, setYarns] = useState<any[]>([]);
  const [yarnVariants, setYarnVariants] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [designs, setDesigns] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  // Selection & edit state for fabrics
  const [selectedFabricId, setSelectedFabricId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editLength, setEditLength] = useState("");
  const [editWidth, setEditWidth] = useState("");

  // Selection & edit state for yarns
  const [selectedYarnId, setSelectedYarnId] = useState<number | null>(null);
  const [editYarnName, setEditYarnName] = useState("");

  // Selection & edit state for colors
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [editColorName, setEditColorName] = useState("");
  const [editColorHex, setEditColorHex] = useState("#000000");

  // Selection & edit state for designs
  const [selectedDesignId, setSelectedDesignId] = useState<number | null>(null);
  const [editDesignName, setEditDesignName] = useState("");
  const [editDesignDescription, setEditDesignDescription] = useState("");

  // Selection & edit state for suppliers
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [editSupplierName, setEditSupplierName] = useState("");
  const [editSupplierPhone, setEditSupplierPhone] = useState("");

  // Selection state for variants
  const [selectedFabricVariantId, setSelectedFabricVariantId] = useState<number | null>(null);
  const [selectedYarnVariantId, setSelectedYarnVariantId] = useState<number | null>(null);

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
        const combined: FabricWithRates[] = fabList.map((f: any) => {
          const matchedPrices = fpList.filter(
            (p: FabricPriceRow) => p.fabricId === f.fabricId && p.isActive !== false
          );
          matchedPrices.sort(
            (a: FabricPriceRow, b: FabricPriceRow) =>
              new Date(b.effectiveFrom || 0).getTime() - new Date(a.effectiveFrom || 0).getTime()
          );
          const currentPrice = matchedPrices[0];

          return {
            fabricId: f.fabricId,
            name: f.name,
            standardLengthCm: f.standardLengthCm ?? 240,
            standardWidthCm: f.standardWidthCm ?? 150,
            standardWeightG: f.standardWeightG ?? 520,
            weaverRate: currentPrice ? Number(currentPrice.weaverRate) : 0,
            sellingPrice: currentPrice ? Number(currentPrice.sellingPrice) : 0,
            isActive: f.isActive ?? true,
          };
        });

        setFabrics(combined);
        const firstFab = combined[0];
        if (firstFab) {
          setSelectedFabricId(firstFab.fabricId);
          setEditName(firstFab.name);
          setEditWeight(String(firstFab.standardWeightG));
          setEditLength(String(firstFab.standardLengthCm));
          setEditWidth(String(firstFab.standardWidthCm));
        }
      } else {
        setFabrics([]);
        setSelectedFabricId(null);
        setEditName("");
        setEditWeight("");
        setEditLength("");
        setEditWidth("");
      }

      setFabricVariants(fvList || []);
      if (fvList && fvList.length > 0) {
        setSelectedFabricVariantId((prev) => prev ?? fvList[0].fabricVariantId);
      }

      setYarns(yList || []);
      if (yList && yList.length > 0) {
        setSelectedYarnId((prev) => {
          if (!prev) {
            setEditYarnName(yList[0].name);
            return yList[0].yarnId;
          }
          return prev;
        });
      }

      setYarnVariants(yvList || []);
      if (yvList && yvList.length > 0) {
        setSelectedYarnVariantId((prev) => prev ?? yvList[0].yarnVariantId);
      }

      setColors(colList || []);
      if (colList && colList.length > 0) {
        setSelectedColorId((prev) => {
          if (!prev) {
            setEditColorName(colList[0].name);
            setEditColorHex((colList[0] as any).hexCode || "#000000");
            return colList[0].colorId;
          }
          return prev;
        });
      }

      setDesigns(desList || []);
      if (desList && desList.length > 0) {
        setSelectedDesignId((prev) => {
          if (!prev) {
            setEditDesignName(desList[0].name);
            setEditDesignDescription((desList[0] as any).description || "");
            return desList[0].designId;
          }
          return prev;
        });
      }

      setSuppliers(supList || []);
      if (supList && supList.length > 0) {
        setSelectedSupplierId((prev) => {
          if (!prev) {
            setEditSupplierName(supList[0].name);
            setEditSupplierPhone(supList[0].contactPhone || "");
            return supList[0].supplierId;
          }
          return prev;
        });
      }
    } catch {
      setFabrics([]);
      setSelectedFabricId(null);
      setEditName("");
      setEditWeight("");
      setEditLength("");
      setEditWidth("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Selected entities
  const selectedFabric = useMemo(() => {
    return fabrics.find((f) => f.fabricId === selectedFabricId) || null;
  }, [fabrics, selectedFabricId]);

  const selectedYarn = useMemo(() => {
    return yarns.find((y) => y.yarnId === selectedYarnId) || null;
  }, [yarns, selectedYarnId]);

  const selectedColor = useMemo(() => {
    return colors.find((c) => c.colorId === selectedColorId) || null;
  }, [colors, selectedColorId]);

  const selectedDesign = useMemo(() => {
    return designs.find((d) => d.designId === selectedDesignId) || null;
  }, [designs, selectedDesignId]);

  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.supplierId === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  const selectedFabricVariant = useMemo(() => {
    return fabricVariants.find((fv) => fv.fabricVariantId === selectedFabricVariantId) || null;
  }, [fabricVariants, selectedFabricVariantId]);

  const selectedYarnVariant = useMemo(() => {
    return yarnVariants.find((yv) => yv.yarnVariantId === selectedYarnVariantId) || null;
  }, [yarnVariants, selectedYarnVariantId]);

  // Handlers: Fabrics
  const handleSelectFabric = (f: FabricWithRates) => {
    setSelectedFabricId(f.fabricId);
    setEditName(f.name);
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

    const name = editName.trim();
    if (!name) {
      setErrorMessage("Fabric name is required.");
      return;
    }
    if (isNaN(wNum) || isNaN(lNum) || isNaN(wdNum)) {
      setErrorMessage("Please enter valid numeric dimensions and weight.");
      return;
    }

    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      await catalogApi.updateFabric(selectedFabric.fabricId, {
        name,
        standardWeightG: wNum,
        standardLengthCm: lNum,
        standardWidthCm: wdNum,
      });

      setStatusMessage(`Fabric "${name}" updated.`);
      setFabrics((prev) =>
        prev.map((f) =>
          f.fabricId === selectedFabric.fabricId
            ? { ...f, name, standardWeightG: wNum, standardLengthCm: lNum, standardWidthCm: wdNum }
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

  // Handlers: Yarns
  const handleSelectYarn = (y: any) => {
    setSelectedYarnId(y.yarnId);
    setEditYarnName(y.name);
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleSaveYarnSpecs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYarn) return;
    const name = editYarnName.trim();
    if (!name) {
      setErrorMessage("Yarn name is required.");
      return;
    }
    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      await catalogApi.updateYarn(selectedYarn.yarnId, { name });
      setStatusMessage(`Yarn "${name}" updated.`);
      setYarns((prev) =>
        prev.map((y) => (y.yarnId === selectedYarn.yarnId ? { ...y, name } : y))
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update yarn");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleYarnStatus = async () => {
    if (!selectedYarn) return;
    const nextActive = selectedYarn.isActive === false;
    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      await catalogApi.updateYarn(selectedYarn.yarnId, { isActive: nextActive });
      setStatusMessage(`Yarn "${selectedYarn.name}" ${nextActive ? "reactivated" : "deactivated"}.`);
      setYarns((prev) =>
        prev.map((y) => (y.yarnId === selectedYarn.yarnId ? { ...y, isActive: nextActive } : y))
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update yarn status");
    } finally {
      setSaving(false);
    }
  };

  // Handlers: Colors
  const handleSelectColor = (c: any) => {
    setSelectedColorId(c.colorId);
    setEditColorName(c.name);
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleSaveColorSpecs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedColor) return;
    const name = editColorName.trim();
    if (!name) {
      setErrorMessage("Color name is required.");
      return;
    }
    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      await catalogApi.updateColor(selectedColor.colorId, { name });
      setStatusMessage(`Color "${name}" updated.`);
      setColors((prev) =>
        prev.map((c) =>
          c.colorId === selectedColor.colorId ? { ...c, name } : c
        )
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update color");
    } finally {
      setSaving(false);
    }
  };

  // Handlers: Designs
  const handleSelectDesign = (d: any) => {
    setSelectedDesignId(d.designId);
    setEditDesignName(d.name);
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleSaveDesignSpecs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesign) return;
    const name = editDesignName.trim();
    if (!name) {
      setErrorMessage("Design name is required.");
      return;
    }
    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      await catalogApi.updateDesign(selectedDesign.designId, { name });
      setStatusMessage(`Design "${name}" updated.`);
      setDesigns((prev) =>
        prev.map((d) =>
          d.designId === selectedDesign.designId ? { ...d, name } : d
        )
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update design");
    } finally {
      setSaving(false);
    }
  };

  // Handlers: Suppliers
  const handleSelectSupplier = (s: any) => {
    setSelectedSupplierId(s.supplierId);
    setEditSupplierName(s.name);
    setEditSupplierPhone(s.contactPhone || "");
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleSaveSupplierSpecs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    const name = editSupplierName.trim();
    if (!name) {
      setErrorMessage("Supplier name is required.");
      return;
    }
    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      await catalogApi.updateSupplier(selectedSupplier.supplierId, {
        name,
        contactPhone: editSupplierPhone.trim() || undefined,
      });
      setStatusMessage(`Supplier "${name}" updated.`);
      setSuppliers((prev) =>
        prev.map((s) =>
          s.supplierId === selectedSupplier.supplierId
            ? { ...s, name, contactPhone: editSupplierPhone }
            : s
        )
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update supplier");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSupplierStatus = async () => {
    if (!selectedSupplier) return;
    const nextActive = selectedSupplier.isActive === false;
    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      await catalogApi.updateSupplier(selectedSupplier.supplierId, { isActive: nextActive });
      setStatusMessage(
        `Supplier "${selectedSupplier.name}" ${nextActive ? "reactivated" : "deactivated"}.`
      );
      setSuppliers((prev) =>
        prev.map((s) =>
          s.supplierId === selectedSupplier.supplierId ? { ...s, isActive: nextActive } : s
        )
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update supplier status");
    } finally {
      setSaving(false);
    }
  };

  // Handlers: Variants
  const handleSelectFabricVariant = (fv: any) => {
    setSelectedFabricVariantId(fv.fabricVariantId);
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleToggleFabricVariantStatus = async (targetFv?: any) => {
    const fv = targetFv || selectedFabricVariant;
    if (!fv) return;
    const nextActive = fv.isActive === false;
    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      await catalogApi.updateFabricVariant(fv.fabricVariantId, {
        isActive: nextActive,
      });
      setStatusMessage(
        `Fabric variant "${fv.sku}" ${nextActive ? "reactivated" : "deactivated"}.`
      );
      setFabricVariants((prev) =>
        prev.map((item) =>
          item.fabricVariantId === fv.fabricVariantId
            ? { ...item, isActive: nextActive }
            : item
        )
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update variant status");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectYarnVariant = (yv: any) => {
    setSelectedYarnVariantId(yv.yarnVariantId);
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleToggleYarnVariantStatus = async (targetYv?: any) => {
    const yv = targetYv || selectedYarnVariant;
    if (!yv) return;
    const nextActive = yv.isActive === false;
    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      await catalogApi.updateYarnVariant(yv.yarnVariantId, {
        isActive: nextActive,
      });
      setStatusMessage(
        `Yarn variant "${yv.sku}" ${nextActive ? "reactivated" : "deactivated"}.`
      );
      setYarnVariants((prev) =>
        prev.map((item) =>
          item.yarnVariantId === yv.yarnVariantId
            ? { ...item, isActive: nextActive }
            : item
        )
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update variant status");
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
    // Fabrics
    selectedFabricId,
    selectedFabric,
    handleSelectFabric,
    editName,
    setEditName,
    editWeight,
    setEditWeight,
    editLength,
    setEditLength,
    editWidth,
    setEditWidth,
    handleSaveFabricSpecs,
    handleToggleFabricStatus,
    // Yarns
    selectedYarnId,
    selectedYarn,
    handleSelectYarn,
    editYarnName,
    setEditYarnName,
    handleSaveYarnSpecs,
    handleToggleYarnStatus,
    // Colors
    selectedColorId,
    selectedColor,
    handleSelectColor,
    editColorName,
    setEditColorName,
    editColorHex,
    setEditColorHex,
    handleSaveColorSpecs,
    // Designs
    selectedDesignId,
    selectedDesign,
    handleSelectDesign,
    editDesignName,
    setEditDesignName,
    editDesignDescription,
    setEditDesignDescription,
    handleSaveDesignSpecs,
    // Suppliers
    selectedSupplierId,
    selectedSupplier,
    handleSelectSupplier,
    editSupplierName,
    setEditSupplierName,
    editSupplierPhone,
    setEditSupplierPhone,
    handleSaveSupplierSpecs,
    handleToggleSupplierStatus,
    // Variants
    selectedFabricVariantId,
    selectedFabricVariant,
    handleSelectFabricVariant,
    handleToggleFabricVariantStatus,
    selectedYarnVariantId,
    selectedYarnVariant,
    handleSelectYarnVariant,
    handleToggleYarnVariantStatus,
    // Shared
    loading,
    saving,
    statusMessage,
    setStatusMessage,
    errorMessage,
    setErrorMessage,
    loadAllData,
  };
}
