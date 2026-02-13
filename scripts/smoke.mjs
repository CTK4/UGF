import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = resolve(root, ".tmp", "smoke");
const outFile = resolve(outDir, "runtime.mjs");

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(String(key), String(value));
    },
    removeItem(key) {
      map.delete(String(key));
    },
    clear() {
      map.clear();
    },
  };
}

globalThis.localStorage = createMemoryStorage();
globalThis.window = { setTimeout, clearTimeout };

rmSync(outDir, { force: true, recursive: true });
mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: [resolve(root, "src/ui/runtime.ts")],
  outfile: outFile,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  logLevel: "silent",
  define: {
    "import.meta.env.DEV": "false",
    "import.meta.env.MODE": '"test"',
  },
});

const runtimeModule = await import(pathToFileURL(outFile).href);
const ui = await runtimeModule.createUIRuntime(() => {});

async function waitFor(predicate, timeoutMs = 6000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 25));
  }
  throw new Error("timed out waiting for runtime state change");
}

const initialRoute = ui.getState().route.key;
if (!initialRoute) throw new Error("start flow failed to load route");

ui.dispatch({ type: "SET_COACH_NAME", coachName: "Smoke Coach" });
ui.dispatch({ type: "SET_COACH_AGE", coachAge: 41 });
ui.dispatch({ type: "RUN_INTERVIEWS" });

const invites = ui.getState().ui.opening.interviewInvites;
if (!invites.length) throw new Error("interview invites missing");

for (const invite of invites.slice(0, 3)) {
  ui.dispatch({ type: "OPENING_START_INTERVIEW", franchiseId: invite.franchiseId });
  let guard = 0;
  while (!ui.getState().ui.opening.interviewResults[invite.franchiseId]?.completed && guard < 8) {
    ui.dispatch({ type: "OPENING_ANSWER_INTERVIEW", franchiseId: invite.franchiseId, answerIndex: 0 });
    guard += 1;
  }
}

ui.dispatch({ type: "NAVIGATE", route: { key: "Offers" } });
const offers = ui.getState().ui.opening.offers;
if (!offers.length) throw new Error("offers were not generated");

const selectedOffer = offers[0];
ui.dispatch({
  type: "ACCEPT_OFFER",
  franchiseId: selectedOffer.franchiseId,
});

await waitFor(() => Boolean(ui.getState().save));

const afterOffer = ui.getState();
if (!afterOffer.save) throw new Error("save not created after accepting offer");
if (!afterOffer.save.gameState.staff.assignments) throw new Error("staff assignments missing after save creation");

ui.dispatch({ type: "NAVIGATE", route: { key: "StaffTree" } });
if (ui.getState().route.key !== "StaffTree") throw new Error("staff tree route did not render");

const weekBefore = ui.getState().save.gameState.time.week;
ui.dispatch({ type: "CONFIRM_DELEGATION_SETUP" });
ui.dispatch({ type: "SUBMIT_STAFF_MEETING", payload: { priorities: [], resignTargets: [], shopTargets: [], tradeNotes: "" } });
ui.dispatch({ type: "ADVANCE_WEEK" });
const weekAfter = ui.getState().save.gameState.time.week;
if (!Number.isFinite(weekAfter) || weekAfter < weekBefore) throw new Error("advance week produced invalid calendar state");

console.log("Smoke test passed");
