import { replayPendingCrmLeads, reportCrmConfigAtStartup } from './crm-lead-outbox';

/** How often each pod looks for due CRM leads. */
export const REPLAY_INTERVAL_MS = 60_000;

let started = false;

/**
 * Starts the in-process CRM lead replay (lib/crm-lead-outbox.ts) on this pod:
 * the production configuration check once, then replayPendingCrmLeads every
 * minute. Called once from instrumentation.ts (Node runtime only). The timer
 * is unref'd and a run never overlaps the previous one; every pod runs it and
 * the per-row claim keeps each row on one pod. Idempotent.
 *
 * The site has no worker or CronJob; the replay lives in the web process,
 * where the lead is written. No new infrastructure.
 */
export function startCrmLeadReplay(): void {
  if (started) return;
  started = true;
  reportCrmConfigAtStartup();
  let running = false;
  const timer = setInterval(() => {
    if (running) return;
    running = true;
    void replayPendingCrmLeads()
      .catch(() => undefined)
      .finally(() => {
        running = false;
      });
  }, REPLAY_INTERVAL_MS);
  timer.unref?.();
}
