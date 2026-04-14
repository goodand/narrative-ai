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

/**
 * 네이티브 아이템을 앱에서 사용하는 사진 모델로 변환합니다.
 */
function mapToPhotoModel(item, dayKey) {
    return {
        id: item.assetId,
        imageUrl: item.thumb || null,
        date: dayKey || '',
        location: '위치 정보 없음',
        contextMessage: null,
        rawAsset: {
            id: item.assetId,
            curationReasons: item.flags || []
        },
        score: item.score || 0,
        dayKey: dayKey
    };
}

/**
 * 전용 상태를 변경하지 않고 순수하게 데이터만 가져오고 가공합니다. (Buffering 용)
 */
export async function fetchCurationBatch({ limit = 3, thumbSize = 420, transport = 'base64', forceRefresh = false } = {}) {
    try {
        const daily = await RecocolPhotos.getDailyCuration({
            limit,
            thumbSize,
            transport,
            forceRefresh
        });

        const dayKey = daily?.dayKey || null;
        const items = Array.isArray(daily?.items) ? daily.items : [];
        const photos = items.map(item => mapToPhotoModel(item, dayKey));

        return {
            photos,
            dayKey,
            totalCount: photos.length,
            fromCache: Boolean(daily?.fromCache)
        };
    } catch (error) {
        console.error('PhotoService: fetchCurationBatch failed', error);
        throw error;
    }
}

export async function fetchDailyCuration(service, options = {}) {
    try {
        const result = await fetchCurationBatch(options);
        service.currentDayKey = result.dayKey;
        service.photos = result.photos;
        return result;
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
