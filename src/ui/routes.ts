import type { ComponentType } from "react";
import { RecoverRouteKey } from "@/phaseEngine";
import type { ScreenProps } from "@/ui/types";
import { TeamSummaryScreen } from "@/ui/screens/TeamSummaryScreen";
import { StaffTreeScreen } from "@/ui/screens/StaffTreeScreen";

export type RouteKey =
  | "Hub"
  | "League"
  | "TeamSummary"
  | "TeamRoster"
  | "DepthChart"
  | "DraftBoard"
  | "DraftRecap"
  | "HireMarket"
  | "CandidateDetail"
  | "Contracts"
  | "PlayerContract"
  | "MetricsDictionary"
  | "Reference"
  | "RelocationHub"
  | "OwnerDashboard"
  | "ScoutingHub"
  | "PhoneInbox"
  | "PhoneThread"
  | "TradeHub"
  | "TradeThread"
  | "SeasonHub"
  | "GameDay"
  | "StaffTree"
  | "HallOfFame"
  | "Error"
  | `Recover/${RecoverRouteKey}`;

export type Route =
  | { key: "Hub" }
  | { key: "League" }
  | { key: "TeamSummary"; teamId: string }
  | { key: "TeamRoster"; teamId: string }
  | { key: "DepthChart"; teamId: string }
  | { key: "DraftBoard" | "DraftRecap" }
  | { key: "HireMarket" }
  | { key: "CandidateDetail"; personId: string }
  | { key: "Contracts"; teamId: string }
  | { key: "PlayerContract"; personId: string }
  | { key: "MetricsDictionary" }
  | { key: "Reference" | "RelocationHub" | "OwnerDashboard" | "ScoutingHub" }
  | { key: "PhoneInbox" }
  | { key: "PhoneThread"; threadId: string }
  | { key: "TradeHub" }
  | { key: "TradeThread"; threadId: string }
  | { key: "SeasonHub" }
  | { key: "GameDay" }
  | { key: "StaffTree" }
  | { key: "HallOfFame" }
  | { key: "Error"; message: string; context?: unknown }
  | { key: `Recover/${RecoverRouteKey}` };

const UnavailableScreen: ComponentType<ScreenProps> = TeamSummaryScreen;

export const RouteMap: Record<RouteKey, ComponentType<ScreenProps>> = {
  Hub: TeamSummaryScreen,
  League: TeamSummaryScreen,
  TeamSummary: TeamSummaryScreen,
  TeamRoster: UnavailableScreen,
  DepthChart: UnavailableScreen,
  DraftBoard: UnavailableScreen,
  DraftRecap: UnavailableScreen,
  HireMarket: UnavailableScreen,
  CandidateDetail: UnavailableScreen,
  Contracts: UnavailableScreen,
  PlayerContract: UnavailableScreen,
  MetricsDictionary: UnavailableScreen,
  Reference: UnavailableScreen,
  RelocationHub: UnavailableScreen,
  OwnerDashboard: UnavailableScreen,
  ScoutingHub: UnavailableScreen,
  PhoneInbox: UnavailableScreen,
  PhoneThread: UnavailableScreen,
  TradeHub: UnavailableScreen,
  TradeThread: UnavailableScreen,
  SeasonHub: UnavailableScreen,
  GameDay: UnavailableScreen,
  StaffTree: StaffTreeScreen,
  HallOfFame: UnavailableScreen,
  Error: UnavailableScreen,
  ...Object.fromEntries(Object.values(RecoverRouteKey).map((k) => [`Recover/${k}`, UnavailableScreen])),
} as Record<RouteKey, ComponentType<ScreenProps>>;
