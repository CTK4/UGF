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
import { RecoverRouteKey } from "@/phaseEngine";
import type { ScreenProps } from "@/ui/types";
import type { StaffRole } from "@/services/staff";
import { HubScreen } from "@/ui/screens/HubScreen";
import { DraftBoardScreen } from "@/ui/screens/DraftBoardScreen";
import { DraftRecapScreen } from "@/ui/screens/DraftRecapScreen";
import { CandidateDetailScreen } from "@/ui/screens/CandidateDetailScreen";
import { TeamSummaryScreen } from "@/ui/screens/TeamSummaryScreen";
import { TeamRosterScreen } from "@/ui/screens/TeamRosterScreen";
import { DepthChartScreen } from "@/ui/screens/DepthChartScreen";
import { HireMarketScreen } from "@/ui/screens/HireMarketScreen";
import { ContractsScreen } from "@/ui/screens/ContractsScreen";
import { PlayerContractScreen } from "@/ui/screens/PlayerContractScreen";
import { MetricsDictionaryScreen } from "@/ui/screens/MetricsDictionaryScreen";
import { ReferenceScreen } from "@/ui/screens/ReferenceScreen";
import { RelocationHubScreen } from "@/ui/screens/RelocationHubScreen";
import { OwnerDashboardScreen } from "@/ui/screens/OwnerDashboardScreen";
import { ScoutingHubScreen } from "@/ui/screens/ScoutingHubScreen";
import { SeasonHubScreen } from "@/ui/screens/SeasonHubScreen";
import { GameDayScreen } from "@/ui/screens/GameDayScreen";
import { PhoneInboxScreen } from "@/ui/screens/PhoneInboxScreen";
import { PhoneThreadScreen } from "@/ui/screens/PhoneThreadScreen";
import { TradeHubScreen } from "@/ui/screens/TradeHubScreen";
import { TradeThreadScreen } from "@/ui/screens/TradeThreadScreen";
import { HallOfFameScreen } from "@/ui/screens/HallOfFameScreen";
import { StaffTreeScreen } from "@/ui/screens/StaffTreeScreen";
import { ErrorScreen } from "@/ui/screens/ErrorScreen";
import { RecoverPlaceholderScreen } from "@/ui/screens/RecoverPlaceholderScreen";

export type RouteKey =
  | "Hub"
  | "League"
  | "TeamSummary"
  | "TeamRoster" | "DepthChart"
  | "DraftBoard" | "DraftRecap"
  | "HireMarket"
  | "CandidateDetail"
  | "Contracts"
  | "PlayerContract"
  | "MetricsDictionary"
  | "Reference" | "RelocationHub" | "OwnerDashboard" | "ScoutingHub"
  | "PhoneInbox"
  | "PhoneThread"
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
  | { key: "HireMarket"; role: StaffRole }
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
  | { key: "Error"; message: string; context?: unknown }
  | { key: `Recover/${RecoverRouteKey}` };

export const RouteMap: Record<RouteKey, ComponentType<ScreenProps>> = {
  Hub: HubScreen,
  League: HubScreen,
  TeamSummary: TeamSummaryScreen,
  TeamRoster: TeamRosterScreen,
  DraftBoard: DraftBoardScreen,
  HireMarket: HireMarketScreen,
  CandidateDetail: CandidateDetailScreen,
  Contracts: ContractsScreen,
  PlayerContract: PlayerContractScreen,
  MetricsDictionary: MetricsDictionaryScreen,
  Reference: ReferenceScreen,
  PhoneInbox: PhoneInboxScreen,
  PhoneThread: PhoneThreadScreen,
  TradeHub: TradeHubScreen,
  TradeThread: TradeThreadScreen,
  SeasonHub: SeasonHubScreen,
  GameDay: GameDayScreen,
  StaffTree: StaffTreeScreen,
  HallOfFame: HallOfFameScreen,
  Error: ErrorScreen,
  ...Object.fromEntries(Object.values(RecoverRouteKey).map((k) => [`Recover/${k}`, RecoverPlaceholderScreen])),
} as Record<RouteKey, ComponentType<ScreenProps>>;
