import { Link } from "react-router-dom";

export interface IssueZigSummarySidebarProps {
  weaverDisplayName: string;
  fabricDisplayName: string;
  totalLines: number;
  totalQuantity: number;
  totalYarnValue: number;
  validationProblems: string[];
  error: string;
  saving: boolean;
  targetUserId?: string;
}

export function IssueZigSummarySidebar({
  weaverDisplayName,
  fabricDisplayName,
  totalLines,
  totalQuantity,
  totalYarnValue,
  validationProblems,
  error,
  saving,
  targetUserId,
}: IssueZigSummarySidebarProps) {
  const hasProblems = validationProblems.length > 0;

  return (
    <div style={{ position: "sticky", top: "1.5rem" }}>
      <div
        style={{
          background: "var(--color-surface, #ffffff)",
          border: "1px solid var(--color-border-subtle, #e2e8f0)",
          borderRadius: "var(--radius-lg, 12px)",
          padding: "1.5rem",
          boxShadow: "var(--shadow-sm, 0 1px 4px rgba(0,0,0,0.04))",
        }}
      >
        <h3
          style={{
            margin: "0 0 1.25rem",
            fontSize: "1.15rem",
            fontWeight: 700,
            color: "var(--color-text, #0f172a)",
          }}
        >
          Summary
        </h3>

        {/* Summary Rows */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
            fontSize: "0.88rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--color-text-muted, #64748b)" }}>Weaver</span>
            <span style={{ fontWeight: 700, color: "var(--color-text, #0f172a)" }}>
              {weaverDisplayName}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
            <span style={{ color: "var(--color-text-muted, #64748b)" }}>Fabric</span>
            <span
              style={{
                fontWeight: 700,
                color: "var(--color-text, #0f172a)",
                textAlign: "right",
                maxWidth: 190,
                wordBreak: "break-word",
              }}
            >
              {fabricDisplayName}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--color-text-muted, #64748b)" }}>Yarn</span>
            <span style={{ fontWeight: 700, color: "var(--color-text, #0f172a)" }}>
              {totalLines === 0
                ? "0 lines · 0 pcs (No yarn)"
                : `${totalLines} line${totalLines > 1 ? "s" : ""} · ${totalQuantity} pcs`}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--color-text-muted, #64748b)" }}>Yarn value charged</span>
            <span style={{ fontWeight: 700, color: "var(--color-text, #0f172a)" }}>
              {totalYarnValue.toFixed(2)} ETB
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--color-text-muted, #64748b)" }}>Zig ID</span>
            <span style={{ fontWeight: 600, color: "var(--color-text-muted, #64748b)", fontStyle: "italic" }}>
              Assigned when issued
            </span>
          </div>
        </div>

        {/* Problem Alert Box */}
        {hasProblems && (
          <div
            style={{
              background: "var(--color-danger-subtle, #fef2f2)",
              border: "1px solid var(--color-danger-border, #fecaca)",
              borderRadius: "var(--radius-sm, 8px)",
              padding: "0.85rem 1rem",
              marginBottom: "1.25rem",
              color: "var(--color-danger-dark, #991b1b)",
              fontSize: "0.85rem",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                marginBottom: "0.35rem",
              }}
            >
              <span>⚠</span> {validationProblems.length} problem
              {validationProblems.length > 1 ? "s" : ""} to fix
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.45 }}>
              {validationProblems.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Error message from backend */}
        {error && (
          <div
            style={{
              background: "var(--color-danger-subtle, #fee2e2)",
              border: "1px solid var(--color-danger-border, #fca5a5)",
              borderRadius: "var(--radius-sm, 8px)",
              padding: "0.75rem",
              color: "var(--color-danger, #b91c1c)",
              fontSize: "0.85rem",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <button
          type="submit"
          disabled={saving || hasProblems}
          className="btn btn-primary"
          style={{
            width: "100%",
            height: 44,
            fontSize: "0.95rem",
            fontWeight: 700,
            marginBottom: "0.75rem",
          }}
        >
          {saving ? "Issuing zig…" : "Issue zig · ዝግ ስጥ"}
        </button>

        <Link
          to={`/admin/weavers/${targetUserId}`}
          className="btn btn-secondary"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: 40,
            fontSize: "0.9rem",
            textDecoration: "none",
            marginBottom: "1rem",
          }}
        >
          Cancel
        </Link>

        {/* Footnote */}
        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            lineHeight: 1.45,
            color: "var(--color-text-muted, #64748b)",
            textAlign: "center",
          }}
        >
          Issuing takes the yarn out of stock right away. The yarn value is charged to the weaver at settlement.
        </p>
      </div>
    </div>
  );
}
