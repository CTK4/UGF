import type { SaveData, UIAction, UIController, UIState } from "@/ui/types";
import type { StaffRole } from "@/domain/staffRoles";
import { FRANCHISES, getFranchise } from "@/ui/data/franchises";
import { MANDATORY_ADVANCE_ROLES } from "@/domain/staffRoles";
import { buildMarketForRole, canAfford, ensureFinancials } from "@/services/staffMarket";

const SAVE_KEY = "ugf.save.v1";

function validateSave(v: unknown): v is SaveData {
  if (!v || typeof v !== "object") return false;
  const save = v as SaveData;
  return save.version === 1 && !!save.franchiseId && !!save.league && !!save.staff && !!save.phone && !!save.market;
}

function loadSave(): { save: SaveData | null; corrupted: boolean } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { save: null, corrupted: false };
    const parsed = JSON.parse(raw);
    if (!validateSave(parsed)) return { save: null, corrupted: true };
    return { save: ensureFinancials(parsed), corrupted: false };
  } catch {
    return { save: null, corrupted: true };
  }
}

function writeSave(save: SaveData) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function resetSave() {
  localStorage.removeItem(SAVE_KEY);
}

function weekKey(save: SaveData): string {
  return `${save.league.season}-${save.league.week}`;
}

function ensureMarket(save: SaveData, role: StaffRole, refresh = false): SaveData {
  const key = `${weekKey(save)}:${role}`;
  if (!refresh && save.market.byWeek[key]) return save;
  const session = buildMarketForRole(save, role);
  return { ...save, market: { byWeek: { ...save.market.byWeek, [key]: session } } };
}

function markThreadRead(save: SaveData, threadId: string): SaveData {
  return { ...save, phone: { threads: save.phone.threads.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t)) } };
}

function withCheckpoint(save: SaveData, label: string): SaveData {
  return { ...save, checkpoints: [...save.checkpoints, { ts: new Date().toISOString(), label }] };
}

function openingState(): UIState["ui"]["opening"] {
  return { coachName: "", background: "Former QB", interviewNotes: [], offers: [], coordinatorChoices: {} };
}

function initialRouteForSave(save: SaveData | null): UIState["route"] {
  if (!save) return { key: "Start" };
  return save.onboardingComplete ? { key: "Hub" } : { key: "StaffMeeting" };
}

