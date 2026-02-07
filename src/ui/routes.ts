import type { ComponentType } from "react";
import type { ScreenProps } from "@/ui/types";
import { TeamSummaryScreen } from "@/ui/screens/TeamSummaryScreen";
import { StaffTreeScreen } from "@/ui/screens/StaffTreeScreen";

export type RouteKey = "TeamSummary" | "StaffTree";

export type Route =
  | { key: "TeamSummary"; teamId: string }
  | { key: "StaffTree" };

export const RouteMap: Record<RouteKey, ComponentType<ScreenProps>> = {
  TeamSummary: TeamSummaryScreen,
  StaffTree: StaffTreeScreen,
};
