import { photoService } from '../../services/PhotoService.js';
import { GeminiService } from '../../services/GeminiService.js';

const geminiService = new GeminiService();

export async function loadAndReflectImages(manager, currIdx, prevIdx, nextIdx, isFirst, isLast) {
    console.info(`[RECOCO-TRACE] Transition to index ${currIdx}. Focusing...`);

    const photos = photoService.getPhotos();
    let batchIndices = [currIdx, prevIdx, nextIdx].filter(i => i !== null);
    
    // [최적화] 첫 번째 사진 로드 시, 세 번째 사진(Index 2)까지 미리 한꺼번에 배치 분석
    // 이렇게 하면 1번의 API 호출로 상단 3장을 모두 커버할 수 있습니다.
    if (currIdx === 0 && photos.length >= 3 && !batchIndices.includes(2)) {
        batchIndices.push(2);
    }
    
    // 1. 배치 대상 사진들을 동기적으로 마킹 (개별 분석 방지)
    const batchTargets = batchIndices.filter(idx => {
        const p = photos[idx];
        return p && !p.contextMessage && !p._aiReasonFetching;
    });
    
    if (batchTargets.length >= 2) {
        batchTargets.forEach(idx => { photos[idx]._aiReasonFetching = true; });
        const targetAssets = batchTargets.map(idx => photos[idx]);
        console.info(`[RECOCO-TRACE] Batch-marked assets: ${targetAssets.map(p => p.id)}`);
        // 비동기로 배치 분석 시작 (마킹은 이미 완료)
        triggerBatchAnalysis(manager, targetAssets, true);
    }

    // 2. 현재 이미지를 먼저 보여주고 나머지를 배경으로 로드
    await loadSingleImageAndUpdate(currIdx, 'img-curr');

    const sideLoads = [];
    if (!isFirst) sideLoads.push(loadSingleImageAndUpdate(prevIdx, 'img-prev'));
    if (!isLast) sideLoads.push(loadSingleImageAndUpdate(nextIdx, 'img-next'));
    await Promise.all(sideLoads);

    const loaded = new Set([currIdx]);
    if (prevIdx !== null) loaded.add(prevIdx);
    if (nextIdx !== null) loaded.add(nextIdx);
    await prefetchRemaining(loaded);
}
/**
 * 특정 이미지들에 대해 한 번에 AI 분석을 요청하여 비교 분석 결과를 확보합니다.
 */
export async function triggerBatchAnalysis(manager, targetAssets) {
    console.info(`[RECOCO-TRACE] Triggering batch analysis for assets: ${targetAssets.map(p => p.id)}`);
    await performBatchAnalysis(targetAssets, manager);
}

/**
 * 실제로 AI 분석을 수행하고 결과를 사진 객체에 반영합니다. (인덱스 기반이 아닌 전체 배열 기반)
 */
export async function performBatchAnalysis(targetAssets, manager) {
    if (!targetAssets || targetAssets.length === 0) return;
    
    // 1. 공통 필터(Rule-base) 추출 및 헤더 반영
    // (calculateCommonFilter는 내부적으로 photos 배열과 targets 인덱스를 쓰므로 유지하되, 전체 photos를 참조함)
    const photos = photoService.getPhotos();
    const batchIndices = targetAssets.map(p => photos.indexOf(p)).filter(idx => idx !== -1);
    const commonReasons = calculateCommonFilter(batchIndices, photos);
    
    if (manager) updateCurationHeader(manager, commonReasons);

    // 2. 대상 사진들 분석 락킹 (중복 개별 호출 방지)
    targetAssets.forEach(p => { p._aiReasonFetching = true; });

    const assetIds = targetAssets.map(p => p.id);
    const registryKey = `batch:${assetIds.join('|')}`;
    const existingAnalysis = photoService.getAnalysis(registryKey);

    if (existingAnalysis) {
        console.info(`[RECOCO-TRACE] Reusing existing batch analysis for: ${assetIds}`);
        return existingAnalysis;
    }

    const analysisPromise = (async () => {
        const metaContextEl = document.getElementById('meta-context');
        const currPhotoId = manager?.photos[manager?.currentIndex]?.id;

        try {
            if (assetIds.includes(currPhotoId) && metaContextEl) {
                metaContextEl.innerText = '비교 분석 중...';
                metaContextEl.classList.add('animate-pulse');
            }

            // Path A 최적화: quality: 'analysis' (1024px) 사용
            const images = await Promise.all(assetIds.map(assetId =>
                photoService.getPhotoAsAnalysisBase64(assetId)
            ));

            const metadatas = targetAssets.map(p => p.rawAsset || {});
            
            // 3. 공통 필터 소거 (AI 컨텍스트 최적화)
            const cleanedCriteriaList = targetAssets.map(p => {
                const original = p.rawAsset?.curationReasons || [];
                return original.filter(r => !commonReasons.includes(r));
            });

            const result = await geminiService.generateBatchDeleteRecommendations({
                images,
                metadatas,
                filteringCriteriaList: cleanedCriteriaList,
                maxLength: 60
            });

            // 3. AI 결과 반영 (AssetId 기반 매칭)
            result.recommendations.forEach((rec, i) => {
                const p = targetAssets[i];
                if (p) {
                    p.contextMessage = rec.reason;
                    p._aiReasonFetching = false;
                    
                    if (p.id === currPhotoId && metaContextEl) {
                        metaContextEl.innerText = rec.reason;
                        metaContextEl.classList.remove('animate-pulse');
                    }
                }
            });
            return result;
        } catch (error) {
            console.error('[RECOCO-TRACE] Batch analysis failed:', error);
            targetAssets.forEach(p => { p._aiReasonFetching = false; });
            throw error;
        }
    })();

    photoService.registerAnalysis(registryKey, analysisPromise);
    return analysisPromise;
}

