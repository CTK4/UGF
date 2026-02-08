import personnelData from "@/data/generated/personnel.json";
import type { Candidate, SaveData, StaffRole, UIAction, UIController, UIState } from "@/ui/types";
import { FRANCHISES, getFranchise } from "@/ui/data/franchises";

const SAVE_KEY = "ugf.save.v1";

type PersonnelRow = {
  ID: number;
  DisplayName: string;
  Position: string;
  Scheme?: string;
  Traits?: string;
};

const personnel = personnelData as PersonnelRow[];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

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
    return { save: parsed, corrupted: false };
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

function playbookFromScheme(scheme = "Balanced"): string {
  return scheme.includes("(") ? scheme.slice(0, scheme.indexOf("(")).trim() : scheme;
}

function installDifficulty(scheme = "Balanced"): string {
  const lower = scheme.toLowerCase();
  if (lower.includes("air") || lower.includes("pressure") || lower.includes("rpo")) return "High";
  if (lower.includes("spread") || lower.includes("nickel") || lower.includes("west coast")) return "Medium";
  return "Low";
}

function toCandidate(row: PersonnelRow, role: StaffRole): Candidate {
  const traits = String(row.Traits ?? "").split("|").map((x) => x.trim()).filter(Boolean).slice(0, 3);
  const scheme = row.Scheme ?? "Balanced";
  return {
    id: `${role}-${String(row.ID)}`,
    name: row.DisplayName,
    role,
    traits,
    philosophy: `${scheme} • Playbook: ${playbookFromScheme(scheme)} • Install: ${installDifficulty(scheme)}`,
    availability: "AVAILABLE",
  };
}

function candidatePoolForRole(role: StaffRole): Candidate[] {
  const position = role === "st" ? "ST Coordinator" : role.toUpperCase();
  return personnel
    .filter((row) => row.Position === position)
    .slice(0, 8)
    .map((row) => toCandidate(row, role));
}

function ensureMarket(save: SaveData, role: StaffRole, refresh = false): SaveData {
  const key = `${weekKey(save)}:${role}`;
  if (!refresh && save.market.byWeek[key]) return save;
  const candidates = candidatePoolForRole(role);
  return { ...save, market: { byWeek: { ...save.market.byWeek, [key]: { weekKey: weekKey(save), role, candidates } } } };
}

function markThreadRead(save: SaveData, threadId: string): SaveData {
  return { ...save, phone: { threads: save.phone.threads.map((t) => t.id === threadId ? { ...t, unreadCount: 0 } : t) } };
}

function withCheckpoint(save: SaveData, label: string): SaveData {
  return { ...save, checkpoints: [...save.checkpoints, { ts: new Date().toISOString(), label }] };
}

function openingState(): UIState["ui"]["opening"] {
  return { coachName: "", background: "Former QB", interviewNotes: [], offers: [], coordinatorChoices: {} };
}

