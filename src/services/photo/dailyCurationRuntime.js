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

function dispatchDailyCurationUpdated(result) {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(new CustomEvent('daily-curation-updated', {
        detail: {
            dayKey: result.dayKey,
            totalCount: result.totalCount,
            fromCache: result.fromCache,
            needsRefresh: result.needsRefresh,
            stale: result.stale || false,
            nativeTimeout: result.nativeTimeout || false
        }
    }));
}

export async function hydrateThumbsForPhotos(photos, { thumbSize = 300, transport = 'base64' } = {}) {
    if (!Array.isArray(photos)) return;

    const pendingIds = photos
        .filter(photo => !photo.imageUrl && photo?.rawAsset?.curationReasons?.includes('thumb_pending'))
        .map(photo => photo.id);

    if (pendingIds.length === 0) return;

    try {
        const response = await RecocolPhotos.getLocalThumbs({
            assetIds: pendingIds,
            thumbSize,
            transport,
            limit: pendingIds.length
        });
        const thumbById = new Map((response?.thumbs || []).map(item => [item.assetId, item.thumb]));

        for (const photo of photos) {
            const thumb = thumbById.get(photo.id);
            if (!thumb) continue;
            photo.imageUrl = thumb;
            const reasons = photo.rawAsset?.curationReasons || [];
            photo.rawAsset.curationReasons = reasons.filter(flag => flag !== 'thumb_pending');
        }
    } catch (error) {
        console.error('PhotoService: thumb hydration failed', error);
    }
}

async function hydrateCurationThumbs(service, result, options = {}) {
    const photos = result.photos || [];
    await hydrateThumbsForPhotos(photos, options);

    service.photos = photos;
    dispatchDailyCurationUpdated({
        ...result,
        totalCount: photos.length,
        photos
    });
}

/**
 * 전용 상태를 변경하지 않고 순수하게 데이터만 가져오고 가공합니다. (Buffering 용)
 */
export async function fetchCurationBatch({ limit = 3, thumbSize = 420, transport = 'base64', forceRefresh = false } = {}) {
    // [안정화] 네이티브 응답이 10초 이상 지연될 경우 타임아웃 처리
    const timeoutMs = 10000;
    let timeoutId = null;

    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            const err = new Error('사진 보관함 응답이 지연되고 있습니다.');
            err.name = 'TimeoutError';
            reject(err);
        }, timeoutMs);
    });

    try {
        const daily = await Promise.race([
            RecocolPhotos.getDailyCuration({
                limit,
                thumbSize,
                transport,
                forceRefresh
            }),
            timeoutPromise
        ]).finally(() => {
            clearTimeout(timeoutId);
        });

        const dayKey = daily?.dayKey || null;
        const items = Array.isArray(daily?.items) ? daily.items : [];
        const photos = items.map(item => mapToPhotoModel(item, dayKey));

        return {
            photos,
            dayKey,
            totalCount: photos.length,
            fromCache: Boolean(daily?.fromCache),
            needsRefresh: Boolean(daily?.needsRefresh),
            stale: Boolean(daily?.stale),
            nativeTimeout: Boolean(daily?.nativeTimeout)
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
        hydrateCurationThumbs(service, result, options);
        return result;
    } catch (error) {
        console.error('PhotoService: Daily curation fetch failed', error);
        throw error;
    }
}

export async function refreshDailyCurationAfterMutation(service, options = {}) {
    const result = await fetchDailyCuration(service, { ...options, forceRefresh: true });
    dispatchDailyCurationUpdated(result);
    return result;
}
