import RecocolPhotos from '../../plugins/RecocolPhotos.ts';

function generateDailyContextMessage(flags) {
    if (!Array.isArray(flags) || flags.length === 0) {
        return '오늘 정리하기 좋은 항목이에요.';
    }

    const messages = [];
    if (flags.includes('unorganized')) messages.push('앨범에 정리되지 않았어요');
    if (flags.includes('screenshot')) messages.push('스크린샷 항목이에요');
    if (flags.includes('old')) messages.push('오래된 사진이에요');
    if (flags.includes('burst_day')) messages.push('비슷한 사진이 많은 날이에요');
    if (flags.includes('large')) messages.push('고해상도 사진이에요');
    if (flags.includes('icloud_only')) messages.push('일부 iCloud 항목이 제외됐어요');

    return messages.length > 0
        ? `${messages.join(', ')}.`
        : '오늘 정리하기 좋은 항목이에요.';
}

export async function fetchDailyCuration(service, { limit = 6, thumbSize = 420, transport = 'base64', forceRefresh = false } = {}) {
    try {
        const daily = await RecocolPhotos.getDailyCuration({
            limit,
            thumbSize,
            transport,
            forceRefresh
        });

        const items = Array.isArray(daily?.items) ? daily.items : [];
        service.currentDayKey = daily?.dayKey || null;
        service.photos = items.map((item) => ({
            id: item.assetId,
            imageUrl: item.thumb || null,
            date: service.currentDayKey || '',
            location: '위치 정보 없음',
            contextMessage: generateDailyContextMessage(item.flags || []),
            rawAsset: {
                id: item.assetId,
                curationReasons: item.flags || []
            },
            score: item.score || 0,
            dayKey: service.currentDayKey
        }));

        return {
            photos: service.photos,
            totalCount: service.photos.length,
            dayKey: service.currentDayKey,
            fromCache: Boolean(daily?.fromCache),
            needsRefresh: Boolean(daily?.needsRefresh)
        };
    } catch (error) {
        console.error('PhotoService: Daily curation fetch failed', error);
        throw error;
    }
}

export async function refreshDailyCurationAfterMutation(service, options = {}) {
    const result = await fetchDailyCuration(service, { ...options, forceRefresh: true });
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('daily-curation-updated', {
            detail: {
                dayKey: result.dayKey,
                totalCount: result.totalCount
            }
        }));
    }
    return result;
}
