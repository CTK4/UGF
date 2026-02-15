export const UI_ID = {
  hub: {
    root: "hub.root",
    noSave: "hub.noSave",
    staffMeetingCta: "hub.staffMeetingCta",
    quickLinkRoster: "hub.quickLink.roster",
    quickLinkStaff: "hub.quickLink.staff",
    quickLinkFreeAgency: "hub.quickLink.freeAgency",
  },
  staffMeeting: {
    root: "staffMeeting.root",
    priorities: "staffMeeting.priorities",
    priorityOption: "staffMeeting.priorityOption",
    resignTargets: "staffMeeting.resignTargets",
    shopTargets: "staffMeeting.shopTargets",
    tradeNotes: "staffMeeting.tradeNotes",
    submit: "staffMeeting.submit",
    backToHub: "staffMeeting.backToHub",
  },
  roster: {
    root: "roster.root",
    tabs: "roster.tabs",
    teamOverview: "roster.teamOverview",
    capSummary: "roster.capSummary",
    filterPosition: "roster.filter.position",
    toggleReleased: "roster.filter.showReleased",
    playerRow: "roster.playerRow",
    releaseButton: "roster.releaseButton",
    backToHub: "roster.backToHub",
  },
  staff: {
    root: "staff.root",
    tabs: "staff.tabs",
    budgetPill: "staff.budgetPill",
    roleRow: "staff.roleRow",
    hireMarketCta: "staff.hireMarketCta",
    backToHub: "staff.backToHub",
  },
  hireMarket: {
    root: "hireMarket.root",
    groupTab: "hireMarket.groupTab",
    roleTab: "hireMarket.roleTab",
    sortTab: "hireMarket.sortTab",
    candidateRow: "hireMarket.candidateRow",
    candidateView: "hireMarket.candidateView",
    backToStaff: "hireMarket.backToStaff",
  },
  candidateDetail: {
    root: "candidateDetail.root",
    hireButton: "candidateDetail.hire",
    backButton: "candidateDetail.back",
  },
  freeAgency: {
    root: "freeAgency.root",
    capSummary: "freeAgency.capSummary",
    filterPosition: "freeAgency.filter.position",
    filterMinOvr: "freeAgency.filter.minOvr",
    filterSearch: "freeAgency.filter.search",
    playerCard: "freeAgency.playerCard",
    signButton: "freeAgency.signButton",
    refreshButton: "freeAgency.refresh",
    backButton: "freeAgency.back",
  },
} as const;

export type UiId =
  | (typeof UI_ID)["hub"][keyof (typeof UI_ID)["hub"]]
  | (typeof UI_ID)["staffMeeting"][keyof (typeof UI_ID)["staffMeeting"]]
  | (typeof UI_ID)["roster"][keyof (typeof UI_ID)["roster"]]
  | (typeof UI_ID)["staff"][keyof (typeof UI_ID)["staff"]]
  | (typeof UI_ID)["hireMarket"][keyof (typeof UI_ID)["hireMarket"]]
  | (typeof UI_ID)["candidateDetail"][keyof (typeof UI_ID)["candidateDetail"]]
  | (typeof UI_ID)["freeAgency"][keyof (typeof UI_ID)["freeAgency"]];
