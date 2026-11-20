import React from "react";

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export function FormField({
  label,
  required = false,
  hint,
  error,
  children,
  className = "",
  htmlFor,
}: FormFieldProps) {
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={htmlFor} className="form-label">
          <span>{label}</span>
          {required && <span className="required" title="Required">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error" role="alert">{error}</span>}
    </div>
  );
}

export default FormField;
