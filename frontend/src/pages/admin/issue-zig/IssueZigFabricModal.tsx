import { useMemo } from "react";
import type { Color, Design, Fabric, FabricVariant } from "../../../api";
import { fabricVariantName } from "../../../utils/variantNames";
import { Modal, SearchableSelect } from "../../../components/common";

export interface IssueZigFabricModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  fabrics: Fabric[];
  colors: Color[];
  designs: Design[];
  fabricVariants: FabricVariant[];
  onSelectVariant: (variant: FabricVariant) => void;
  onApplyModalFabric: () => void;
}

export function IssueZigFabricModal({
  isOpen,
  onClose,
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
  fabrics,
  colors,
  designs,
  fabricVariants,
  onSelectVariant,
  onApplyModalFabric,
}: IssueZigFabricModalProps) {
  const modalFabricOptions = useMemo(() => {
    return fabrics.map((f) => ({
      id: String(f.fabricId),
      title: f.name,
    }));
  }, [fabrics]);

  const modalDesignOptions = useMemo(() => {
    return [
      { id: "", title: "None / Standard" },
      ...designs.map((d) => ({
        id: String(d.designId),
        title: d.name,
      })),
    ];
  }, [designs]);

  const modalColorOptions = useMemo(() => {
    return colors.map((c) => ({
      id: String(c.colorId),
      title: c.name,
    }));
  }, [colors]);

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
      title="Select fabric / ጨርቅ ምረጡ"
      subtitle="Changing fabric"
      maxWidth={540}
    >
      <div>
        {/* Find existing fabric Search */}
        <div style={{ marginBottom: "1rem" }}>
          <label className="form-label" style={{ marginBottom: "0.4rem" }}>
            Find an existing fabric
          </label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted, #94a3b8)",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              placeholder="e.g. biret geberdin"
              className="input"
              style={{
                height: 42,
                paddingLeft: "2.25rem",
              }}
            />
          </div>
        </div>

        {/* Search Results List */}
        <div
          style={{
            border: "1px solid var(--color-border-subtle, #e2e8f0)",
            borderRadius: "var(--radius-sm, 8px)",
            overflow: "hidden",
            marginBottom: "1rem",
            maxHeight: 180,
            overflowY: "auto",
          }}
        >
          {filteredModalVariants.length === 0 ? (
            <div style={{ padding: "0.85rem", fontSize: "0.85rem", color: "var(--color-text-muted, #94a3b8)", textAlign: "center" }}>
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
                  onClick={() => onSelectVariant(v)}
                  style={{
                    padding: "0.75rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--color-border-subtle, #f1f5f9)",
                    background: isCurrent ? "var(--color-orange-50, #fffaf5)" : "var(--color-surface, #ffffff)",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = "var(--color-surface-hover, #f8fafc)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = "var(--color-surface, #ffffff)";
                  }}
                >
                  <span style={{ fontSize: "0.92rem", fontWeight: isCurrent ? 700 : 500, color: "var(--color-text, #1e293b)" }}>
                    {title}
                  </span>
                  {isCurrent && (
                    <span className="badge badge-success" style={{ fontSize: "11px", padding: "0.15rem 0.55rem" }}>
                      Current
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Recently Used Pills */}
        {recentlyUsedPills.length > 0 && (
          <div style={{ marginBottom: "1.25rem" }}>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--color-text-muted, #64748b)",
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
                  onClick={() => onSelectVariant(p.variant)}
                  className="badge"
                  style={{
                    cursor: "pointer",
                    padding: "0.25rem 0.65rem",
                    fontSize: "0.8rem",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Divider: Not in the list? Describe it */}
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
              background: "var(--color-border-subtle, #e2e8f0)",
            }}
          />
          <span
            style={{
              position: "relative",
              background: "var(--color-surface, #ffffff)",
              padding: "0 0.75rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--color-text-muted, #64748b)",
            }}
          >
            Not in the list? Describe it
          </span>
        </div>

        {/* 2x2 Grid of Dropdowns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.85rem",
            marginBottom: "0.75rem",
          }}
        >
          <div>
            <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
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
            <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
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
            <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
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
            <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
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
            style={{ padding: "0.55rem 1.25rem", fontSize: "0.9rem" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApplyModalFabric}
            className="btn btn-primary"
            style={{ padding: "0.55rem 1.35rem", fontSize: "0.9rem" }}
          >
            Use this fabric
          </button>
        </div>
      </div>
    </Modal>
  );
}