/**
 * 이미지 리스트에서 공통된 필터링 사유(Intersection)를 추출합니다.
 */
function calculateCommonFilter(indices, photos) {
    if (indices.length === 0) return [];
    
    const reasonSets = indices.map(idx => new Set(photos[idx].rawAsset?.curationReasons || []));
    const intersection = [...reasonSets[0]].filter(reason => 
        reasonSets.every(set => set.has(reason))
    );
    
    console.info(`[RECOCO-TRACE] Identified common filters: ${intersection}`);
    return intersection;
}

/**
 * 공통 사유에 기초하여 상단 헤더 문구를 업데이트합니다.
 */
function updateCurationHeader(manager, commonReasons) {
    const headerEl = document.getElementById('curation-header-desc');
    if (!headerEl) return;

    if (commonReasons.length === 0) {
        headerEl.innerText = '기기에서 찾아낸 비우기 좋은 기록들입니다.';
        return;
    }

    // 영문 flags (native plugin) + 한글 reasons (CurationEngine) 모두 지원
    const mapping = {
        // 영문 (dailyCurationRuntime / native plugin flags)
        'unorganized': '앨범에 정리되지 않은 사진들이에요.',
        'screenshot':  '스크린샷 기록들이에요.',
        'large':       '공간을 많이 차지하는 대용량 파일들이에요.',
        'old':         '1년 이상 된 오래된 사진들이에요.',
        'burst_day':   '비슷한 사진이 많은 날의 기록들이에요.',
        'icloud_only': 'iCloud에만 저장된 사진들이에요.',
        // 한글 (CurationEngine reasons)
        '앨범 미분류': '앨범에 정리되지 않은 사진들이에요.',
        '스크린샷':    '스크린샷 기록들이에요.',
        '대용량 파일': '공간을 많이 차지하는 대용량 파일들이에요.',
        '오래된 사진': '1년 이상 된 오래된 사진들이에요.',
        '즐겨찾기 됨': '특별히 아꼈던 기록들이에요.'
    };

    // 여러 공통점이 있을 경우 조합 우선, 아니면 첫 번째 매칭
    const has = (k) => commonReasons.includes(k);
    const primary = commonReasons[0];
    let message = mapping[primary] || '정리하기 좋은 기록들을 모아봤어요.';

    // 복합 조건: 오래됨 + 미분류
    if ((has('old') || has('오래된 사진')) && (has('unorganized') || has('앨범 미분류'))) {
        message = '1년 넘게 앨범에 정리되지 않은 사진들이에요.';
    }

    // 상태 업데이트 (Re-render 시 유지용)
    if (manager) manager.headerMessage = message;
    
    // 즉시 반영
    if (headerEl) headerEl.innerText = message;
    console.info(`[RECOCO-TRACE] Header updated to: ${message}`);
}


