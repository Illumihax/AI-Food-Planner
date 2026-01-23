import * as React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "muted" | "outline";
};

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const styles =
    variant === "muted"
      ? "bg-[--color-muted] text-[--color-foreground]"
      : variant === "outline"
      ? "border border-current text-[--color-foreground]"
      : "bg-[--color-primary] text-[--color-primary-foreground]";
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${styles} ${className}`} {...props} />;
}


