import { photoService } from '../../services/PhotoService.js';
import { GeminiService } from '../../services/GeminiService.js';

const geminiService = new GeminiService();

export async function loadAndReflectImages(manager, currIdx, prevIdx, nextIdx, isFirst, isLast) {
    console.info(`[RECOCO-TRACE] Transition to index ${currIdx}. Focusing...`);
    
    // 로딩 우선순위: 현재 이미지를 먼저 보여주고 나머지를 배경으로 로드
    await loadSingleImageAndUpdate(currIdx, 'img-curr');

    const sideLoads = [];
    if (!isFirst) sideLoads.push(loadSingleImageAndUpdate(prevIdx, 'img-prev'));
    if (!isLast) sideLoads.push(loadSingleImageAndUpdate(nextIdx, 'img-next'));
    
    // 배치 분석 시도 (현재 + 주변부 3장을 같이 분석하여 비교 우위 확보)
    // 개별 분석(loadSingleImageAndUpdate) 전에 실행하여 경합 방지
    await triggerBatchAnalysis(manager, [currIdx, prevIdx, nextIdx].filter(i => i !== null));

    await loadSingleImageAndUpdate(currIdx, 'img-curr');

    const loaded = new Set([currIdx]);
    if (prevIdx !== null) loaded.add(prevIdx);
    if (nextIdx !== null) loaded.add(nextIdx);
    await prefetchRemaining(loaded);
}

/**
 * 특정 이미지들에 대해 한 번에 AI 분석을 요청하여 비교 분석 결과를 확보합니다.
 */
async function triggerBatchAnalysis(manager, indices) {
    const photos = photoService.getPhotos();
    const targets = indices.filter(idx => {
        const p = photos[idx];
        return p && !p.contextMessage && !p._aiReasonFetching;
    });

    if (targets.length < 2) return; 

    console.info(`[RECOCO-TRACE] Triggering batch analysis for indices: ${targets}`);
    
    // 1. 공통 필터(Rule-base) 추출 및 헤더 반영
    const commonReasons = calculateCommonFilter(targets, photos);
    updateCurationHeader(commonReasons);

    // 낙관적 상태 업데이트 (중복 요청 방지)
    targets.forEach(idx => { 
        if (photos[idx]) photos[idx]._aiReasonFetching = true; 
    });

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
function updateCurationHeader(commonReasons) {
    const headerEl = document.getElementById('curation-header-desc');
    if (!headerEl) return;

    if (commonReasons.length === 0) {
        headerEl.innerText = '기기에서 찾아낸 비우기 좋은 기록들입니다.';
        return;
    }

    const mapping = {
        '앨범 미분류': '앨범에 정리되지 않은 사진들이에요.',
        '스크린샷': '스크린샷 기록들이에요.',
        '대용량 파일': '공간을 많이 차지하는 대용량 파일들이에요.',
        '오래된 사진': '1년 이상 된 오래된 사진들이에요.',
        '즐겨찾기 됨': '특별히 아꼈던 기록들이에요.'
    };

    // 여러 공통점이 있을 경우 첫 번째 혹은 조합하여 노출
    const primary = commonReasons[0];
    let message = mapping[primary] || '비우기 좋은 기록들입니다.';

    if (commonReasons.includes('오래된 사진') && commonReasons.includes('앨범 미분류')) {
        message = '1년 넘게 앨범에 정리되지 않은 사진들이에요.';
    }

    headerEl.innerText = message;
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
