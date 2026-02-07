import type { ComponentType } from "react";
import type { ScreenProps } from "@/ui/types";
import { TeamSummaryScreen } from "@/ui/screens/TeamSummaryScreen";
import { StaffTreeScreen } from "@/ui/screens/StaffTreeScreen";

export type RouteKey = "Hub" | "TeamSummary" | "StaffTree";

export type Route =
  | { key: "Hub" }
  | { key: "TeamSummary"; teamId: string }
  | { key: "StaffTree" };

const ROUTE_MAP: Record<RouteKey, ComponentType<ScreenProps>> = {
  Hub: TeamSummaryScreen,
  TeamSummary: TeamSummaryScreen,
  StaffTree: StaffTreeScreen,
};

export const RouteMap = ROUTE_MAP;
