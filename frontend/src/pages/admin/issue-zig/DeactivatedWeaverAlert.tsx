import { Link } from "react-router-dom";

export interface DeactivatedWeaverAlertProps {
  targetUserId?: string;
  weaverDisplayName: string;
}

export function DeactivatedWeaverAlert({
  targetUserId,
  weaverDisplayName,
}: DeactivatedWeaverAlertProps) {
  return (
    <div className="page" style={{ maxWidth: 800, margin: "2rem auto", padding: "1.5rem" }}>
      <Link
        to={`/admin/weavers/${targetUserId}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          textDecoration: "none",
          color: "var(--color-primary, #c2410c)",
          fontSize: "0.88rem",
          fontWeight: 600,
          marginBottom: "1rem",
        }}
      >
        <span>‹</span> Back to {weaverDisplayName}
      </Link>
      <div
        style={{
          padding: "1.5rem",
          borderRadius: "var(--radius-md, 10px)",
          background: "var(--color-danger-subtle, #fff1f2)",
          border: "1px solid var(--color-danger-border, #fecdd3)",
          color: "var(--color-danger-dark, #9f1239)",
        }}
      >
        <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>🚫</span> Cannot Issue Zig to Deactivated Weaver
        </h2>
        <p style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", lineHeight: 1.5, color: "var(--color-danger-dark, #881337)" }}>
          <strong>{weaverDisplayName}</strong> (User ID: #{targetUserId}) is currently marked as deactivated in the system.
          Work orders and yarn cannot be issued to inactive weavers.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link to={`/admin/weavers/${targetUserId}`} className="btn btn-secondary" style={{ textDecoration: "none" }}>
            View Weaver History
          </Link>
          <Link to="/admin/users" className="btn btn-primary" style={{ textDecoration: "none" }}>
            Go to User Accounts to Reactivate
          </Link>
        </div>
      </div>
    </div>
  );
}
