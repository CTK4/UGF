import type { ButtonHTMLAttributes } from "react";
import "../styles/mobile.css";

type MobileButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

export function PrimaryActionButton({ label, className, ...props }: MobileButtonProps) {
  return (
    <button
      type="button"
      className={["mobile-ui", "mobile-button", "mobile-button--primary", className].filter(Boolean).join(" ")}
      {...props}
    >
      {label}
    </button>
  );
}

export function SecondaryActionButton({ label, className, ...props }: MobileButtonProps) {
  return (
    <button
      type="button"
      className={["mobile-ui", "mobile-button", "mobile-button--secondary", className].filter(Boolean).join(" ")}
      {...props}
    >
      {label}
    </button>
  );
}
