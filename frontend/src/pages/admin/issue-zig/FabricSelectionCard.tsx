import type { FabricVariant } from "../../../api";
import { SearchableVariantSelect } from "../transactions/components/SearchableVariantSelect";

export interface FabricSelectionCardProps {
  selectedVariantId: string;
  fabricVariants: FabricVariant[];
  fabricSpecs: { weight: number; length: number; width: number };
  weaverRate: string;
  onSelectVariant: (variantId: string) => void;
  onOpenAddNew: (query?: string) => void;
}

export function FabricSelectionCard({
  selectedVariantId,
  fabricVariants,
  fabricSpecs,
  weaverRate,
  onSelectVariant,
  onOpenAddNew,
}: FabricSelectionCardProps) {
  return (
    <div
      style={{
        background: "var(--color-surface, #ffffff)",
        border: "1px solid var(--color-border-subtle, #e2e8f0)",
        borderRadius: "var(--radius-lg, 12px)",
        padding: "1.5rem",
        boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.03))",
      }}
    >
      <h2
        style={{
          margin: "0 0 1rem",
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "var(--color-text, #0f172a)",
        }}
      >
        Fabric · ጨርቅ
      </h2>

      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.35rem",
          }}
        >
          <label className="form-label" style={{ marginBottom: 0 }}>
            Fabric
          </label>
          <button
            type="button"
            onClick={() => onOpenAddNew()}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary, #c2410c)",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
            }}
          >
            + Add new fabric
          </button>
        </div>

        <SearchableVariantSelect
          isFabric={true}
          canAddNew={true}
          isSale={false}
          selectedVariantId={selectedVariantId}
          fabricVariants={fabricVariants}
          yarnVariants={[]}
          onSelect={onSelectVariant}
          onAddNew={onOpenAddNew}
        />
      </div>

      {/* Reference Sub-Box */}
      <div
        style={{
          background: "var(--color-surface-subtle, #f8fafc)",
          border: "1px solid var(--color-border-subtle, #e2e8f0)",
          borderRadius: "var(--radius-sm, 8px)",
          padding: "0.85rem 1rem",
          fontSize: "0.85rem",
          color: "var(--color-text-secondary, #475569)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontWeight: 600,
            color: "var(--color-text, #334155)",
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
  );
}
