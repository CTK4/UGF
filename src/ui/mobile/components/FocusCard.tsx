import type { ReactNode } from "react";
import "../styles/mobile.css";

export type FocusCardProps = {
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
  opponentSlot?: ReactNode;
};

export function FocusCard({ title, headerRight, children, opponentSlot }: FocusCardProps) {
  return (
    <section className="mobile-ui mobile-focus-card">
      <header className="mobile-focus-card__header">
        <h2 className="mobile-focus-card__title">{title}</h2>
        {headerRight}
      </header>
      <div className="mobile-focus-card__body">
        {opponentSlot ? <div className="mobile-focus-card__opponent">{opponentSlot}</div> : null}
        {children}
      </div>
    </section>
  );
}
