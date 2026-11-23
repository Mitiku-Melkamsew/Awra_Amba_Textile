import { Link } from "react-router-dom";
import type { WorkOrderDetail } from "../../api";
import { formatDateDDMMYY } from "../../utils/formatDate";

export interface ZigHeaderProps {
  order: WorkOrderDetail;
  backLink: string;
  weaverDisplayName: string;
  statusNorm: string;
  currentStepIndex: number;
  message: string;
  error: string;
}

const STEPS = [
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In progress" },
  { key: "returned", label: "Returned" },
  { key: "reconciled", label: "Reconciled" },
];

export function ZigHeader({
  order,
  backLink,
  weaverDisplayName,
  statusNorm,
  currentStepIndex,
  message,
  error,
}: ZigHeaderProps) {
  function getBadgeClass(status: string) {
    switch (status) {
      case "in_progress":
        return "badge--brand";
      case "returned":
        return "badge--warning";
      case "reconciled":
        return "badge--success";
      case "cancelled":
        return "badge--danger";
      default:
        return "badge--neutral";
    }
  }

  return (
    <>
      {/* BACK LINK */}
      <div style={{ marginBottom: "1rem" }}>
        <Link
          to={backLink}
          style={{
            color: "var(--color-primary, #c2410c)",
            fontSize: "0.92rem",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          ‹ {weaverDisplayName}
        </Link>
      </div>

      {/* ZIG TOP HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--color-text, #0f172a)",
                letterSpacing: "-0.02em",
              }}
            >
              {order.zigId}
            </h1>
            <span
              className={`badge ${getBadgeClass(statusNorm)}`}
              style={{
                padding: "0.25rem 0.8rem",
                fontSize: "0.82rem",
                textTransform: "capitalize",
              }}
            >
              {order.status.replace("_", " ")}
            </span>
          </div>
          <p
            style={{
              margin: "0.35rem 0 0 0",
              fontSize: "0.85rem",
              color: "var(--color-text-muted, #64748b)",
            }}
          >
            Issued {formatDateDDMMYY(order.dateIssued ?? new Date())} by admin
          </p>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          style={{
            background: "var(--color-success-subtle, #dcfce7)",
            border: "1px solid var(--color-success-border, #86efac)",
            borderRadius: "var(--radius-sm, 8px)",
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            color: "var(--color-success, #15803d)",
            fontSize: "0.88rem",
            fontWeight: 500,
          }}
        >
          ✓ {message}
        </div>
      )}
      {error && (
        <div
          style={{
            background: "var(--color-danger-subtle, #fee2e2)",
            border: "1px solid var(--color-danger-border, #fca5a5)",
            borderRadius: "var(--radius-sm, 8px)",
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            color: "var(--color-danger, #b91c1c)",
            fontSize: "0.88rem",
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* HORIZONTAL STATUS STEPPER / LIFECYCLE */}
      <div
        style={{
          background: "var(--color-surface, #ffffff)",
          border: "1px solid var(--color-border-subtle, #e2e8f0)",
          borderRadius: "var(--radius-lg, 14px)",
          padding: "1.25rem 2rem",
          marginBottom: "1.5rem",
          boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))",
        }}
      >
        {statusNorm === "cancelled" ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              color: "var(--color-danger, #b91c1c)",
              fontWeight: 700,
              fontSize: "0.95rem",
            }}
          >
            <span>🚫</span>
            <span>This zig was cancelled. Production halted.</span>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {STEPS.map((step, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flex: idx < STEPS.length - 1 ? 1 : "none",
                  }}
                >
                  {/* Step Item */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "default",
                    }}
                  >
                    {isDone ? (
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "var(--color-success, #16a34a)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                    ) : isCurrent ? (
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "var(--color-primary, #c2410c)",
                          display: "inline-block",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          border: "2px solid var(--color-border-subtle, #cbd5e1)",
                          background: "var(--color-surface, #ffffff)",
                          display: "inline-block",
                        }}
                      />
                    )}

                    <span
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: isCurrent ? 700 : isDone ? 600 : 500,
                        color: isCurrent
                          ? "var(--color-text, #0f172a)"
                          : isDone
                          ? "var(--color-text-secondary, #334155)"
                          : "var(--color-text-muted, #94a3b8)",
                        borderBottom: isCurrent ? "2px solid var(--color-primary, #c2410c)" : "none",
                        paddingBottom: isCurrent ? "2px" : 0,
                      }}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connecting Line */}
                  {idx < STEPS.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        background: idx < currentStepIndex ? "var(--color-success, #16a34a)" : "var(--color-border-subtle, #e2e8f0)",
                        margin: "0 1.25rem",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
