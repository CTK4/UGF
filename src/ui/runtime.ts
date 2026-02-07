import type { Candidate, SaveData, StaffRole, UIAction, UIController, UIState } from "@/ui/types";
import { FRANCHISES, getFranchise } from "@/ui/data/franchises";

const SAVE_KEY = "ugf.save.v1";

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

function initialPhone(): SaveData["phone"] {
  return {
    threads: [
      { id: "owner", title: "Owner", unreadCount: 1, messages: [{ id: "m1", from: "Owner", text: "Welcome aboard. Hire your coordinators immediately.", ts: new Date().toISOString() }] },
      { id: "gm", title: "GM", unreadCount: 1, messages: [{ id: "m2", from: "GM", text: "I can help shortlist coordinators in the market.", ts: new Date().toISOString() }] },
      { id: "league", title: "League Office", unreadCount: 0, messages: [{ id: "m3", from: "League", text: "Preseason operations are live.", ts: new Date().toISOString() }] },
    ],
  };
}

function makeCandidate(seed: string, idx: number, role: StaffRole): Candidate {
  const first = ["Alex", "Jordan", "Taylor", "Casey", "Riley", "Avery", "Drew", "Parker"];
  const last = ["Mason", "Carter", "Bennett", "Hayes", "Foster", "Brooks", "Reed", "Cole"];
  const traits = ["Leader", "Aggressive", "Discipline", "QB Whisperer", "Adaptable", "Culture Builder"];
  const h = hash(`${seed}:${idx}:${role}`);
  return {
    id: `${role}-${idx}-${h.toString(16).slice(0, 5)}`,
    name: `${first[h % first.length]} ${last[(h >> 4) % last.length]}`,
    role,
    traits: [traits[h % traits.length], traits[(h >> 7) % traits.length], traits[(h >> 11) % traits.length]].filter((v, i, a) => a.indexOf(v) === i),
    philosophy: h % 2 === 0 ? "Build fundamentals first, then expand complexity." : "Push matchups and attack tendencies aggressively.",
    availability: h % 6 === 0 ? "INELIGIBLE" : "AVAILABLE",
  };
}

function ensureMarket(save: SaveData, role: StaffRole, refresh = false): SaveData {
  const key = `${weekKey(save)}:${role}`;
  if (!refresh && save.market.byWeek[key]) return save;
  const candidates = Array.from({ length: 7 }, (_, i) => makeCandidate(`${save.franchiseId}:${key}`, i, role));
  return { ...save, market: { byWeek: { ...save.market.byWeek, [key]: { weekKey: weekKey(save), role, candidates } } } };
}

function markThreadRead(save: SaveData, threadId: string): SaveData {
  return { ...save, phone: { threads: save.phone.threads.map((t) => t.id === threadId ? { ...t, unreadCount: 0 } : t) } };
}

function appendPhoneAfterAdvance(save: SaveData): SaveData {
  const missing = [save.staff.oc ? null : "OC", save.staff.dc ? null : "DC"].filter(Boolean);
  return {
    ...save,
    phone: {
      threads: save.phone.threads.map((t) => {
        if (t.id === "owner") {
          const text = missing.length ? `Still waiting on coordinator hires: ${missing.join(", ")}.` : "Good progress. Keep momentum.";
          return { ...t, unreadCount: t.unreadCount + 1, messages: [...t.messages, { id: `owner-${Date.now()}`, from: "Owner", text, ts: new Date().toISOString() }] };
        }
        if (t.id === "gm") {
          return { ...t, unreadCount: t.unreadCount + 1, messages: [...t.messages, { id: `gm-${Date.now()}`, from: "GM", text: "Scouting notes updated for this week.", ts: new Date().toISOString() }] };
        }
        return t;
      }),
    },
  };
}

function withCheckpoint(save: SaveData, label: string): SaveData {
  return { ...save, checkpoints: [...save.checkpoints, { ts: new Date().toISOString(), label }] };
}

