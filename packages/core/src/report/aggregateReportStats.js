/**
 * aggregateReportStats — pure aggregation helper for Report.
 *
 * See:
 *   - docs/refactor/headless-core-agent-instructions.md §6 Report controller
 *   - docs/refactor/slice-3c3-controller-mapping.md §2
 *
 * Source extraction:
 *   - DEFAULT_STATS shape:        ReportManager.js:8-15
 *   - User totals formatting:     ReportManager.js:65-70
 *   - Monday-start grouping:      ReportManager.js:101-123
 *   - Weekly count + change:      ReportManager.js:125-138
 *   - Daily graph (7 elements):   ReportManager.js:141-150
 *   - Today UI index:             ReportManager.js:156-159
 *
 * Decision 1A (slice-3c-3): receives `nowDate: Date` parameter; never calls
 * `new Date()` with no args. Controller injects time via `clock.now()`.
 * Decision 3A: returns `tips` field in result.
 * Decision 4A: returns `todayUiIdx` in result.
 *
 * Constraints:
 *   - Pure function (no DOM, store, ports, console, mutation, no implicit clock).
 *
 * @param {{
 *   userStats: { total_cleared_bytes?: number|string|null, total_cleared_count?: number|string|null } | null,
 *   detoxLogs: Array<{ cleared_at: string }>,
 *   nowDate: Date,
 *   tips?: string
 * }} input
 * @returns {{
 *   weeklyCount: number,
 *   weeklyChange: string,
 *   totalBytesGB: string,
 *   totalCount: string,
 *   dailyData: number[],
 *   tips: string,
 *   todayUiIdx: number
 * }}
 */

const DEFAULT_TIPS = '비움 분석을 위해 더 많은 사진을 정리해보세요!';
const BYTES_IN_GB = 1024 * 1024 * 1024;

const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
};

const computeTodayUiIdx = (now) => {
    const day = now.getDay();
    return day === 0 ? 6 : day - 1;
};

const safeNumber = (value) => {
    const n = Number(value || 0);
    return Number.isFinite(n) ? n : 0;
};

const formatGB = (bytes) => (bytes / BYTES_IN_GB).toFixed(1);

const formatCount = (count) => Number(count).toLocaleString();

const parseLogDate = (entry) => {
    if (!entry || typeof entry.cleared_at !== 'string') return null;
    const parsed = new Date(entry.cleared_at);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
};

const computeWeeklyChange = (currentCount, prevCount) => {
    if (prevCount === 0) {
        return currentCount > 0 ? '+100%' : '0%';
    }
    const changePercent = Math.round(((currentCount - prevCount) / prevCount) * 100);
    return `${changePercent >= 0 ? '+' : ''}${changePercent}%`;
};

export function aggregateReportStats({
    userStats = null,
    detoxLogs = [],
    nowDate,
    tips
} = {}) {
    const now = nowDate instanceof Date ? new Date(nowDate.getTime()) : new Date(0);
    const tipsValue = typeof tips === 'string' && tips.length > 0 ? tips : DEFAULT_TIPS;

    const dailyData = [0, 0, 0, 0, 0, 0, 0];

    // Totals from user_stats row.
    const clearedBytes = safeNumber(userStats && userStats.total_cleared_bytes);
    const clearedCount = safeNumber(userStats && userStats.total_cleared_count);
    const totalBytesGB = formatGB(clearedBytes);
    const totalCount = formatCount(clearedCount);

    // Weekly grouping with Monday-start.
    const thisMonday = getMonday(now);
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(lastMonday.getDate() - 7);

    const safeLogs = Array.isArray(detoxLogs) ? detoxLogs : [];
    let currentWeekCount = 0;
    let previousWeekCount = 0;

    for (const entry of safeLogs) {
        const logDate = parseLogDate(entry);
        if (!logDate) continue;
        if (logDate >= thisMonday) {
            currentWeekCount += 1;
            const day = logDate.getDay();
            const idx = day === 0 ? 6 : day - 1;
            dailyData[idx] += 1;
        } else if (logDate >= lastMonday && logDate < thisMonday) {
            previousWeekCount += 1;
        }
        // logs older than lastMonday are ignored (still inside the 14-day
        // controller-side query range, but not used for current/previous
        // week counts).
    }

    return {
        weeklyCount: currentWeekCount,
        weeklyChange: computeWeeklyChange(currentWeekCount, previousWeekCount),
        totalBytesGB,
        totalCount,
        dailyData,
        tips: tipsValue,
        todayUiIdx: computeTodayUiIdx(now)
    };
}
