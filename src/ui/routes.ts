import type { ComponentType } from "react";
import type { ScreenProps } from "@/ui/types";
import type { StaffRole } from "@/domain/staffRoles";
import {
  StartScreen,
  CreateCoachScreen,
  CoachBackgroundScreen,
  CoachPersonalityScreen,
  InterviewsScreen,
  OpeningInterviewScreen,
  OffersScreen,
  HireCoordinatorsScreen,
  StaffMeetingScreen,
} from "@/ui/screens/StartFlowScreens";
import { DelegationSetupScreen } from "@/ui/screens/DelegationSetupScreen";
import { FigmaHubScreen } from "@/ui/screens/FigmaHubScreen";
import { FigmaStaffScreen } from "@/ui/screens/FigmaStaffScreen";
import { HireMarketScreen } from "@/ui/screens/HireMarketScreen";
import { CandidateDetailScreen } from "@/ui/screens/CandidateDetailScreen";
import { PhoneInboxScreen, PhoneThreadScreen } from "@/ui/screens/PhoneScreens";
import { FreeAgencyScreen } from "@/ui/screens/FreeAgencyScreen";
import { FigmaRosterScreen } from "@/ui/screens/FigmaRosterScreen";
import { isMobileUI } from "@/ui/mobile/isMobileUI";
import { MobilePhoneInboxScreen } from "@/ui/screens/MobilePhoneInboxScreen";
import { MobilePhoneThreadScreen } from "@/ui/screens/MobilePhoneThreadScreen";

function PhoneInboxRouteScreen(props: ScreenProps) {
  const Screen = isMobileUI() ? MobilePhoneInboxScreen : PhoneInboxScreen;
  return Screen(props);
}

function PhoneThreadRouteScreen(props: ScreenProps) {
  const Screen = isMobileUI() ? MobilePhoneThreadScreen : PhoneThreadScreen;
  return Screen(props);
}

export type RouteKey =
  | "Start"
  | "CreateCoach"
  | "CoachBackground"
  | "CoachPersonality"
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
  | { key: "CoachPersonality" }
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
  CoachPersonality: CoachPersonalityScreen,
  Interviews: InterviewsScreen,
  OpeningInterview: OpeningInterviewScreen,
  Offers: OffersScreen,
  HireCoordinators: HireCoordinatorsScreen,
  StaffMeeting: StaffMeetingScreen,
  DelegationSetup: DelegationSetupScreen,
  Hub: FigmaHubScreen,
  StaffTree: FigmaStaffScreen,
  HireMarket: HireMarketScreen,
  CandidateDetail: CandidateDetailScreen,
  PhoneInbox: PhoneInboxRouteScreen,
  PhoneThread: PhoneThreadRouteScreen,
  FreeAgency: FreeAgencyScreen,
  Roster: FigmaRosterScreen,
};
