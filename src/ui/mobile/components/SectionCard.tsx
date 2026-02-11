import type { ReactNode } from "react";
import "../styles/mobile.css";

export type SectionCardProps = {
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
};

export function SectionCard({ title, headerRight, children }: SectionCardProps) {
  return (
    <section className="mobile-ui mobile-section-card">
      <header className="mobile-section-card__header">
        <h3 className="mobile-section-card__title">{title}</h3>
        {headerRight}
      </header>
      <div className="mobile-section-card__body">{children}</div>
    </section>
  );
}
