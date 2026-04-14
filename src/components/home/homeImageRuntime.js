import { photoService } from '../../services/PhotoService.js';
import { GeminiService } from '../../services/GeminiService.js';

const geminiService = new GeminiService();

export async function loadAndReflectImages(manager, currIdx, prevIdx, nextIdx, isFirst, isLast) {
    console.info(`[RECOCO-TRACE] Transition to index ${currIdx}. Focusing...`);
    
    const photos = photoService.getPhotos();
    const batchIndices = [currIdx, prevIdx, nextIdx].filter(i => i !== null);
    
    // 1. 배치 대상 사진들을 동기적으로 마킹 (개별 분석 방지)
    const batchTargets = batchIndices.filter(idx => {
        const p = photos[idx];
        return p && !p.contextMessage && !p._aiReasonFetching;
    });
    
    if (batchTargets.length >= 2) {
        batchTargets.forEach(idx => { photos[idx]._aiReasonFetching = true; });
        console.info(`[RECOCO-TRACE] Batch-marked indices: ${batchTargets}`);
        // 비동기로 배치 분석 시작 (마킹은 이미 완료)
        triggerBatchAnalysis(manager, batchTargets, true);
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
 * @param {boolean} preMarked - true면 이미 _aiReasonFetching 마킹 완료 상태
 */
async function triggerBatchAnalysis(manager, indices, preMarked = false) {
    const photos = photoService.getPhotos();
    
    let targets;
    if (preMarked) {
        targets = indices; // 이미 필터링 및 마킹 완료
    } else {
        targets = indices.filter(idx => {
            const p = photos[idx];
            return p && !p.contextMessage && !p._aiReasonFetching;
        });
        if (targets.length < 2) return;
        targets.forEach(idx => { 
            if (photos[idx]) photos[idx]._aiReasonFetching = true; 
        });
    }

    console.info(`[RECOCO-TRACE] Triggering batch analysis for indices: ${targets}`);
    
    // 1. 공통 필터(Rule-base) 추출 및 헤더 반영
    const commonReasons = calculateCommonFilter(targets, photos);
    updateCurationHeader(manager, commonReasons);

    const metaContextEl = document.getElementById('meta-context');
    const currIdx = manager.currentIndex;

    try {
        if (targets.includes(currIdx) && metaContextEl) {
            metaContextEl.innerText = '비교 분석 중...';
            metaContextEl.classList.add('animate-pulse');
        }

        const images = await Promise.all(targets.map(idx => photoService.getPhotoAsBase64(idx)));
        const metadatas = targets.map(idx => photos[idx].rawAsset || {});
        
        // 2. 공통 필터 소거 (AI 컨텍스트 최적화)
        const cleanedCriteriaList = targets.map(idx => {
            const original = photos[idx].rawAsset?.curationReasons || [];
            return original.filter(r => !commonReasons.includes(r));
        });

        const result = await geminiService.generateBatchDeleteRecommendations({
            images,
            metadatas,
            filteringCriteriaList: cleanedCriteriaList,
            maxLength: 60
        });

        // 3. AI 결과 반영 (동일한 공통 사유를 묶음에 적용)
        result.recommendations.forEach((rec, i) => {
            const idx = targets[i];
            const p = photos[idx];
            if (p) {
                // Batch API가 3개 응답을 주지만, 묶음의 비중을 높이기 위해 첫 번째(혹은 통합된) 사유를 공유
                p.contextMessage = rec.reason;
                p._aiReasonFetching = false;
                
                if (idx === manager.currentIndex && metaContextEl) {
                    metaContextEl.innerText = rec.reason;
                    metaContextEl.classList.remove('animate-pulse');
                }
            }
        });
    } catch (error) {
        console.error('[RECOCO-TRACE] Batch analysis failed:', error);
        targets.forEach(idx => { 
            if (photos[idx]) photos[idx]._aiReasonFetching = false; 
        });
    }
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
    for (let i = 0; i < photos.length; i++) {
        if (!loadedSet.has(i)) remaining.push(i);
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

            const photos = photoService.getPhotos();
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

        if (el && photo && photo.imageUrl) {
            el.style.backgroundImage = `url("${photo.imageUrl}")`;

            if (elementId === 'img-curr') {
                const locEl = document.getElementById('meta-location');
                if (locEl) locEl.innerText = photo.location || '위치 정보 없음';

                const metaContextEl = document.getElementById('meta-context');
                if (metaContextEl) {
                    // 캐시된 결과가 있으면 즉시 표시
                    if (photo.contextMessage) {
                        metaContextEl.innerText = photo.contextMessage;
                        metaContextEl.classList.remove('animate-pulse');
                        return;
                    }

                        // 배치 분석이 진행 중이거나 결과가 올 때까지 대기
                        if (photo._aiReasonFetching) {
                            metaContextEl.innerText = 'AI 분석 중...';
                            metaContextEl.classList.add('animate-pulse');
                            return;
                        }

                        photo._aiReasonFetching = true;
                        metaContextEl.innerText = 'AI 분석 중...';
                        metaContextEl.classList.add('animate-pulse');

                        console.info(`[RECOCO-TRACE] Starting individual analysis for index ${index}`);

                        try {
                            const base64 = await photoService.getPhotoAsBase64(index);
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
                            console.info(`[RECOCO-TRACE] Individual result for index ${index}: ${result.shortReason}`);
                        } catch (error) {
                            console.error('[RECOCO-TRACE] Individual analysis failed:', error);
                            photo.contextMessage = null;
                            metaContextEl.innerText = '오늘 정리하기 좋은 항목이에요.';
                        } finally {
                            photo._aiReasonFetching = false;
                            metaContextEl.classList.remove('animate-pulse');
                        }
                }
            }

        } else if (el) {
            el.style.backgroundImage = 'none';
        }
    } catch (error) {
        console.error(`HomeManager: Failed to load image at index ${index}:`, error);
    }
}
