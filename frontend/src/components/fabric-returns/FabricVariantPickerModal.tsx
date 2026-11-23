import { useMemo } from "react";
import type { Color, Design, Fabric, FabricVariant } from "../../api";
import { fabricVariantName } from "../../utils/variantNames";
import { Modal, SearchableSelect } from "../common";

export interface FabricVariantPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVariantId: number;
  fabrics: Fabric[];
  colors: Color[];
  designs: Design[];
  fabricVariants: FabricVariant[];
  modalSearch: string;
  setModalSearch: (val: string) => void;
  modalFabricId: string;
  setModalFabricId: (val: string) => void;
  modalWarpColorId: string;
  setModalWarpColorId: (val: string) => void;
  modalWeftColorId: string;
  setModalWeftColorId: (val: string) => void;
  modalDesignId: string;
  setModalDesignId: (val: string) => void;
  onSelectVariant: (variant: FabricVariant) => void;
  onApplyCustomVariant: () => void;
}

export function FabricVariantPickerModal({
  isOpen,
  onClose,
  selectedVariantId,
  fabrics,
  colors,
  designs,
  fabricVariants,
  modalSearch,
  setModalSearch,
  modalFabricId,
  setModalFabricId,
  modalWarpColorId,
  setModalWarpColorId,
  modalWeftColorId,
  setModalWeftColorId,
  modalDesignId,
  setModalDesignId,
  onSelectVariant,
  onApplyCustomVariant,
}: FabricVariantPickerModalProps) {
  const modalFabricOptions = useMemo(
    () =>
      fabrics.map((f) => ({
        id: String(f.fabricId),
        title: f.name,
      })),
    [fabrics]
  );

  const modalDesignOptions = useMemo(
    () => [
      { id: "", title: "None / Standard" },
      ...designs.map((d) => ({
        id: String(d.designId),
        title: d.name,
      })),
    ],
    [designs]
  );

  const modalColorOptions = useMemo(
    () =>
      colors.map((c) => ({
        id: String(c.colorId),
        title: c.name,
      })),
    [colors]
  );

  const filteredModalVariants = useMemo(() => {
    const q = modalSearch.trim().toLowerCase();
    const active = fabricVariants.filter((v) => v.isActive !== false);
    if (!q) return active.slice(0, 10);
    return active.filter((v) => {
      const name = fabricVariantName(v).toLowerCase();
      const dotName = name.split("-").join(" ");
      const sku = (v.sku ?? "").toLowerCase();
      return name.includes(q) || dotName.includes(q) || sku.includes(q);
    });
  }, [fabricVariants, modalSearch]);

  const recentlyUsedPills = useMemo(() => {
    const list: Array<{ label: string; variant: FabricVariant }> = [];
    fabricVariants.slice(0, 3).forEach((v) => {
      const label = fabricVariantName(v).split("-").join(" · ");
      list.push({ label, variant: v });
    });
    return list;
  }, [fabricVariants]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record fabric return"
      subtitle="Changing fabric"
      maxWidth={540}
    >
      <div>
        {/* Find existing fabric search */}
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--color-text-secondary, #334155)",
              marginBottom: "0.4rem",
            }}
          >
            Find an existing fabric
          </label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "0.85rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted, #64748b)",
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="biret geberdin"
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              autoFocus
              className="input"
              style={{ paddingLeft: "2.4rem" }}
            />
          </div>

          {/* Matching Search Results List */}
          <div
            style={{
              border: "1px solid var(--color-border-subtle, #e2e8f0)",
              borderRadius: "var(--radius-md, 8px)",
              overflow: "hidden",
              marginTop: "0.6rem",
              maxHeight: 180,
              overflowY: "auto",
            }}
          >
            {filteredModalVariants.map((v) => {
              const label = fabricVariantName(v).split("-").join(" · ");
              const isCurrent = v.fabricVariantId === selectedVariantId;
              return (
                <div
                  key={v.fabricVariantId}
                  onClick={() => onSelectVariant(v)}
                  style={{
                    padding: "0.65rem 0.85rem",
                    background: isCurrent ? "var(--color-amber-50, #fffdf0)" : "var(--color-surface, #ffffff)",
                    borderBottom: "1px solid var(--color-border-subtle, #f1f5f9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = "var(--color-surface-hover, #f8fafc)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = "var(--color-surface, #ffffff)";
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: isCurrent ? "var(--color-text, #0f172a)" : "var(--color-text-secondary, #334155)",
                    }}
                  >
                    {label}
                  </span>
                  {isCurrent && (
                    <span className="badge badge--success">
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recently used chips */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "0.85rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-muted, #64748b)" }}>
            Recently used
          </span>
          {recentlyUsedPills.map((pill, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectVariant(pill.variant)}
              className="badge"
              style={{
                cursor: "pointer",
                padding: "0.3rem 0.75rem",
                fontSize: "0.8rem",
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Divider: Not in the list? Describe it */}
        <div
          style={{
            position: "relative",
            textAlign: "center",
            margin: "1.35rem 0",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: 1,
              background: "var(--color-border-subtle, #e2e8f0)",
            }}
          />
          <span
            style={{
              position: "relative",
              background: "var(--color-surface, #ffffff)",
              padding: "0 0.75rem",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--color-text-muted, #64748b)",
            }}
          >
            Not in the list? Describe it
          </span>
        </div>

        {/* Custom 2-Column Selects */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.85rem",
            marginBottom: "0.75rem",
          }}
        >
          <div>
            <label className="form-label" style={{ marginBottom: "0.3rem" }}>
              Fabric type
            </label>
            <SearchableSelect
              options={modalFabricOptions}
              value={modalFabricId}
              onChange={(val) => setModalFabricId(val)}
              placeholder="Select fabric..."
            />
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: "0.3rem" }}>
              Design
            </label>
            <SearchableSelect
              options={modalDesignOptions}
              value={modalDesignId}
              onChange={(val) => setModalDesignId(val)}
              placeholder="Select design..."
            />
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: "0.3rem" }}>
              Warp color
            </label>
            <SearchableSelect
              options={modalColorOptions}
              value={modalWarpColorId}
              onChange={(val) => setModalWarpColorId(val)}
              placeholder="Select warp color..."
            />
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: "0.3rem" }}>
              Weft color
            </label>
            <SearchableSelect
              options={modalColorOptions}
              value={modalWeftColorId}
              onChange={(val) => setModalWeftColorId(val)}
              placeholder="Select weft color..."
            />
          </div>
        </div>

        {/* Helper text */}
        <p
          style={{
            margin: "0 0 1.5rem",
            fontSize: "0.78rem",
            color: "var(--color-text-muted, #64748b)",
            lineHeight: 1.4,
          }}
        >
          If this combination does not exist yet, a new fabric type is created when you save.
        </p>

        {/* Modal Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApplyCustomVariant}
            className="btn btn-primary"
          >
            Use this fabric
          </button>
        </div>
      </div>
    </Modal>
  );
}
