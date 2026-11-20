import React from "react";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  actions,
  children,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`page-header ${className}`.trim()}>
      <div className="page-header-info">
        {eyebrow && <div className="page-header-eyebrow">{eyebrow}</div>}
        <h1 className="page-header-title">{title}</h1>
        {children}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

export default PageHeader;
