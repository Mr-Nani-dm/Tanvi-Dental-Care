import type { AnchorHTMLAttributes } from "react";

type ButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: "primary" | "secondary" | "text";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <a className={`button button-${variant} ${className}`.trim()} {...props} />;
}
