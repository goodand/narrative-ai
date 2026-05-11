/**
 * ReportController — Detox stats load and view model.
 *
 * See:
 *   - docs/refactor/headless-core-agent-instructions.md §6 Report controller
 *   - docs/refactor/slice-3c3-controller-mapping.md
 *
 * Decisions (slice-3c-3 decision log):
 *   #1 (A) — `clock.now()` injected; passed as `nowDate` into helper.
 *   #2 (A) — Controller-local request sequence counter; stale responses
 *            do not write final state.
 *   #3 (A) — `tips` is returned by helper inside `report.stats`.
 *   #4 (A) — `todayUiIdx` is returned by helper inside `report.stats`.
 *   #5 (C) — Cache-first user id resolution: read `store.auth.user.id`,
 *            fall back to `authPort.getUser()` only when cache is null.
 *
 * Cross-controller couplings:
 *   - Reads `store.auth.user` (slice-3a #1 cross-domain via store).
 *   - Calls `authPort.getUser()` only as fallback (no cross-controller call).
 *   - Never calls `statsPort.logCurationAction` (Report is read-only).
 *
 * @param {{
 *   statsPort: {
 *     getUserStats: (userId: string) => Promise<Object|null>,
 *     getDetoxLogs: (userId: string, sinceIso: string) => Promise<Array<{ cleared_at: string }>>
 *   },
 *   authPort: { getUser: () => Promise<{ user: Object|null }> },
 *   clock: { now: () => Date },
 *   store: Object,
 *   normalizeError: (error: any, context?: string) => Object
 * }} deps
 */

import { aggregateReportStats } from './aggregateReportStats.js';

const REPORT_CONTEXT = 'report';
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const DEFAULT_TIPS = '비움 분석을 위해 더 많은 사진을 정리해보세요!';

export function createReportController({
    statsPort,
    authPort,
    clock,
    store,
    normalizeError
} = {}) {
    if (!statsPort || !authPort || !clock || !store) {
        throw new Error('createReportController: statsPort, authPort, clock, store are required');
    }

    let requestSeq = 0;

    const writeReport = (patch) => {
        store.patch({ report: patch });
    };

    const writeError = (error) => {
        const normalized = normalizeError
            ? normalizeError(error, REPORT_CONTEXT)
            : { message: 'report_error', context: REPORT_CONTEXT, code: null, cause: error };
        writeReport({ status: 'error', error: normalized });
    };

    const resolveUserId = async () => {
        const cached = store.get('auth.user');
        if (cached && typeof cached.id === 'string' && cached.id.length > 0) {
            return cached.id;
        }
        try {
            const fresh = await authPort.getUser();
            return fresh?.user?.id || null;
        } catch (_) {
            return null;
        }
    };

    return {
        async load() {
            const seq = ++requestSeq;
            writeReport({ status: 'loading', error: null });

            const userId = await resolveUserId();
            if (!userId) {
                if (seq !== requestSeq) return;
                writeReport({
                    status: 'error',
                    error: {
                        message: '로그인 정보를 확인할 수 없습니다.',
                        context: REPORT_CONTEXT,
                        code: 'no_user',
                        cause: null
                    }
                });
                return;
            }

            const now = clock.now();
            const sinceIso = new Date(now.getTime() - FOURTEEN_DAYS_MS).toISOString();

            let userStats = null;
            let detoxLogs = [];
            try {
                const [statsResult, logsResult] = await Promise.all([
                    statsPort.getUserStats(userId),
                    statsPort.getDetoxLogs(userId, sinceIso)
                ]);
                userStats = statsResult;
                detoxLogs = Array.isArray(logsResult) ? logsResult : [];
            } catch (error) {
                if (seq !== requestSeq) return;
                writeError(error);
                return;
            }

            // Stale-response guard: if a newer load has started, drop this result.
            if (seq !== requestSeq) return;

            let stats;
            try {
                stats = aggregateReportStats({
                    userStats,
                    detoxLogs,
                    nowDate: now,
                    tips: DEFAULT_TIPS
                });
            } catch (error) {
                writeError(error);
                return;
            }

            if (seq !== requestSeq) return;
            writeReport({ status: 'ready', error: null, stats });
        },

        getViewModel() {
            const slice = store.get('report') || {};
            const status = typeof slice.status === 'string' ? slice.status : 'idle';
            const stats = slice.stats || null;
            const auth = store.get('auth') || {};
            const fullName = auth.user
                && auth.user.user_metadata
                && typeof auth.user.user_metadata.full_name === 'string'
                && auth.user.user_metadata.full_name.length > 0
                ? auth.user.user_metadata.full_name.split(' ')[0]
                : '사용자';

            const isLoading = status === 'loading';
            const hasError = status === 'error';
            let loadingText;
            if (isLoading) {
                loadingText = '데이터를 불러오는 중입니다.';
            } else if (hasError) {
                loadingText = '일부 리포트 데이터를 불러오지 못했습니다.';
            } else {
                loadingText = `${fullName}님의 공간이 더 가벼워지고 있어요.`;
            }

            return {
                status,
                error: slice.error || null,
                isLoading,
                profileName: fullName,
                loadingText,
                stats: stats || {
                    weeklyCount: 0,
                    weeklyChange: '0%',
                    totalBytesGB: '0.0',
                    totalCount: '0',
                    dailyData: [0, 0, 0, 0, 0, 0, 0],
                    tips: DEFAULT_TIPS,
                    todayUiIdx: -1
                },
                controls: {
                    canRetry: hasError
                }
            };
        }
    };
}
