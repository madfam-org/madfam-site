/**
 * Next.js start-up hook (once per server process, before requests).
 *
 * Starts the CRM lead replay (lib/crm-lead-replay.ts): the production check
 * that logs a missing CRM variable once, and the every-minute re-send of
 * stored leads PhyndCRM has not accepted yet. Node runtime only: the edge
 * runtime (middleware) has no database client. The positive `if` form is the
 * one Next.js strips from the edge bundle, so the Node-only modules (crypto,
 * Prisma) are never compiled for edge.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startCrmLeadReplay } = await import('./lib/crm-lead-replay');
    startCrmLeadReplay();
  }
}
