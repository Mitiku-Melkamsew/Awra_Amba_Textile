import React from "react";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  pill?: boolean;
  dot?: boolean;
}

export function Badge({
  variant = "neutral",
  pill = false,
  dot = false,
  children,
  className = "",
  ...props
}: BadgeProps) {
  const baseClass = pill ? "status-pill" : "badge";
  const modifierClass = `badge--${variant}`;

  return (
    <span className={`${baseClass} ${modifierClass} ${className}`.trim()} {...props}>
      {dot && (
        <span
          className="status-indicator-dot"
          style={{
            background:
              variant === "success"
                ? "var(--green)"
                : variant === "warning"
                ? "var(--amber)"
                : variant === "danger"
                ? "var(--red)"
                : variant === "info"
                ? "var(--blue)"
                : "var(--text-muted)",
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
