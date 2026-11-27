import React from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      icon,
      fullWidth = false,
      children,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const variantClass = `btn-${variant}`;
    const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";
    const widthClass = fullWidth ? "btn-full-width" : "";

    return (
      <button
        ref={ref}
        className={`btn ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <span className="spinner spinner-sm" aria-hidden="true" />}
        {!isLoading && icon && <span className="btn-addon" aria-hidden="true">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
