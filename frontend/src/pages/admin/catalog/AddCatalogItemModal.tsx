import React, { useState } from "react";
import type { CatalogTab, FabricWithRates } from "./useCatalogData";
import type { FabricVariant } from "../../../api";
import { catalogApi } from "../../../api";
import { Button, FormField, Modal, SearchableSelect } from "../../../components/common";

export interface AddCatalogItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: CatalogTab;
  fabrics: FabricWithRates[];
  fabricVariants: FabricVariant[];
  yarns: any[];
  yarnVariants: any[];
  colors: any[];
  designs: any[];
  suppliers: any[];
  onItemCreated: (msg: string) => void;
  onRefreshData: () => Promise<void>;
}

export function AddCatalogItemModal({
  isOpen,
  onClose,
  activeTab,
  fabrics,
  yarns,
  colors,
  designs,
  suppliers,
  onItemCreated,
  onRefreshData,
}: AddCatalogItemModalProps) {
  // Add Fabric fields
  const [newFabricName, setNewFabricName] = useState("");
  const [newFabricWeight, setNewFabricWeight] = useState("");
  const [newFabricLength, setNewFabricLength] = useState("");
  const [newFabricWidth, setNewFabricWidth] = useState("");

  // Add Fabric Variant fields
  const [newFvFabricId, setNewFvFabricId] = useState<number | "">("");
  const [newFvWarpColorId, setNewFvWarpColorId] = useState<number | "">("");
  const [newFvWeftColorId, setNewFvWeftColorId] = useState<number | "">("");
  const [newFvDesignId, setNewFvDesignId] = useState<number | "">("");
  const [newFvSku, setNewFvSku] = useState("");

  // Add Yarn Variant fields
  const [newYvYarnId, setNewYvYarnId] = useState<number | "">("");
  const [newYvColorId, setNewYvColorId] = useState<number | "">("");
  const [newYvSupplierId, setNewYvSupplierId] = useState<number | "">("");
  const [newYvSku, setNewYvSku] = useState("");

  // Add Simple items (Yarn, Color, Design, Supplier)
  const [newSimpleName, setNewSimpleName] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const resetFields = () => {
    setNewFabricName("");
    setNewFabricWeight("");
    setNewFabricLength("");
    setNewFabricWidth("");
    setNewFvFabricId(fabrics[0]?.fabricId || "");
    setNewFvWarpColorId(colors[0]?.colorId || "");
    setNewFvWeftColorId(colors[0]?.colorId || "");
    setNewFvDesignId(designs[0]?.designId || "");
    setNewFvSku("");
    setNewYvYarnId(yarns[0]?.yarnId || "");
    setNewYvColorId(colors[0]?.colorId || "");
    setNewYvSupplierId(suppliers[0]?.supplierId || "");
    setNewYvSku("");
    setNewSimpleName("");
    setNewSupplierPhone("");
    setError("");
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (activeTab === "fabrics") {
        if (!newFabricName.trim() || !newFabricWeight || !newFabricLength || !newFabricWidth) {
          setError("All measurements and name are required.");
          setSaving(false);
          return;
        }
        await catalogApi.createFabric({
          name: newFabricName.trim().toLowerCase(),
          standardWeightG: Number(newFabricWeight),
          standardLengthCm: Number(newFabricLength),
          standardWidthCm: Number(newFabricWidth),
        });
        onItemCreated(`Fabric "${newFabricName}" added successfully.`);
      } else if (activeTab === "fabricVariants") {
        if (!newFvFabricId || !newFvWarpColorId || !newFvWeftColorId || !newFvDesignId) {
          setError("Please select Fabric, Warp, Weft, and Design.");
          setSaving(false);
          return;
        }
        await catalogApi.createFabricVariant({
          fabricId: Number(newFvFabricId),
          warpColorId: Number(newFvWarpColorId),
          weftColorId: Number(newFvWeftColorId),
          designId: Number(newFvDesignId),
          sku: newFvSku.trim() || undefined,
        });
        onItemCreated("Fabric type variant added successfully.");
      } else if (activeTab === "yarns") {
        if (!newSimpleName.trim()) {
          setError("Yarn name is required.");
          setSaving(false);
          return;
        }
        await catalogApi.createYarn({ name: newSimpleName.trim() });
        onItemCreated(`Yarn "${newSimpleName}" added successfully.`);
      } else if (activeTab === "yarnVariants") {
        if (!newYvYarnId || !newYvColorId || !newYvSupplierId) {
          setError("Please select Yarn, Color, and Supplier.");
          setSaving(false);
          return;
        }
        await catalogApi.createYarnVariant({
          yarnId: Number(newYvYarnId),
          colorId: Number(newYvColorId),
          supplierId: Number(newYvSupplierId),
          sku: newYvSku.trim() || undefined,
        });
        onItemCreated("Yarn type variant added successfully.");
      } else if (activeTab === "colors") {
        if (!newSimpleName.trim()) {
          setError("Color name is required.");
          setSaving(false);
          return;
        }
        await catalogApi.createColor({ name: newSimpleName.trim() });
        onItemCreated(`Color "${newSimpleName}" added successfully.`);
      } else if (activeTab === "designs") {
        if (!newSimpleName.trim()) {
          setError("Design name is required.");
          setSaving(false);
          return;
        }
        await catalogApi.createDesign({ name: newSimpleName.trim() });
        onItemCreated(`Design "${newSimpleName}" added successfully.`);
      } else if (activeTab === "suppliers") {
        if (!newSimpleName.trim()) {
          setError("Supplier name is required.");
          setSaving(false);
          return;
        }
        await catalogApi.createSupplier({
          name: newSimpleName.trim(),
          contactPhone: newSupplierPhone.trim() || undefined,
        });
        onItemCreated(`Supplier "${newSimpleName}" added successfully.`);
      }

      handleClose();
      await onRefreshData();
    } catch (err: any) {
      setError(err.message || "Failed to create catalog entry");
    } finally {
      setSaving(false);
    }
  };

  const titles: Record<CatalogTab, string> = {
    fabrics: "Add New Fabric (አዲስ የጨርቅ አይነት)",
    fabricVariants: "Add New Fabric Type / Variant (አዲስ የጨርቅ አይነት)",
    yarns: "Add New Yarn (አዲስ ክር)",
    yarnVariants: "Add New Yarn Type (አዲስ የክር አይነት)",
    colors: "Add New Color (አዲስ ቀለም)",
    designs: "Add New Design / Pattern (አዲስ ጥበብ)",
    suppliers: "Add New Supplier (አዲስ አቅራቢ)",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={titles[activeTab] || "Add Catalog Item"}
      maxWidth={480}
    >
      {error && (
        <div className="alert-banner alert-banner--error" style={{ marginBottom: "var(--space-4)" }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="stack">
        {/* Fabric fields */}
        {activeTab === "fabrics" && (
          <>
            <FormField label="Fabric Name (ስም)" required hint="e.g. gabi, netela, bulluko">
              <input
                type="text"
                className="input"
                required
                value={newFabricName}
                onChange={(e) => setNewFabricName(e.target.value)}
              />
            </FormField>
            <FormField label="Standard weight (ግራም)" required>
              <input
                type="number"
                className="input"
                required
                value={newFabricWeight}
                onChange={(e) => setNewFabricWeight(e.target.value)}
              />
            </FormField>
            <div className="form-row">
              <FormField label="Standard length (cm)" required>
                <input
                  type="number"
                  className="input"
                  required
                  value={newFabricLength}
                  onChange={(e) => setNewFabricLength(e.target.value)}
                />
              </FormField>
              <FormField label="Standard width (cm)" required>
                <input
                  type="number"
                  className="input"
                  required
                  value={newFabricWidth}
                  onChange={(e) => setNewFabricWidth(e.target.value)}
                />
              </FormField>
            </div>
          </>
        )}

        {/* Fabric Variant fields */}
        {activeTab === "fabricVariants" && (
          <>
            <FormField label="Fabric" required>
              <SearchableSelect
                value={newFvFabricId}
                onChange={(val) => setNewFvFabricId(val ? Number(val) : "")}
                options={fabrics.map((f) => ({ id: f.fabricId, title: f.name }))}
                placeholder="Select fabric…"
              />
            </FormField>
            <FormField label="Warp color" required>
              <SearchableSelect
                value={newFvWarpColorId}
                onChange={(val) => setNewFvWarpColorId(val ? Number(val) : "")}
                options={colors.map((c) => ({ id: c.colorId, title: c.name }))}
                placeholder="Select warp color…"
              />
            </FormField>
            <FormField label="Weft color" required>
              <SearchableSelect
                value={newFvWeftColorId}
                onChange={(val) => setNewFvWeftColorId(val ? Number(val) : "")}
                options={colors.map((c) => ({ id: c.colorId, title: c.name }))}
                placeholder="Select weft color…"
              />
            </FormField>
            <FormField label="Design Pattern" required>
              <SearchableSelect
                value={newFvDesignId}
                onChange={(val) => setNewFvDesignId(val ? Number(val) : "")}
                options={designs.map((d) => ({ id: d.designId, title: d.name }))}
                placeholder="Select design…"
              />
            </FormField>
            <FormField label="SKU (Optional)">
              <input
                type="text"
                className="input"
                placeholder="e.g. GAB-WHT-NAT"
                value={newFvSku}
                onChange={(e) => setNewFvSku(e.target.value)}
              />
            </FormField>
          </>
        )}

        {/* Yarn fields */}
        {activeTab === "yarns" && (
          <FormField label="Yarn Name (የክር ስም)" required hint="e.g. Cotton 21/2, Akaki Yarn">
            <input
              type="text"
              className="input"
              required
              value={newSimpleName}
              onChange={(e) => setNewSimpleName(e.target.value)}
            />
          </FormField>
        )}

        {/* Yarn Variant fields */}
        {activeTab === "yarnVariants" && (
          <>
            <FormField label="Yarn" required>
              <SearchableSelect
                value={newYvYarnId}
                onChange={(val) => setNewYvYarnId(val ? Number(val) : "")}
                options={yarns.map((y) => ({ id: y.yarnId, title: y.name }))}
                placeholder="Select yarn…"
              />
            </FormField>
            <FormField label="Color" required>
              <SearchableSelect
                value={newYvColorId}
                onChange={(val) => setNewYvColorId(val ? Number(val) : "")}
                options={colors.map((c) => ({ id: c.colorId, title: c.name }))}
                placeholder="Select color…"
              />
            </FormField>
            <FormField label="Supplier" required>
              <SearchableSelect
                value={newYvSupplierId}
                onChange={(val) => setNewYvSupplierId(val ? Number(val) : "")}
                options={suppliers.map((s) => ({ id: s.supplierId, title: s.name }))}
                placeholder="Select supplier…"
              />
            </FormField>
            <FormField label="SKU (Optional)">
              <input
                type="text"
                className="input"
                placeholder="e.g. YRN-COT-BLU"
                value={newYvSku}
                onChange={(e) => setNewYvSku(e.target.value)}
              />
            </FormField>
          </>
        )}

        {/* Color fields */}
        {activeTab === "colors" && (
          <FormField label="Color Name (የቀለም ስም)" required hint="e.g. White, Black, Red, Indigo">
            <input
              type="text"
              className="input"
              required
              value={newSimpleName}
              onChange={(e) => setNewSimpleName(e.target.value)}
            />
          </FormField>
        )}

        {/* Design fields */}
        {activeTab === "designs" && (
          <FormField label="Design Name (የጥበብ ስም)" required hint="e.g. Zig-Zag, Plain, Diagonal">
            <input
              type="text"
              className="input"
              required
              value={newSimpleName}
              onChange={(e) => setNewSimpleName(e.target.value)}
            />
          </FormField>
        )}

        {/* Supplier fields */}
        {activeTab === "suppliers" && (
          <>
            <FormField label="Supplier Name (የአቅራቢ ስም)" required>
              <input
                type="text"
                className="input"
                required
                value={newSimpleName}
                onChange={(e) => setNewSimpleName(e.target.value)}
              />
            </FormField>
            <FormField label="Contact Phone (ስልክ)">
              <input
                type="tel"
                className="input"
                placeholder="0911234567"
                value={newSupplierPhone}
                onChange={(e) => setNewSupplierPhone(e.target.value)}
              />
            </FormField>
          </>
        )}

        <div className="cluster" style={{ justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AddCatalogItemModal;
