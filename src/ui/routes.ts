import type { ComponentType } from "react";
import type { ScreenProps } from "@/ui/types";
import { StartScreen, ChooseFranchiseScreen, CareerContextScreen } from "@/ui/screens/StartFlowScreens";
import { HubScreen } from "@/ui/screens/HubScreen";
import { StaffTreeScreen } from "@/ui/screens/StaffTreeScreen";
import { HireMarketScreen } from "@/ui/screens/HireMarketScreen";
import { CandidateDetailScreen } from "@/ui/screens/CandidateDetailScreen";
import { PhoneInboxScreen, PhoneThreadScreen } from "@/ui/screens/PhoneScreens";

export type RouteKey =
  | "Start"
  | "ChooseFranchise"
  | "CareerContext"
  | "Hub"
  | "StaffTree"
  | "HireMarket"
  | "CandidateDetail"
  | "PhoneInbox"
  | "PhoneThread";

export type Route =
  | { key: "Start" }
  | { key: "ChooseFranchise" }
  | { key: "CareerContext" }
  | { key: "Hub" }
  | { key: "StaffTree" }
  | { key: "HireMarket"; role: "hc" | "oc" | "dc" | "qb" | "asst" }
  | { key: "CandidateDetail"; role: "hc" | "oc" | "dc" | "qb" | "asst"; candidateId: string }
  | { key: "PhoneInbox" }
  | { key: "PhoneThread"; threadId: string };

export const RouteMap: Record<RouteKey, ComponentType<ScreenProps>> = {
  Start: StartScreen,
  ChooseFranchise: ChooseFranchiseScreen,
  CareerContext: CareerContextScreen,
  Hub: HubScreen,
  StaffTree: StaffTreeScreen,
  HireMarket: HireMarketScreen,
  CandidateDetail: CandidateDetailScreen,
  PhoneInbox: PhoneInboxScreen,
  PhoneThread: PhoneThreadScreen,
};
