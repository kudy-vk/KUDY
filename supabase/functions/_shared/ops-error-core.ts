// T-K1 (issue #411) — the best-effort ops-error tag the five edge functions
// (device, events, feedback, grant, rc-webhook) write from their catch paths
// (spec 2026-11-22-telegram-ops-mvp, «Рашэнні рэалізацыі»: service-role
// INSERT, рэлізаванне трыгера збояў — task на Selfer-боку).
//
// Platform-neutral by contract: one pinned statement over an injected client
// — the retention-core idiom. The catch path's fault boundary calls
// recordOpsError with fixed literals only (endpoint, error_code, note —
// never error.message, request bodies or URLs: the logServerDiagnostic
// discipline); a failing tag write resolves to false and the function's
// answer is unchanged — the tag is best-effort by definition, the 09 §5
// answer paths never depend on it. The scheduled relay side (≥3 за 15 хв
// dedup) is the Selfer worker's concern, not this module's.

/** The tag insert; the migration (20261122000000) is the schema source. */
export const OPS_ERROR_INSERT_SQL =
  'insert into ops_error_events (endpoint, error_code, note) values ($1, $2, $3)';

/**
 * The `unsafe` statement surface the wiring gets from the pinned postgres.js
 * driver (the grant-wire idiom) — the statements are pinned constants, the
 * parameters are fixed literals, nothing client-controlled ever enters.
 */
export interface OpsErrorClient {
  unsafe(sql: string, params?: unknown[]): PromiseLike<unknown>;
}

export interface OpsErrorEvent {
  /** The function's own name (`device`, `events`, `feedback`, `grant`, `rc-webhook`). */
  endpoint: string;
  /** The failure class literal the function's diagnostics already use. */
  errorCode: string;
  /** A short fixed operation label — no arguments, no payload data. */
  note: string;
}

/**
 * The tag attempt is bounded: the pinned postgres.js client leaves
 * connect_timeout at its 30 s default, and the catch path awaits this tag
 * before answering the client — an unbounded attempt would stretch a
 * fast-fail 503 to twice the timeout when storage is down. Past the bound
 * the tag is dropped (best-effort by definition); the late insert result,
 * success or failure, is swallowed either way.
 */
export const OPS_ERROR_TAG_TIMEOUT_MS = 1500;

/**
 * One best-effort insert: opens the client inside the try (a missing
 * DATABASE_URL fails the same way as a failed insert), swallows every fault
 * and answers whether the tag landed inside the bound. The caller's response
 * is never thrown into — a storage outage on the tag path cannot turn a
 * handled failure into an unhandled one or slow it past the bound (spec
 * review focus 5). `timeoutMs` exists for the committed test's fast bound;
 * the catch-path wiring uses the default.
 */
export async function recordOpsError(
  openClient: () => OpsErrorClient,
  event: OpsErrorEvent,
  timeoutMs: number = OPS_ERROR_TAG_TIMEOUT_MS,
): Promise<boolean> {
  try {
    const attempt = Promise.resolve(
      openClient().unsafe(OPS_ERROR_INSERT_SQL, [event.endpoint, event.errorCode, event.note]),
    );
    attempt.catch(() => {}); // a loser that rejects after the bound is already answered
    let timer: ReturnType<typeof setTimeout> | undefined;
    const bound = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('ops-error tag bound exceeded')), timeoutMs);
    });
    try {
      await Promise.race([attempt, bound]);
      return true;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}
