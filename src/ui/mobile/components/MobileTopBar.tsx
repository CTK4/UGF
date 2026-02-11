import type { ReactNode } from "react";
import "../styles/mobile.css";

export type MobileTopBarProps = {
  title: string;
  rightActions?: ReactNode;
};

export function MobileTopBar({ title, rightActions }: MobileTopBarProps) {
  return (
    <header className="mobile-ui mobile-topbar">
      <h1 className="mobile-topbar__title">{title}</h1>
      {rightActions ? <div className="mobile-topbar__actions">{rightActions}</div> : null}
    </header>
  );
}
