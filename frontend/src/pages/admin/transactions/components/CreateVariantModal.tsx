import { useMemo } from "react";
import type { FormEvent } from "react";
import { Modal, SearchableSelect } from "../../../../components/common";

export interface CreateVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFabric: boolean;
  variantModalError: string;
  savingVariant: boolean;
  onSaveNewVariant: (e: FormEvent) => Promise<void>;
  // Catalogs
  fabrics: any[];
  yarns: any[];
  colors: any[];
  designs: any[];
  suppliers: any[];
  // Selected IDs
  newFvFabricId: string;
  setNewFvFabricId: (val: string) => void;
  newFvWarpColorId: string;
  setNewFvWarpColorId: (val: string) => void;
  newFvWeftColorId: string;
  setNewFvWeftColorId: (val: string) => void;
  newFvDesignId: string;
  setNewFvDesignId: (val: string) => void;
  newYvYarnId: string;
  setNewYvYarnId: (val: string) => void;
  newYvColorId: string;
  setNewYvColorId: (val: string) => void;
  newYvSupplierId: string;
  setNewYvSupplierId: (val: string) => void;
  // Inline Creators
  showNewFabricForm: boolean;
  setShowNewFabricForm: (val: boolean) => void;
  inlineFabricName: string;
  setInlineFabricName: (val: string) => void;
  inlineFabricWeight: string;
  setInlineFabricWeight: (val: string) => void;
  inlineFabricLength: string;
  setInlineFabricLength: (val: string) => void;
  inlineFabricWidth: string;
  setInlineFabricWidth: (val: string) => void;
  handleCreateInlineFabric: () => Promise<void>;
  showNewWarpColorForm: boolean;
  setShowNewWarpColorForm: (val: boolean) => void;
  inlineWarpColorName: string;
  setInlineWarpColorName: (val: string) => void;
  handleCreateInlineWarpColor: () => Promise<void>;
  showNewWeftColorForm: boolean;
  setShowNewWeftColorForm: (val: boolean) => void;
  inlineWeftColorName: string;
  setInlineWeftColorName: (val: string) => void;
  handleCreateInlineWeftColor: () => Promise<void>;
  showNewDesignForm: boolean;
  setShowNewDesignForm: (val: boolean) => void;
  inlineDesignName: string;
  setInlineDesignName: (val: string) => void;
  handleCreateInlineDesign: () => Promise<void>;
  showNewYarnForm: boolean;
  setShowNewYarnForm: (val: boolean) => void;
  inlineYarnName: string;
  setInlineYarnName: (val: string) => void;
  handleCreateInlineYarn: () => Promise<void>;
  showNewYarnColorForm: boolean;
  setShowNewYarnColorForm: (val: boolean) => void;
  inlineYarnColorName: string;
  setInlineYarnColorName: (val: string) => void;
  handleCreateInlineYarnColor: () => Promise<void>;
  showNewSupplierForm: boolean;
  setShowNewSupplierForm: (val: boolean) => void;
  inlineSupplierName: string;
  setInlineSupplierName: (val: string) => void;
  inlineSupplierPhone: string;
  setInlineSupplierPhone: (val: string) => void;
  handleCreateInlineSupplier: () => Promise<void>;
}

