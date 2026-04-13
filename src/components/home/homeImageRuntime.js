import { photoService } from '../../services/PhotoService.js';
import { GeminiService } from '../../services/GeminiService.js';

const geminiService = new GeminiService();

export async function loadAndReflectImages(manager, currIdx, prevIdx, nextIdx, isFirst, isLast) {
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

                // Fetch AI Delete Recommendation
                const metaContextEl = document.getElementById('meta-context');
                if (metaContextEl && !photo._aiReasonFetching) {
                    photo._aiReasonFetching = true;
                    metaContextEl.innerText = 'AI 분석 중...';
                    metaContextEl.classList.add('animate-pulse');

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
                        photo.contextMessage = result.reason; // Cache the result
                    } catch (error) {
                        console.error('Failed to generate delete recommendation:', error);
                        metaContextEl.innerText = photo.contextMessage || '오늘 정리하기 좋은 항목이에요.';
                    } finally {
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