export async function createUIRuntime(onChange: () => void): Promise<UIController> {
  const { save, corrupted } = loadSave();

  let state: UIState = {
    route: save ? { key: "Hub" } : { key: "Start" },
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
    writeSave(saveData);
    setState({ ...state, save: saveData, route });
  };

  const showModal = (title: string, message: string, actions?: Array<{ label: string; action: UIAction }>) => {
    setState({ ...state, ui: { ...state.ui, activeModal: { title, message, actions } } });
  };

  const withError = (fn: () => void) => {
    try { fn(); } catch (err) {
      showModal("Action Failed", err instanceof Error ? err.message : String(err), [
        { label: "Return to Hub", action: { type: "NAVIGATE", route: { key: "Hub" } } },
        { label: "Reset Save", action: { type: "RESET_SAVE" } },
      ]);
    }
  };

  const controller: UIController = {
    getState: () => state,
    dispatch: (action: UIAction) => withError(() => {
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
          setState({ ...state, ui: { ...state.ui, opening: { ...state.ui.opening, background: String(action.background ?? "") } } });
          return;
        case "RUN_INTERVIEWS": {
          const seed = hash(`${state.draftFranchiseId}:${state.ui.opening.coachName}`);
          const notes = [
            `Owner panel feedback: ${seed % 2 === 0 ? "Strong leadership" : "Bold vision"}`,
            `GM feedback: ${seed % 3 === 0 ? "Roster fit is excellent" : "Needs veteran coordinators"}`,
            `Media day: ${seed % 5 === 0 ? "Confident, measured" : "Energetic and direct"}`,
          ];
          const offers = [state.draftFranchiseId ?? FRANCHISES[0].id, FRANCHISES[(seed + 5) % FRANCHISES.length].id, FRANCHISES[(seed + 11) % FRANCHISES.length].id];
          setState({ ...state, ui: { ...state.ui, opening: { ...state.ui.opening, interviewNotes: notes, offers: Array.from(new Set(offers)) } }, route: { key: "Offers" } });
          return;
        }
        case "ACCEPT_OFFER":
          setState({ ...state, draftFranchiseId: String(action.franchiseId), route: { key: "HireCoordinators" } });
          return;
        case "SELECT_OPENING_COORDINATOR": {
          const role = action.role as "oc" | "dc" | "st";
          setState({ ...state, ui: { ...state.ui, opening: { ...state.ui.opening, coordinatorChoices: { ...state.ui.opening.coordinatorChoices, [role]: String(action.candidateName) } } } });
          return;
        }
        case "FINALIZE_NEW_SAVE": {
          const f = getFranchise(state.draftFranchiseId ?? "") ?? FRANCHISES[0];
          const fresh: SaveData = withCheckpoint({
            version: 1,
            createdAt: new Date().toISOString(),
            franchiseId: f.id,
            league: { season: 2026, week: 1, phase: "Preseason", phaseVersion: 1 },
            staff: {
              hc: state.ui.opening.coachName || "You",
              oc: state.ui.opening.coordinatorChoices.oc ?? null,
              dc: state.ui.opening.coordinatorChoices.dc ?? null,
              st: state.ui.opening.coordinatorChoices.st ?? null,
              qb: null,
              asst: null,
            },
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
          }, "Career started");
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
          showModal("Confirm Hire", "Hiring locks decision for this week.", [{ label: "Confirm", action: { type: "CONFIRM_HIRE", role, candidateId } }, { label: "Cancel", action: { type: "CLOSE_MODAL" } }]);
          return;
        }
        case "CONFIRM_HIRE": {
          if (!state.save) return;
          const role = action.role as StaffRole;
          const candidateId = String(action.candidateId);
          const key = `${weekKey(state.save)}:${role}`;
          const session = state.save.market.byWeek[key];
          const pick = session?.candidates.find((x) => x.id === candidateId);
          if (!pick) return;
          let save2: SaveData = { ...state.save, staff: { ...state.save.staff, [role]: pick.name } };
          save2 = withCheckpoint(save2, `Hired ${role.toUpperCase()}: ${pick.name}`);
          writeSave(save2);
          setState({ ...state, save: save2, route: { key: "StaffTree" }, ui: { ...state.ui, activeModal: null, notifications: [`Hired ${role.toUpperCase()}: ${pick.name}`] } });
          return;
        }
        case "ADVANCE_WEEK": {
          if (!state.save) return;
          const missing = [state.save.staff.oc ? null : "OC", state.save.staff.dc ? null : "DC", state.save.staff.st ? null : "ST"].filter(Boolean);
          if (missing.length) {
            showModal("Advance Blocked", `You must hire: ${missing.join(", ")}.`, [{ label: "Go Fix", action: { type: "NAVIGATE", route: { key: "StaffTree" } } }]);
            return;
          }
          const save2: SaveData = withCheckpoint({
            ...state.save,
            league: { ...state.save.league, week: state.save.league.week + 1, phaseVersion: state.save.league.phaseVersion + 1, phase: "RegularSeason" },
          }, `Advanced to week ${state.save.league.week + 1}`);
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
