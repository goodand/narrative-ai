/**
 * StatsPort adapter — Supabase stats reads + StatsService write.
 *
 * See: packages/core/src/contracts/ports.js — StatsPort
 *
 * Note: `getUserStats` and `getDetoxLogs` do NOT exist on `StatsService`.
 * They are direct Supabase queries that currently live inside
 * `ReportManager.loadStats`. The adapter centralizes them so the future
 * Report controller can consume them via the port without touching
 * Supabase directly.
 *
 * Cross-service note: `mutationRuntime.deletePhoto` already calls
 * `StatsService.logDetox` after a successful native delete. Controllers
 * built on top of PhotoPort.deletePhoto MUST NOT also call
 * `statsPort.logCurationAction` for the same deletion (double-log risk).
 *
 * @param {{
 *   supabase: { from: Function },
 *   statsService: { logDetox: (payload: Object) => Promise<void> }
 * }} deps
 */
export function createStatsPort({ supabase, statsService } = {}) {
    return {
        async getUserStats(userId) {
            const { data, error } = await supabase
                .from('user_stats')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();
            if (error) {
                console.warn('[STATS] user_stats query failed:', error);
                return null;
            }
            return data ?? null;
        },
        async getDetoxLogs(userId, sinceIso) {
            const { data, error } = await supabase
                .from('detox_logs')
                .select('cleared_at')
                .eq('user_id', userId)
                .gte('cleared_at', sinceIso);
            if (error) {
                console.warn('[STATS] detox_logs query failed:', error);
                return [];
            }
            return Array.isArray(data) ? data : [];
        },
        async logCurationAction(payload) {
            await statsService.logDetox(payload);
        }
    };
}
