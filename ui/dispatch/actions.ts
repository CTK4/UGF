import type { Route } from "@/ui/routes";
import type { UIAction } from "@/ui/types";

export const actions = {
  appBoot: (): UIAction => ({ type: "APP_BOOT" }),
  loadBundleAssets: (): UIAction => ({ type: "LOAD_BUNDLE_ASSETS" }),
  navigate: (route: Route): UIAction => ({ type: "NAVIGATE", route }),
  back: (): UIAction => ({ type: "BACK" }),
  openDraftBoard: (): UIAction => ({ type: "OPEN_DRAFT_BOARD" }),
  openProspect: (personId: string): UIAction => ({ type: "OPEN_PROSPECT", personId }),
  makePick: (pickId: string, personId: string): UIAction => ({ type: "MAKE_PICK", pickId, personId }),
  openTeamSummary: (teamId: string): UIAction => ({ type: "OPEN_TEAM_SUMMARY", teamId }),
  openTeamRoster: (teamId: string): UIAction => ({ type: "OPEN_TEAM_ROSTER", teamId }),
  openDepthChart: (teamId: string): UIAction => ({ type: "OPEN_DEPTH_CHART", teamId }),
  openHireMarket: (role: string): UIAction => ({ type: "OPEN_HIRE_MARKET", role }),
  openCandidate: (personId: string): UIAction => ({ type: "OPEN_CANDIDATE", personId }),
  hireCandidate: (personId: string, role: string): UIAction => ({ type: "HIRE_CANDIDATE", personId, role }),
  openContracts: (teamId: string): UIAction => ({ type: "OPEN_CONTRACTS", teamId }),
  openPlayerContract: (personId: string): UIAction => ({ type: "OPEN_PLAYER_CONTRACT", personId }),
  openMetricsDictionary: (): UIAction => ({ type: "OPEN_METRICS_DICTIONARY" }),
  openReference: (): UIAction => ({ type: "OPEN_REFERENCE" }),
  openPhoneInbox: (): UIAction => ({ type: "OPEN_PHONE_INBOX" }),
  openPhoneThread: (threadId: string): UIAction => ({ type: "OPEN_PHONE_THREAD", threadId }),
  resetSave: (): UIAction => ({ type: "RESET_SAVE" }),
};


export type ResetBundleCacheAction = { type: "RESET_BUNDLE_CACHE" };
