import type { ComponentType } from "react";
import type { ScreenProps } from "@/ui/types";
import type { StaffRole } from "@/domain/staffRoles";
import {
  StartScreen,
  ChooseFranchiseScreen,
  CareerContextScreen,
  CreateCoachScreen,
  CoachBackgroundScreen,
  InterviewsScreen,
  OffersScreen,
  HireCoordinatorsScreen,
  StaffMeetingScreen,
} from "@/ui/screens/StartFlowScreens";
import { HubScreen } from "@/ui/screens/HubScreen";
import { StaffTreeScreen } from "@/ui/screens/StaffTreeScreen";
import { HireMarketScreen } from "@/ui/screens/HireMarketScreen";
import { CandidateDetailScreen } from "@/ui/screens/CandidateDetailScreen";
import { PhoneInboxScreen, PhoneThreadScreen } from "@/ui/screens/PhoneScreens";

export type RouteKey =
  | "Start"
  | "ChooseFranchise"
  | "CareerContext"
  | "CreateCoach"
  | "CoachBackground"
  | "Interviews"
  | "Offers"
  | "HireCoordinators"
  | "StaffMeeting"
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
  | { key: "CreateCoach" }
  | { key: "CoachBackground" }
  | { key: "Interviews" }
  | { key: "Offers" }
  | { key: "HireCoordinators" }
  | { key: "StaffMeeting" }
  | { key: "Hub"; tab?: "staff" | "roster" | "contracts" | "standings" | "schedule" | "phone" }
  | { key: "StaffTree" }
  | { key: "HireMarket"; role: StaffRole }
  | { key: "CandidateDetail"; role: StaffRole; candidateId: string }
  | { key: "PhoneInbox" }
  | { key: "PhoneThread"; threadId: string };

export const RouteMap: Record<RouteKey, ComponentType<ScreenProps>> = {
  Start: StartScreen,
  ChooseFranchise: ChooseFranchiseScreen,
  CareerContext: CareerContextScreen,
  CreateCoach: CreateCoachScreen,
  CoachBackground: CoachBackgroundScreen,
  Interviews: InterviewsScreen,
  Offers: OffersScreen,
  HireCoordinators: HireCoordinatorsScreen,
  StaffMeeting: StaffMeetingScreen,
  Hub: HubScreen,
  StaffTree: StaffTreeScreen,
  HireMarket: HireMarketScreen,
  CandidateDetail: CandidateDetailScreen,
  PhoneInbox: PhoneInboxScreen,
  PhoneThread: PhoneThreadScreen,
};
