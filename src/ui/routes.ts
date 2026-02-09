import type { ComponentType } from "react";
import type { ScreenProps } from "@/ui/types";
import type { StaffRole } from "@/domain/staffRoles";
import {
  StartScreen,
  CreateCoachScreen,
  CoachBackgroundScreen,
  InterviewInvitationsScreen,
  OpeningInterviewScreen,
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
  | "CreateCoach"
  | "CoachBackground"
  | "InterviewInvitations"
  | "OpeningInterview"
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
  | { key: "CreateCoach" }
  | { key: "CoachBackground" }
  | { key: "InterviewInvitations" }
  | { key: "OpeningInterview" }
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
  CreateCoach: CreateCoachScreen,
  CoachBackground: CoachBackgroundScreen,
  InterviewInvitations: InterviewInvitationsScreen,
  OpeningInterview: OpeningInterviewScreen,
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
