import React from "react";
import type { ScreenProps } from "@/ui/types";

export function PlaceholderScreen({ ui }: ScreenProps) {
  const route = ui.getState().route;
  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">{route.key}</h2></div>
      <div className="ugf-card__body">This screen is now navigable and route state is updating.</div>
    </div>
  );
}
