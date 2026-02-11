import type { ComponentType } from "react";
import type { ScreenProps } from "@/ui/types";
import type { StaffRole } from "@/domain/staffRoles";
import {
  StartScreen,
  CreateCoachScreen,
  CoachBackgroundScreen,
  InterviewsScreen,
  OpeningInterviewScreen,
  OffersScreen,
  HireCoordinatorsScreen,
  StaffMeetingScreen,
} from "@/ui/screens/StartFlowScreens";
import { DelegationSetupScreen } from "@/ui/screens/DelegationSetupScreen";
import { HubScreen } from "@/ui/screens/HubScreen";
import { StaffTreeScreen } from "@/ui/screens/StaffTreeScreen";
import { HireMarketScreen } from "@/ui/screens/HireMarketScreen";
import { CandidateDetailScreen } from "@/ui/screens/CandidateDetailScreen";
import { PhoneInboxScreen, PhoneThreadScreen } from "@/ui/screens/PhoneScreens";
import { FreeAgencyScreen } from "@/ui/screens/FreeAgencyScreen";
import { RosterScreen } from "@/ui/screens/RosterScreen";

export type RouteKey =
  | "Start"
  | "CreateCoach"
  | "CoachBackground"
  | "Interviews"
  | "OpeningInterview"
  | "Offers"
  | "HireCoordinators"
  | "StaffMeeting"
  | "DelegationSetup"
  | "Hub"
  | "StaffTree"
  | "HireMarket"
  | "CandidateDetail"
  | "PhoneInbox"
  | "PhoneThread"
  | "FreeAgency"
  | "Roster";

export type Route =
  | { key: "Start" }
  | { key: "CreateCoach" }
  | { key: "CoachBackground" }
  | { key: "Interviews" }
  | { key: "OpeningInterview"; franchiseId: string }
  | { key: "Offers" }
  | { key: "HireCoordinators" }
  | { key: "StaffMeeting" }
  | { key: "DelegationSetup" }
  | { key: "Hub"; tab?: "staff" | "roster" | "contracts" | "standings" | "schedule" | "phone" }
  | { key: "StaffTree" }
  | { key: "HireMarket"; role: StaffRole }
  | { key: "CandidateDetail"; role: StaffRole; candidateId: string }
  | { key: "PhoneInbox" }
  | { key: "PhoneThread"; threadId: string }
  | { key: "FreeAgency" }
  | { key: "Roster" };

export const RouteMap: Record<RouteKey, ComponentType<ScreenProps>> = {
  Start: StartScreen,
  CreateCoach: CreateCoachScreen,
  CoachBackground: CoachBackgroundScreen,
  Interviews: InterviewsScreen,
  OpeningInterview: OpeningInterviewScreen,
  Offers: OffersScreen,
  HireCoordinators: HireCoordinatorsScreen,
  StaffMeeting: StaffMeetingScreen,
  DelegationSetup: DelegationSetupScreen,
  Hub: HubScreen,
  StaffTree: StaffTreeScreen,
  HireMarket: HireMarketScreen,
  CandidateDetail: CandidateDetailScreen,
  PhoneInbox: PhoneInboxScreen,
  PhoneThread: PhoneThreadScreen,
  FreeAgency: FreeAgencyScreen,
  Roster: RosterScreen,
};
