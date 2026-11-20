import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div className={`card ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }: CardProps) {
  return (
    <div className={`card-header ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`card-title ${className}`.trim()} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`card-description ${className}`.trim()} {...props}>
      {children}
    </p>
  );
}

export function CardBody({ children, className = "", ...props }: CardProps) {
  return (
    <div className={`card-body ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", ...props }: CardProps) {
  return (
    <div className={`card-footer ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