export async function prefetchRemaining(loadedSet) {
    const photos = photoService.getPhotos();
    const remaining = [];
    
    // [최적화] 슬라이딩 윈도우 프리페치 (현재 세트에서 최대 8개까지만 미리 로드)
    // 리스트가 매우 길 경우(수백 장) 전체 분석 시 메모리 및 과도한 API 호출 방지
    const MAX_PREFETCH = 8;
    let count = 0;

    for (let i = 0; i < photos.length; i++) {
        if (!loadedSet.has(i)) {
            remaining.push(i);
            count++;
            if (count >= MAX_PREFETCH) break;
        }
    }

    const BATCH = 2;
    for (let b = 0; b < remaining.length; b += BATCH) {
        const batch = remaining.slice(b, b + BATCH);
        await Promise.all(batch.map((i) => photoService.loadPhotoDetails(i)));
    }
}

export function setupCarouselSnap(manager, wrapper) {
    let scrollTimer;
    wrapper.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            const items = wrapper.querySelectorAll('.carousel-item');
            const wrapperCenter = wrapper.scrollLeft + wrapper.offsetWidth / 2;

            let closestVisualIdx = 0;
            let closestDist = Infinity;
            items.forEach((item, i) => {
                const dist = Math.abs((item.offsetLeft + item.offsetWidth / 2) - wrapperCenter);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestVisualIdx = i;
                }
            });

            if (closestVisualIdx === 1) return;

            const photos = manager.photos;
            const visibleMax = Math.min(photos.length, 3);
            if (closestVisualIdx === 0 && manager.currentIndex > 0) {
                manager.currentIndex--;
                manager.render();
            } else if (closestVisualIdx === 2 && manager.currentIndex < visibleMax - 1) {
                manager.currentIndex++;
                manager.render();
            }
        }, 120);
    }, { passive: true });
}

export async function loadSingleImageAndUpdate(index, elementId) {
    try {
        const photo = await photoService.loadPhotoDetails(index);
        const el = document.getElementById(elementId);
        if (!el) return;

        if (!photo || !photo.imageUrl) {
            el.style.backgroundImage = 'none';
            return;
        }

        el.style.backgroundImage = `url("${photo.imageUrl}")`;
        if (elementId !== 'img-curr') return;

        // 현재 이미지 전용 메타데이터 업데이트
        const locEl = document.getElementById('meta-location');
        if (locEl) locEl.innerText = photo.location || '위치 정보 없음';

        const metaContextEl = document.getElementById('meta-context');
        if (!metaContextEl) return;

        // AI 결과 처리 로직 분리
        await handleAIContextDisplay(photo, index, metaContextEl);
    } catch (error) {
        console.error(`HomeManager: Failed to load image at index ${index}:`, error);
    }
}

async function handleAIContextDisplay(photo, index, metaContextEl) {
    // 1. 이미 결과가 있는 경우
    if (photo.contextMessage) {
        metaContextEl.innerText = photo.contextMessage;
        metaContextEl.classList.remove('animate-pulse');
        return;
    }

    // 2. 현재 분석이 진행 중인 경우
    const assetId = photo.id || `idx-${index}`;
    const existingAnalysis = photoService.getAnalysis(assetId);
    
    if (existingAnalysis || photo._aiReasonFetching) {
        metaContextEl.innerText = 'AI 분석 중...';
        metaContextEl.classList.add('animate-pulse');
        
        if (existingAnalysis) {
            try {
                const result = await existingAnalysis;
                metaContextEl.innerText = result.reason;
                metaContextEl.classList.remove('animate-pulse');
                return;
            } catch (e) {
                // Fail quietly, move to individual trigger
            }
        } else {
            return;
        }
    }

    // 3. 신규 분석 시작
    photo._aiReasonFetching = true;
    metaContextEl.innerText = 'AI 분석 중...';
    metaContextEl.classList.add('animate-pulse');

    const individualPromise = (async () => {
        try {
            const base64 = await photoService.getPhotoAsAnalysisBase64(photo.id);
            const result = await geminiService.generateDeleteRecommendation({
                imageBase64: base64,
                metadata: photo.rawAsset || {},
                filteringCriteria: photo.rawAsset?.curationReasons || [],
                language: 'Korean',
                tone: 'gentle',
                maxLength: 60
            });
            metaContextEl.innerText = result.reason;
            photo.contextMessage = result.reason;
            return result;
        } catch (error) {
            console.error('[RECOCO-TRACE] Individual analysis failed:', error);
            photo.contextMessage = null;
            metaContextEl.innerText = '오늘 정리하기 좋은 항목이에요.';
            throw error;
        } finally {
            photo._aiReasonFetching = false;
            metaContextEl.classList.remove('animate-pulse');
        }
    })();

    photoService.registerAnalysis(assetId, individualPromise);
    await individualPromise;
}
