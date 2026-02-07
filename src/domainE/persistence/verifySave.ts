import { canonicalStringify } from "./canonicalStringify";
import { sha256Tagged } from "./hash";

export type VerifyResult = { ok: true } | { ok: false; error: string };

export type SaveLike = {
  meta?: { checksum?: string; prevChecksum?: string | null };
  events?: { log?: any[] };
  uxState?: unknown;
};

function stripForStateHash(state: any): any {
  const clone = structuredClone(state);
  if (clone?.meta) {
    delete clone.meta.checksum;
    delete clone.meta.prevChecksum;
  }
  return clone;
}

export async function computeStateChecksum(state: any): Promise<string> {
  const material = stripForStateHash(state);
  const canon = canonicalStringify(material, { excludeTopLevelKeys: ["uxState"] });
  return sha256Tagged("STATE", canon);
}

export async function computeEventHash(evt: any): Promise<string> {
  // exclude hash field from its own material; keep prevHash
  const clone = structuredClone(evt);
  delete clone.hash;
  const canon = canonicalStringify(clone);
  return sha256Tagged("EVENT", canon);
}

async function verifyEventChain(state: any): Promise<{ ok: boolean; lastHash: string | null; error?: string }> {
  const log: any[] = state?.events?.log ?? [];
  let last: string | null = null;
  for (let i = 0; i < log.length; i++) {
    const evt = log[i];
    const expectedPrev = i === 0 ? null : (log[i - 1]?.hash ?? null);
    if ((evt?.prevHash ?? null) !== expectedPrev) {
      return { ok: false, lastHash: last, error: `Event prevHash mismatch at index ${i}` };
    }
    const expectedHash = await computeEventHash(evt);
    if (evt?.hash !== expectedHash) {
      return { ok: false, lastHash: last, error: `Event hash mismatch at index ${i}` };
    }
    last = evt.hash ?? null;
  }
  return { ok: true, lastHash: last };
}

export async function verifySave(state: SaveLike): Promise<VerifyResult> {
  const chain = await verifyEventChain(state);
  if (!chain.ok) return { ok: false, error: chain.error ?? "Event chain invalid" };

  const expected = await computeStateChecksum(state);
  const actual = (state as any)?.meta?.checksum;
  if (typeof actual !== "string" || actual.length === 0) {
    return { ok: false, error: "Missing meta.checksum" };
  }
  if (expected !== actual) {
    return { ok: false, error: "State checksum mismatch" };
  }
  return { ok: true };
}

export async function verifySaveOrThrow(state: SaveLike): Promise<void> {
  const r = await verifySave(state);
  if (!r.ok) throw new Error(`Save verification failed: ${r.error}`);
}
