import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full bg-transparent text-ink text-sm py-3 px-0 outline-none transition-colors duration-150 border-0 border-b placeholder:text-muted",
            error ? "border-danger focus:border-danger" : "border-ink/25 focus:border-ink",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 font-mono text-[10px] tracking-[0.16em] uppercase text-danger">
            / {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
