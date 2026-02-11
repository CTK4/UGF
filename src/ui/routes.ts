import type { ScreenProps } from "@/ui/types";
import { CandidateDetailScreen } from "@/ui/screens/CandidateDetailScreen";
import { DelegationSetupScreen } from "@/ui/screens/DelegationSetupScreen";
import { FreeAgencyScreen } from "@/ui/screens/FreeAgencyScreen";
import { HireMarketScreen } from "@/ui/screens/HireMarketScreen";
import { MobileHubScreen } from "@/ui/screens/MobileHubScreen";
import { PhoneInboxScreen, PhoneThreadScreen } from "@/ui/screens/PhoneScreens";
import { PlaceholderScreen } from "@/ui/screens/PlaceholderScreen";
import { RosterScreen } from "@/ui/screens/RosterScreen";
import {
  CoachBackgroundScreen,
  CreateCoachScreen,
  HireCoordinatorsScreen,
  InterviewsScreen,
  OffersScreen,
  OpeningInterviewScreen,
  StaffMeetingScreen,
  StartScreen,
} from "@/ui/screens/StartFlowScreens";
import { StaffTreeScreen } from "@/ui/screens/StaffTreeScreen";
import { TeamSummaryScreen } from "@/ui/screens/TeamSummaryScreen";

export type RouteKey =
  | "Start"
  | "CreateCoach"
  | "CoachBackground"
  | "Interviews"
  | "OpeningInterview"
  | "Offers"
  | "HireCoordinators"
  | "DelegationSetup"
  | "StaffMeeting"
  | "Hub"
  | "Roster"
  | "FreeAgency"
  | "StaffTree"
  | "HireMarket"
  | "CandidateDetail"
  | "PhoneInbox"
  | "PhoneThread"
  | "League"
  | "TeamSummary"
  | "TeamRoster"
  | "Contracts"
  | "DepthChart"
  | "DraftBoard"
  | "PlayerContract"
  | "MetricsDictionary"
  | "Reference"
  | "TradeThread"
  | "TradeHub";

export type Route = {
  key: RouteKey;
  tab?: string;
  role?: string;
  franchiseId?: string;
  threadId?: string;
  candidateId?: string;
  personId?: string;
  teamId?: string;
};

type ScreenComponent = (props: ScreenProps) => JSX.Element | null;

export const RouteMap: Record<RouteKey, ScreenComponent> = {
  Start: StartScreen,
  CreateCoach: CreateCoachScreen,
  CoachBackground: CoachBackgroundScreen,
  Interviews: InterviewsScreen,
  OpeningInterview: OpeningInterviewScreen,
  Offers: OffersScreen,
  HireCoordinators: HireCoordinatorsScreen,
  DelegationSetup: DelegationSetupScreen,
  StaffMeeting: StaffMeetingScreen,
  Hub: MobileHubScreen,
  Roster: RosterScreen,
  FreeAgency: FreeAgencyScreen,
  StaffTree: StaffTreeScreen,
  HireMarket: HireMarketScreen,
  CandidateDetail: CandidateDetailScreen,
  PhoneInbox: PhoneInboxScreen,
  PhoneThread: PhoneThreadScreen,
  League: PlaceholderScreen,
  TeamSummary: TeamSummaryScreen,
  TeamRoster: PlaceholderScreen,
  Contracts: PlaceholderScreen,
  DepthChart: PlaceholderScreen,
  DraftBoard: PlaceholderScreen,
  PlayerContract: PlaceholderScreen,
  MetricsDictionary: PlaceholderScreen,
  Reference: PlaceholderScreen,
  TradeThread: PlaceholderScreen,
  TradeHub: PlaceholderScreen,
};