export async function createUIRuntime(onChange: () => void): Promise<UIController> {
  const { save, corrupted } = loadSave();

  let state: UIState = {
    route: save ? { key: "Hub" } : { key: "Start" },
    save,
    draftFranchiseId: save?.franchiseId ?? null,
    corruptedSave: corrupted,
    ui: { activeModal: corrupted ? { title: "Save Recovery", message: "Your save appears corrupted. Reset save to continue.", actions: [{ label: "Reset Save", action: { type: "RESET_SAVE" } }] } : null, notifications: [] },
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
        case "BEGIN_CAREER": {
          const f = getFranchise(state.draftFranchiseId ?? "") ?? FRANCHISES[0];
          const fresh: SaveData = withCheckpoint({
            version: 1,
            createdAt: new Date().toISOString(),
            franchiseId: f.id,
            league: { season: 2026, week: 1, phase: "Preseason", phaseVersion: 1 },
            staff: { hc: "You", oc: null, dc: null, qb: null, asst: null },
            phone: initialPhone(),
            market: { byWeek: {} },
            checkpoints: [],
          }, "Career started");
          persist(fresh, { key: "Hub" });
          setState({ ...state, save: fresh, route: { key: "Hub" }, corruptedSave: false, ui: { ...state.ui, notifications: ["Career started."], activeModal: null } });
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
          if (!c) {
            showModal("Candidate Missing", "Could not find that candidate. Return to market.", [{ label: "Back", action: { type: "NAVIGATE", route: { key: "HireMarket", role } } }]);
            return;
          }
          if (c.availability !== "AVAILABLE") {
            showModal("Cannot Hire", `Candidate is ${c.availability.replaceAll("_", " ")}.`, [{ label: "Back", action: { type: "NAVIGATE", route: { key: "HireMarket", role } } }]);
            return;
          }
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
          let save2: SaveData = {
            ...state.save,
            staff: { ...state.save.staff, [role]: pick.name },
            market: {
              byWeek: Object.fromEntries(Object.entries(state.save.market.byWeek).map(([k, v]) => [k, { ...v, candidates: v.candidates.map((c) => c.id === pick.id ? { ...c, availability: "ALREADY_EMPLOYED" } : c) }])),
            },
          };
          save2 = withCheckpoint(save2, `Hired ${role.toUpperCase()}: ${pick.name}`);
          writeSave(save2);
          setState({ ...state, save: save2, route: { key: "StaffTree" }, ui: { activeModal: null, notifications: [`Hired ${role.toUpperCase()}: ${pick.name}`] } });
          return;
        }
        case "ADVANCE_WEEK": {
          if (!state.save) return;
          const missing = [state.save.staff.oc ? null : "OC", state.save.staff.dc ? null : "DC"].filter(Boolean);
          if (missing.length) {
            showModal("Advance Blocked", `You must hire: ${missing.join(", ")}.`, [{ label: "Go Fix", action: { type: "NAVIGATE", route: { key: "StaffTree" } } }]);
            return;
          }
          let save2: SaveData = {
            ...state.save,
            league: { ...state.save.league, week: state.save.league.week + 1, phaseVersion: state.save.league.phaseVersion + 1, phase: "RegularSeason" },
          };
          save2 = appendPhoneAfterAdvance(withCheckpoint(save2, `Advanced to week ${save2.league.week}`));
          persist(save2, { key: "Hub" });
          setState({ ...state, save: save2, route: { key: "Hub" }, ui: { activeModal: null, notifications: ["Advanced week."] } });
          return;
        }
        case "SHOW_MVP1_MODAL":
          showModal("Not in MVP1 yet", `${String(action.feature)} is planned, but not implemented in MVP1.`, [{ label: "Back to Hub", action: { type: "NAVIGATE", route: { key: "Hub" } } }]);
          return;
        case "CLOSE_MODAL":
          setState({ ...state, ui: { ...state.ui, activeModal: null } });
          return;
        case "RESET_SAVE":
          resetSave();
          setState({ route: { key: "Start" }, save: null, draftFranchiseId: null, corruptedSave: false, ui: { activeModal: null, notifications: ["Save reset."] } });
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

  // ensure market exists when visiting hire screen
  const current = state.route;
  if (state.save && current.key === "HireMarket") {
    const save2 = ensureMarket(state.save, current.role);
    if (save2 !== state.save) state.save = save2;
  }

  return controller;
}