export async function createUIRuntime(onChange: () => void): Promise<UIController> {
  const { save, corrupted } = loadSave();

  let state: UIState = {
    route: initialRouteForSave(save),
    save,
    draftFranchiseId: save?.franchiseId ?? null,
    corruptedSave: corrupted,
    ui: {
      activeModal: corrupted ? { title: "Save Recovery", message: "Your save appears corrupted. Reset save to continue.", actions: [{ label: "Reset Save", action: { type: "RESET_SAVE" } }] } : null,
      notifications: [],
      opening: openingState(),
    },
  };

  const setState = (next: UIState) => {
    state = next;
    onChange();
  };

  const persist = (saveData: SaveData, route = state.route) => {
    const normalized = ensureFinancials(saveData);
    writeSave(normalized);
    setState({ ...state, save: normalized, route });
  };

  const showModal = (title: string, message: string, actions?: Array<{ label: string; action: UIAction }>) => {
    setState({ ...state, ui: { ...state.ui, activeModal: { title, message, actions } } });
  };

  const withError = (fn: () => void) => {
    try {
      fn();
    } catch (err) {
      showModal("Action Failed", err instanceof Error ? err.message : String(err), [
        { label: "Return to Hub", action: { type: "NAVIGATE", route: { key: "Hub" } } },
        { label: "Reset Save", action: { type: "RESET_SAVE" } },
      ]);
    }
  };

  const controller: UIController = {
    getState: () => state,
    dispatch: (action: UIAction) =>
      withError(() => {
        switch (action.type) {
          case "NAVIGATE": {
            const route = action.route as UIState["route"];
            if (route.key === "PhoneThread" && state.save) {
              const save2 = markThreadRead(state.save, route.threadId);
              persist(save2, route);
              return;
            }
            if (route.key === "HireMarket" && state.save) {
              const save2 = ensureMarket(state.save, route.role);
              persist(save2, route);
              return;
            }
            setState({ ...state, route, ui: { ...state.ui, activeModal: null } });
            return;
          }
          case "SET_DRAFT_FRANCHISE":
            setState({ ...state, draftFranchiseId: String(action.franchiseId) });
            return;
          case "SET_COACH_NAME":
            setState({ ...state, ui: { ...state.ui, opening: { ...state.ui.opening, coachName: String(action.coachName ?? "") } } });
            return;
          case "SET_BACKGROUND":
            setState({ ...state, ui: { ...state.ui, opening: { ...state.ui.opening, background: String(action.background ?? "Former QB") } } });
            return;
          case "RUN_INTERVIEWS": {
            const notes = ["Owner values discipline.", "GM prioritizes trenches.", "Need coordinator stability."];
            setState({ ...state, ui: { ...state.ui, opening: { ...state.ui.opening, interviewNotes: notes, offers: [state.draftFranchiseId ?? FRANCHISES[0].id] } }, route: { key: "Offers" } });
            return;
          }
          case "ACCEPT_OFFER":
            setState({ ...state, draftFranchiseId: String(action.franchiseId ?? state.draftFranchiseId ?? FRANCHISES[0].id), route: { key: "HireCoordinators" } });
            return;
          case "SET_COACH_FIELD":
            setState({ ...state, ui: { ...state.ui, opening: { ...state.ui.opening, [String(action.field)]: String(action.value) } } });
            return;
          case "SET_COORDINATOR_CHOICE": {
            const role = String(action.role) as "OC" | "DC" | "STC";
            setState({ ...state, ui: { ...state.ui, opening: { ...state.ui.opening, coordinatorChoices: { ...state.ui.opening.coordinatorChoices, [role]: String(action.candidateName) } } } });
            return;
          }
          case "FINALIZE_NEW_SAVE": {
            const f = getFranchise(state.draftFranchiseId ?? "") ?? FRANCHISES[0];
            const fresh: SaveData = withCheckpoint(
              {
                version: 1,
                createdAt: new Date().toISOString(),
                franchiseId: f.id,
                league: { season: 2026, week: 1, phase: "Preseason", phaseVersion: 1 },
                staff: {
                  HC: state.ui.opening.coachName || "You",
                  OC: state.ui.opening.coordinatorChoices.OC ?? null,
                  DC: state.ui.opening.coordinatorChoices.DC ?? null,
                  STC: state.ui.opening.coordinatorChoices.STC ?? null,
                  QB: null,
                  RB: null,
                  WR: null,
                  OL: null,
                  DL: null,
                  LB: null,
                  DB: null,
                  ASST: null,
                },
                staffAssignments: {} as SaveData["staffAssignments"],
                finances: { coachBudgetTotal: 0, coachBudgetUsed: 0 },
                standards: { ownerStandard: "Balanced", disciplineStandard: "Balanced", schemeStandard: "Balanced" },
                pendingOwnerRisks: [],
                coachProfile: { name: state.ui.opening.coachName || "You", background: state.ui.opening.background },
                onboardingComplete: false,
                phone: {
                  threads: [
                    { id: "owner", title: "Owner", unreadCount: 1, messages: [{ id: "m1", from: "Owner", text: "Mandatory January staff meeting is waiting for you.", ts: new Date().toISOString() }] },
                    { id: "gm", title: "GM", unreadCount: 1, messages: [{ id: "m2", from: "GM", text: "Coordinator contracts processed.", ts: new Date().toISOString() }] },
                  ],
                },
                market: { byWeek: {} },
                checkpoints: [],
              },
              "Career started",
            );
            persist(fresh, { key: "StaffMeeting" });
            return;
          }
          case "COMPLETE_STAFF_MEETING": {
            if (!state.save) return;
            const save2 = withCheckpoint({ ...state.save, onboardingComplete: true }, "January 2026 mandatory staff meeting complete");
            persist(save2, { key: "Hub" });
            setState({ ...state, save: save2, route: { key: "Hub" }, ui: { ...state.ui, notifications: ["January hub unlocked."], activeModal: null } });
            return;
          }
          case "REFRESH_MARKET": {
            if (!state.save) return;
            const role = action.role as StaffRole;
            const save2 = ensureMarket(state.save, role, true);
            persist(save2, { key: "HireMarket", role });
            return;
          }
          case "TRY_HIRE": {
            if (!state.save) return;
            const role = action.role as StaffRole;
            const candidateId = String(action.candidateId);
            const session = state.save.market.byWeek[`${weekKey(state.save)}:${role}`];
            const c = session?.candidates.find((x) => x.id === candidateId);
            if (!c) return;
            showModal("Confirm Hire", "Hiring locks decision this week.", [{ label: "Confirm", action: { type: "CONFIRM_HIRE", role, candidateId } }, { label: "Cancel", action: { type: "CLOSE_MODAL" } }]);
            return;
          }
          case "CONFIRM_HIRE": {
            if (!state.save) return;
            const role = action.role as StaffRole;
            const candidateId = String(action.candidateId);
            const offerSalary = Number(action.offerSalary ?? 0);
            const key = `${weekKey(state.save)}:${role}`;
            const session = state.save.market.byWeek[key];
            const pick = session?.candidates.find((x) => x.id === candidateId);
            if (!pick) return;

            const salary = offerSalary > 0 ? offerSalary : pick.recommendedOffer;
            if (salary < pick.salaryDemand * 0.9) {
              showModal("Offer Rejected", `${pick.name} refused. Offer must be at least 90% of demand.`, [{ label: "Back", action: { type: "CLOSE_MODAL" } }]);
              return;
            }
            const budget = canAfford(state.save, salary);
            if (!budget.ok) {
              showModal("Budget Exceeded", `Budget exceeded by $${budget.exceededBy.toLocaleString()}. Offer less or cancel.`, [
                { label: "Offer 90%", action: { type: "CONFIRM_HIRE", role, candidateId, offerSalary: Math.round(pick.salaryDemand * 0.9) } },
                { label: "Cancel", action: { type: "CLOSE_MODAL" } },
              ]);
              return;
            }

            const replaced = state.save.staff[role];
            const buyout = replaced ? Math.round((state.save.staffAssignments[role]?.salary ?? 0) * 0.25) : 0;
            const totalCost = salary + buyout;
            const budget2 = canAfford(state.save, totalCost);
            if (!budget2.ok) {
              showModal("Budget Exceeded", `Budget exceeded by $${budget2.exceededBy.toLocaleString()} with buyout included.`, [{ label: "Cancel", action: { type: "CLOSE_MODAL" } }]);
              return;
            }

            const nextAssignments = {
              ...state.save.staffAssignments,
              [role]: { coachId: pick.id, coachName: pick.name, salary, contractYears: pick.contractYears, hiredWeek: state.save.league.week },
            };
            const note = pick.meetsStandards ? [] : [...state.save.pendingOwnerRisks, `${pick.name} (${role}) flagged as risky hire.`];
            let save2: SaveData = {
              ...state.save,
              staff: { ...state.save.staff, [role]: pick.name },
              staffAssignments: nextAssignments,
              pendingOwnerRisks: note,
              finances: { ...state.save.finances, coachBudgetUsed: state.save.finances.coachBudgetUsed + totalCost },
            };
            save2 = withCheckpoint(save2, `Hired ${role}: ${pick.name}`);
            persist(save2, { key: "StaffTree" });
            setState({ ...state, save: save2, route: { key: "StaffTree" }, ui: { ...state.ui, activeModal: null, notifications: [`Hired ${role}: ${pick.name}`] } });
            return;
          }
          case "ADVANCE_WEEK": {
            if (!state.save) return;
            const missing = MANDATORY_ADVANCE_ROLES.filter((role) => !state.save.staff[role]);
            if (missing.length) {
              showModal("Advance Blocked", `You must hire: ${missing.join(", ")}.`, [{ label: "Go Fix", action: { type: "NAVIGATE", route: { key: "StaffTree" } } }]);
              return;
            }
            const nextWeek = state.save.league.week + 1;
            const timestamp = new Date().toISOString();
            const ownerRiskMessage = state.save.pendingOwnerRisks.length ? `Owner concern: ${state.save.pendingOwnerRisks[0]}` : `Week ${nextWeek} update: review priorities and inbox actions.`;
            const updatedThreads = state.save.phone.threads.map((thread) => {
              const message = {
                id: `${thread.id}-wk-${nextWeek}`,
                from: thread.title,
                text: thread.id === "owner" ? ownerRiskMessage : `Week ${nextWeek} update: review priorities and inbox actions.`,
                ts: timestamp,
              };
              return {
                ...thread,
                unreadCount: thread.unreadCount + 1,
                messages: [...thread.messages, message],
              };
            });

            const save2: SaveData = withCheckpoint(
              {
                ...state.save,
                league: { ...state.save.league, week: nextWeek, phaseVersion: state.save.league.phaseVersion + 1, phase: "RegularSeason" },
                phone: { threads: updatedThreads },
                pendingOwnerRisks: [],
              },
              `Advanced to week ${nextWeek}`,
            );
            persist(save2, { key: "Hub" });
            return;
          }
          case "CLOSE_MODAL":
            setState({ ...state, ui: { ...state.ui, activeModal: null } });
            return;
          case "RESET_SAVE":
            resetSave();
            setState({ route: { key: "Start" }, save: null, draftFranchiseId: null, corruptedSave: false, ui: { activeModal: null, notifications: ["Save reset."], opening: openingState() } });
            return;
          default:
            return;
        }
      }),
    selectors: {
      routeLabel: () => {
        const r = state.route;
        if (r.key === "HireMarket") return `HireMarket/${r.role}`;
        if (r.key === "CandidateDetail") return `CandidateDetail/${r.role}/${r.candidateId}`;
        if (r.key === "PhoneThread") return `PhoneThread/${r.threadId}`;
        return r.key;
      },
    },
  };

  return controller;
}
