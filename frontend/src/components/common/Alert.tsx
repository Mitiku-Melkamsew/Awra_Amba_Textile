import React from "react";

export type AlertVariant = "success" | "error" | "warning" | "info";

export interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({
  variant = "info",
  children,
  onClose,
  className = "",
}: AlertProps) {
  const icon =
    variant === "success"
      ? "✓"
      : variant === "error"
      ? "✕"
      : variant === "warning"
      ? "⚠"
      : "ℹ";

  return (
    <div
      className={`alert-banner alert-banner--${variant} ${className}`.trim()}
      role="alert"
    >
      <span style={{ fontWeight: 700 }} aria-hidden="true">{icon}</span>
      <div style={{ flex: 1 }}>{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          style={{
            background: "none",
            border: "none",
            color: "currentColor",
            opacity: 0.7,
            cursor: "pointer",
            padding: "2px 6px",
            fontSize: "14px",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default Alert;
