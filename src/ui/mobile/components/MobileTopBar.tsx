import type { ReactNode } from "react";
import "../styles/mobile.css";
import { isMobileUI } from "@/ui/mobile/isMobileUI";

export type MobileTopBarProps = {
  title: string;
  rightActions?: ReactNode;
};

export function MobileTopBar({ title, rightActions }: MobileTopBarProps) {
  const showMobileIndicator = import.meta.env.DEV && isMobileUI();

  return (
    <header className="mobile-ui mobile-topbar">
      <h1 className="mobile-topbar__title">{title}</h1>
      {showMobileIndicator || rightActions ? (
        <div className="mobile-topbar__actions">
          {showMobileIndicator ? <span className="ugf-pill">Mobile UI</span> : null}
          {rightActions}
        </div>
      ) : null}
    </header>
  );
}
