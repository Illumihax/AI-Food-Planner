import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full border rounded px-3 py-2 bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary] ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";


