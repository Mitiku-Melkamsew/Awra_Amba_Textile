export interface FabricSelectionCardProps {
  fabricDisplayName: string;
  fabricSpecs: { weight: number; length: number; width: number };
  weaverRate: string;
  onOpenModal: () => void;
}

export function FabricSelectionCard({
  fabricDisplayName,
  fabricSpecs,
  weaverRate,
  onOpenModal,
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

      <label className="form-label" style={{ marginBottom: "0.35rem" }}>
        Fabric
      </label>

      {/* Selected Fabric Display Box */}
      <div
        style={{
          background: "var(--color-orange-50, #fffaf5)",
          border: "1px solid var(--color-orange-200, #fed7aa)",
          borderRadius: "var(--radius-sm, 8px)",
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
              background: "var(--color-primary, #ea580c)",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-orange-900, #7c2d12)" }}>
            {fabricDisplayName}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenModal}
          className="btn btn-secondary"
          style={{
            padding: "0.35rem 0.85rem",
            fontSize: "0.85rem",
          }}
        >
          Change
        </button>
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