export function CreateVariantModal({
  isOpen,
  onClose,
  isFabric,
  variantModalError,
  savingVariant,
  onSaveNewVariant,
  fabrics,
  yarns,
  colors,
  designs,
  suppliers,
  newFvFabricId,
  setNewFvFabricId,
  newFvWarpColorId,
  setNewFvWarpColorId,
  newFvWeftColorId,
  setNewFvWeftColorId,
  newFvDesignId,
  setNewFvDesignId,
  newYvYarnId,
  setNewYvYarnId,
  newYvColorId,
  setNewYvColorId,
  newYvSupplierId,
  setNewYvSupplierId,
  showNewFabricForm,
  setShowNewFabricForm,
  inlineFabricName,
  setInlineFabricName,
  inlineFabricWeight,
  setInlineFabricWeight,
  inlineFabricLength,
  setInlineFabricLength,
  inlineFabricWidth,
  setInlineFabricWidth,
  handleCreateInlineFabric,
  showNewWarpColorForm,
  setShowNewWarpColorForm,
  inlineWarpColorName,
  setInlineWarpColorName,
  handleCreateInlineWarpColor,
  showNewWeftColorForm,
  setShowNewWeftColorForm,
  inlineWeftColorName,
  setInlineWeftColorName,
  handleCreateInlineWeftColor,
  showNewDesignForm,
  setShowNewDesignForm,
  inlineDesignName,
  setInlineDesignName,
  handleCreateInlineDesign,
  showNewYarnForm,
  setShowNewYarnForm,
  inlineYarnName,
  setInlineYarnName,
  handleCreateInlineYarn,
  showNewYarnColorForm,
  setShowNewYarnColorForm,
  inlineYarnColorName,
  setInlineYarnColorName,
  handleCreateInlineYarnColor,
  showNewSupplierForm,
  setShowNewSupplierForm,
  inlineSupplierName,
  setInlineSupplierName,
  inlineSupplierPhone,
  setInlineSupplierPhone,
  handleCreateInlineSupplier,
}: CreateVariantModalProps) {
  const fabricOptions = useMemo(
    () =>
      fabrics.map((f) => ({
        id: String(f.fabricId),
        title: f.name,
        subtitle: `${f.standardWeightG || f.standardWeight || 0}g standard`,
      })),
    [fabrics]
  );

  const colorOptions = useMemo(
    () =>
      colors.map((c) => ({
        id: String(c.colorId),
        title: c.name,
        badge: c.hexCode || undefined,
      })),
    [colors]
  );

  const designOptions = useMemo(
    () =>
      designs.map((d) => ({
        id: String(d.designId),
        title: d.name,
      })),
    [designs]
  );

  const yarnOptions = useMemo(
    () =>
      yarns.map((y) => ({
        id: String(y.yarnId),
        title: y.name,
        subtitle: [y.material, y.type].filter(Boolean).join(" · "),
      })),
    [yarns]
  );

  const supplierOptions = useMemo(
    () =>
      suppliers.map((s) => ({
        id: String(s.supplierId),
        title: s.name,
        subtitle: s.contactPhone ? `Phone: ${s.contactPhone}` : undefined,
      })),
    [suppliers]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={540}
      title={`Add new ${isFabric ? "fabric" : "yarn"} variant · አዲስ ${isFabric ? "ጨርቅ" : "ክር"} ዓይነት`}
      subtitle={
        isFabric
          ? "Specify the fabric structure, design pattern, and warp/weft colors."
          : "Specify yarn material, color, and supplier."
      }
    >
      {variantModalError && (
        <div
          style={{
            background: "var(--color-danger-subtle, #fef2f2)",
            border: "1px solid var(--color-danger-border, #fecaca)",
            color: "var(--color-danger-dark, #991b1b)",
            padding: "0.6rem 0.85rem",
            borderRadius: "var(--radius-sm, 8px)",
            marginBottom: "1rem",
            fontSize: "13px",
          }}
        >
          ⚠️ {variantModalError}
        </div>
      )}

      <form onSubmit={onSaveNewVariant} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {isFabric ? (
          <>
            {/* Fabric Selection + Inline Add */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.3rem",
                }}
              >
                <label className="form-label" style={{ fontSize: "12.5px" }}>
                  Fabric · ጨርቅ
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewFabricForm(!showNewFabricForm)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-primary, #c2410c)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {showNewFabricForm ? "− Cancel" : "+ New fabric"}
                </button>
              </div>

              {showNewFabricForm && (
                <div
                  style={{
                    background: "var(--color-orange-50, #fff7ed)",
                    border: "1px solid var(--color-orange-100, #ffedd5)",
                    borderRadius: "var(--radius-sm, 8px)",
                    padding: "0.75rem",
                    marginBottom: "0.6rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--color-orange-800, #9a3412)",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Create new base fabric
                  </div>
                  <input
                    type="text"
                    placeholder="Fabric name (e.g. Shemma / ሸማ)"
                    value={inlineFabricName}
                    onChange={(e) => setInlineFabricName(e.target.value)}
                    className="input"
                    style={{
                      fontSize: "13px",
                      padding: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "0.4rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <input
                      type="number"
                      placeholder="Weight (g)"
                      value={inlineFabricWeight}
                      onChange={(e) => setInlineFabricWeight(e.target.value)}
                      className="input"
                      style={{ fontSize: "12.5px", padding: "0.45rem" }}
                    />
                    <input
                      type="number"
                      placeholder="Length (cm)"
                      value={inlineFabricLength}
                      onChange={(e) => setInlineFabricLength(e.target.value)}
                      className="input"
                      style={{ fontSize: "12.5px", padding: "0.45rem" }}
                    />
                    <input
                      type="number"
                      placeholder="Width (cm)"
                      value={inlineFabricWidth}
                      onChange={(e) => setInlineFabricWidth(e.target.value)}
                      className="input"
                      style={{ fontSize: "12.5px", padding: "0.45rem" }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateInlineFabric}
                    className="btn btn-primary"
                    style={{
                      padding: "0.4rem 0.8rem",
                      fontSize: "12px",
                    }}
                  >
                    Add & Select Fabric
                  </button>
                </div>
              )}

              <SearchableSelect
                value={newFvFabricId}
                onChange={(val) => setNewFvFabricId(val)}
                options={fabricOptions}
                placeholder="Search fabric (e.g. Gabi)…"
                onAddNew={() => setShowNewFabricForm(true)}
                addNewLabel="New fabric"
                required
              />
            </div>

            {/* Colors: Warp and Weft with inline add */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.3rem",
                  }}
                >
                  <label className="form-label" style={{ fontSize: "12.5px" }}>
                    Warp color · የድረ
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewWarpColorForm(!showNewWarpColorForm)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-primary, #c2410c)",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {showNewWarpColorForm ? "−" : "+ New"}
                  </button>
                </div>

                {showNewWarpColorForm && (
                  <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.4rem" }}>
                    <input
                      type="text"
                      placeholder="Color name"
                      value={inlineWarpColorName}
                      onChange={(e) => setInlineWarpColorName(e.target.value)}
                      className="input"
                      style={{ flex: 1, padding: "0.4rem", fontSize: "12px" }}
                    />
                    <button
                      type="button"
                      onClick={handleCreateInlineWarpColor}
                      className="btn btn-primary"
                      style={{ padding: "0.4rem 0.6rem", fontSize: "12px" }}
                    >
                      Add
                    </button>
                  </div>
                )}

                <SearchableSelect
                  value={newFvWarpColorId}
                  onChange={(val) => setNewFvWarpColorId(val)}
                  options={colorOptions}
                  placeholder="Search warp color…"
                  onAddNew={() => setShowNewWarpColorForm(true)}
                  addNewLabel="New color"
                  required
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.3rem",
                  }}
                >
                  <label className="form-label" style={{ fontSize: "12.5px" }}>
                    Weft color · የማግ
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewWeftColorForm(!showNewWeftColorForm)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-primary, #c2410c)",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {showNewWeftColorForm ? "−" : "+ New"}
                  </button>
                </div>

                {showNewWeftColorForm && (
                  <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.4rem" }}>
                    <input
                      type="text"
                      placeholder="Color name"
                      value={inlineWeftColorName}
                      onChange={(e) => setInlineWeftColorName(e.target.value)}
                      className="input"
                      style={{ flex: 1, padding: "0.4rem", fontSize: "12px" }}
                    />
                    <button
                      type="button"
                      onClick={handleCreateInlineWeftColor}
                      className="btn btn-primary"
                      style={{ padding: "0.4rem 0.6rem", fontSize: "12px" }}
                    >
                      Add
                    </button>
                  </div>
                )}

                <SearchableSelect
                  value={newFvWeftColorId}
                  onChange={(val) => setNewFvWeftColorId(val)}
                  options={colorOptions}
                  placeholder="Search weft color…"
                  onAddNew={() => setShowNewWeftColorForm(true)}
                  addNewLabel="New color"
                  required
                />
              </div>
            </div>

            {/* Design & SKU */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.3rem",
                  }}
                >
                  <label className="form-label" style={{ fontSize: "12.5px" }}>
                    Design · ጥበብ
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewDesignForm(!showNewDesignForm)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-primary, #c2410c)",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {showNewDesignForm ? "−" : "+ New"}
                  </button>
                </div>

                {showNewDesignForm && (
                  <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.4rem" }}>
                    <input
                      type="text"
                      placeholder="Design name"
                      value={inlineDesignName}
                      onChange={(e) => setInlineDesignName(e.target.value)}
                      className="input"
                      style={{ flex: 1, padding: "0.4rem", fontSize: "12px" }}
                    />
                    <button
                      type="button"
                      onClick={handleCreateInlineDesign}
                      className="btn btn-primary"
                      style={{ padding: "0.4rem 0.6rem", fontSize: "12px" }}
                    >
                      Add
                    </button>
                  </div>
                )}

                <SearchableSelect
                  value={newFvDesignId}
                  onChange={(val) => setNewFvDesignId(val)}
                  options={designOptions}
                  placeholder="Search design (e.g. Tibeb)…"
                  onAddNew={() => setShowNewDesignForm(true)}
                  addNewLabel="New design"
                />
              </div>

              <div style={{ fontSize: "12px", color: "var(--color-text-secondary, #666)", gridColumn: "1 / -1" }}>
                ℹ️ SKU is automatically generated with a unique deterministic code (e.g. FV-{'{fabric}'}-{'{design}'}-{'{warp}'}-{'{weft}'}).
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Yarn Material + Inline Add */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.3rem",
                }}
              >
                <label className="form-label" style={{ fontSize: "12.5px" }}>
                  Yarn · ክር
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewYarnForm(!showNewYarnForm)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-primary, #c2410c)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {showNewYarnForm ? "− Cancel" : "+ New yarn material"}
                </button>
              </div>

              {showNewYarnForm && (
                <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="Yarn material name (e.g. Cotton / ጥጥ)"
                    value={inlineYarnName}
                    onChange={(e) => setInlineYarnName(e.target.value)}
                    className="input"
                    style={{ flex: 1, padding: "0.45rem 0.6rem", fontSize: "13px" }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateInlineYarn}
                    className="btn btn-primary"
                    style={{ padding: "0.45rem 0.8rem", fontSize: "12.5px" }}
                  >
                    Add
                  </button>
                </div>
              )}

              <SearchableSelect
                value={newYvYarnId}
                onChange={(val) => setNewYvYarnId(val)}
                options={yarnOptions}
                placeholder="Search yarn material…"
                onAddNew={() => setShowNewYarnForm(true)}
                addNewLabel="New yarn"
                required
              />
            </div>

            {/* Yarn Color & Supplier with Inline Add */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.3rem",
                  }}
                >
                  <label className="form-label" style={{ fontSize: "12.5px" }}>
                    Color · ቀለም
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewYarnColorForm(!showNewYarnColorForm)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-primary, #c2410c)",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {showNewYarnColorForm ? "−" : "+ New"}
                  </button>
                </div>

                {showNewYarnColorForm && (
                  <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.4rem" }}>
                    <input
                      type="text"
                      placeholder="Color name"
                      value={inlineYarnColorName}
                      onChange={(e) => setInlineYarnColorName(e.target.value)}
                      className="input"
                      style={{ flex: 1, padding: "0.4rem", fontSize: "12px" }}
                    />
                    <button
                      type="button"
                      onClick={handleCreateInlineYarnColor}
                      className="btn btn-primary"
                      style={{ padding: "0.4rem 0.6rem", fontSize: "12px" }}
                    >
                      Add
                    </button>
                  </div>
                )}

                <SearchableSelect
                  value={newYvColorId}
                  onChange={(val) => setNewYvColorId(val)}
                  options={colorOptions}
                  placeholder="Search color…"
                  onAddNew={() => setShowNewYarnColorForm(true)}
                  addNewLabel="New color"
                  required
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.3rem",
                  }}
                >
                  <label className="form-label" style={{ fontSize: "12.5px" }}>
                    Supplier · አቅራቢ
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewSupplierForm(!showNewSupplierForm)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-primary, #c2410c)",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {showNewSupplierForm ? "−" : "+ New"}
                  </button>
                </div>

                {showNewSupplierForm && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.4rem" }}>
                    <input
                      type="text"
                      placeholder="Supplier name"
                      value={inlineSupplierName}
                      onChange={(e) => setInlineSupplierName(e.target.value)}
                      className="input"
                      style={{ padding: "0.4rem", fontSize: "12px" }}
                    />
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      <input
                        type="text"
                        placeholder="Phone (optional)"
                        value={inlineSupplierPhone}
                        onChange={(e) => setInlineSupplierPhone(e.target.value)}
                        className="input"
                        style={{ flex: 1, padding: "0.4rem", fontSize: "12px" }}
                      />
                      <button
                        type="button"
                        onClick={handleCreateInlineSupplier}
                        className="btn btn-primary"
                        style={{ padding: "0.4rem 0.6rem", fontSize: "12px" }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                <SearchableSelect
                  value={newYvSupplierId}
                  onChange={(val) => setNewYvSupplierId(val)}
                  options={supplierOptions}
                  placeholder="Search supplier…"
                  onAddNew={() => setShowNewSupplierForm(true)}
                  addNewLabel="New supplier"
                  required
                />
              </div>
            </div>

            <div style={{ fontSize: "12px", color: "var(--color-text-secondary, #666)" }}>
              ℹ️ SKU is automatically generated with a unique deterministic code (e.g. YV-{'{yarn}'}-{'{supplier}'}-{'{color}'}).
            </div>
          </>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ fontSize: "14px" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={savingVariant}
            className="btn btn-primary"
            style={{ fontSize: "14px" }}
          >
            {savingVariant ? "Saving…" : "Save & Select Variant"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
