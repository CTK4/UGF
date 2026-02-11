import type { ButtonHTMLAttributes, ReactNode } from "react";
import "../styles/mobile.css";

export type ListRowProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> & {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  rightAdornment?: ReactNode;
};

export function ListRow({
  icon,
  title,
  subtitle,
  rightAdornment,
  className,
  ...props
}: ListRowProps) {
  return (
    <button
      type="button"
      className={["mobile-ui", "mobile-list-row", className].filter(Boolean).join(" ")}
      {...props}
    >
      <span className="mobile-list-row__icon" aria-hidden>
        {icon ?? "📌"}
      </span>
      <span className="mobile-list-row__content">
        <span className="mobile-list-row__title">{title}</span>
        {subtitle ? <span className="mobile-list-row__subtitle">{subtitle}</span> : null}
      </span>
      <span className="mobile-list-row__chevron" aria-hidden>
        {rightAdornment ?? "›"}
      </span>
    </button>
  );
}
