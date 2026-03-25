/**
 * HomeManager - Daily Curation Dashboard
 * 리코코 메인 데일리 큐레이션 화면 (UI View Controller)
 */

import { supabase } from '../services/supabase.js';
import { photoService } from '../services/PhotoService.js';
import { handleError, showToast, ErrorLevel } from '../utils/errorHandler.js';

export class HomeManager {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.onPreciousClick = options.onPreciousClick || null;
        this.onThanksClick = options.onThanksClick || null;
        this.confirmModal = options.confirmModal || null;
        this.user = null;
        this.currentIndex = 0;
        this.isLoading = false;
        this.error = null;
        
        this._setupEventDelegation();
        this._setupDailyCurationListener();
    }

    /**
     * 실제 사진 목록 로드 및 큐레이션 (PhotoService 위임)
     */
    async loadRealPhotos() {
        console.log('HomeManager: Starting loadRealPhotos...');
        const startedAt = performance.now();
        this.isLoading = true;
        this.error = null;
        this.render();

        try {
            // Launch path는 전체 스캔을 피하고, 네이티브 daily cache 결과만 즉시 받는다.
            const { photos, totalCount, dayKey, fromCache, needsRefresh } = await photoService.fetchDailyCuration({
                // 홈 첫 진입 p95 개선: 실제 캐러셀 표시 수(최대 3장)에 맞춰 페이로드를 최소화
                limit: 3,
                thumbSize: 300,
                transport: 'base64'
            });
            
            const elapsed = Math.round(performance.now() - startedAt);
            console.log(`[PERF] launch_to_carousel_ms=${elapsed} dayKey=${dayKey} fromCache=${fromCache} needsRefresh=${needsRefresh}`);
            console.log(`HomeManager: 데일리 큐레이션 조회 성공 — ${photos.length}장`);
            // 빈 결과여도 성능 측정값은 남겨야 p95/p99 분석에서 샘플 누락이 없다.
            const perfEntry = {
                ts: new Date().toISOString(),
                launch_to_carousel_ms: elapsed,
                dayKey,
                fromCache,
                needsRefresh,
                daily_items_count: photos.length
            };
            const prev = JSON.parse(localStorage.getItem('perf_runs') || '[]');
            prev.push(perfEntry);
            localStorage.setItem('perf_runs', JSON.stringify(prev.slice(-50)));
            showToast(`[PERF] ${elapsed}ms cache=${fromCache ? 'Y' : 'N'} refresh=${needsRefresh ? 'Y' : 'N'} items=${photos.length}`, ErrorLevel.INFO);
            
            if (photos.length > 0) {
                this.currentIndex = 0;
            } else {
                this.error = '사진첩에 분석할 수 있는 사진이 없습니다.';
            }
        } catch (error) {
            handleError(error, 'HomeManager');
            this.error = '사진첩 접근 권한이 필요합니다.';
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    async getCurrentImageAsFile() {
        return await photoService.getPhotoAsFile(this.currentIndex);
    }

    async getCurrentPhotoBase64() {
        return await photoService.getPhotoAsBase64(this.currentIndex);
    }

    async getCurrentPhotoMeta() {
        const photo = await photoService.ensurePhotoSummary(this.currentIndex, { includeFileSize: false });
        if (!photo) return {};
        const asset = photo.rawAsset;
        return {
            Make: "Apple iPhone",
            date: asset.creationDate ? asset.creationDate.split('T')[0] : '',
            DateTime: asset.creationDate,
            pixelWidth: asset.pixelWidth,
            pixelHeight: asset.pixelHeight,
            fileSize: asset.fileSize,
            gps: asset.location ? {
                lat: asset.location.latitude,
                lon: asset.location.longitude,
                formatted: photo.location
            } : null,
            _isNative: true,
            curationScore: photo.score,
            assetId: photo.id,
            dayKey: photo.dayKey,
            curationReasons: asset.curationReasons || []
        };
    }

    _setupEventDelegation() {
        if (!this.container) return;
        this.container.addEventListener('click', async (e) => {
            const preciousBtn = e.target.closest('#precious-btn');
            const thanksBtn = e.target.closest('#thanks-btn');
            const retryBtn = e.target.closest('#retry-btn');
            const prevImg = e.target.closest('#img-prev');
            const nextImg = e.target.closest('#img-next');
            const photos = photoService.getPhotos();

            if (preciousBtn) {
                e.preventDefault();
                if (this.onPreciousClick) await this.onPreciousClick();
            } else if (thanksBtn) {
                e.preventDefault();
                await this._handleDelete();
            } else if (retryBtn) {
                e.preventDefault();
                this.loadRealPhotos();
            } else if (prevImg) {
                e.preventDefault();
                if (this.currentIndex > 0) {
                    this.currentIndex--;
                    this.render();
                }
            } else if (nextImg) {
                e.preventDefault();
                const visibleMax = Math.min(photos.length, 3);
                if (this.currentIndex < visibleMax - 1) {
                    this.currentIndex++;
                    this.render();
                }
            }
        });
    }

    _setupDailyCurationListener() {
        if (typeof window === 'undefined') return;
        window.addEventListener('daily-curation-updated', () => {
            const photos = photoService.getPhotos();
            const visibleMax = Math.min(photos.length, 3);

            if (photos.length > 0) {
                this.error = null;
                if (this.currentIndex >= visibleMax) {
                    this.currentIndex = Math.max(0, visibleMax - 1);
                }
            } else if (!this.isLoading) {
                this.error = '사진첩에 분석할 수 있는 사진이 없습니다.';
                this.currentIndex = 0;
            }

            const isVisible = this.container &&
                !this.container.classList.contains('hidden') &&
                this.container.style.display !== 'none';

            if (isVisible) {
                this.render();
            }
        });
    }

    async _handleDelete() {
        const photos = photoService.getPhotos();
        const current = photos[this.currentIndex];
        if (!current) return;

        const performDelete = async () => {
            try {
                const actionDayKey = current.dayKey;
                const success = await photoService.deletePhoto(this.currentIndex);
                if (success) {
                    await photoService.recordCurationAction({
                        assetId: current.id,
                        action: 'deleted',
                        dayKey: actionDayKey
                    });

                    try {
                        // 삭제 직후에는 force refresh로 pending/today 후보를 반영한다.
                        const { photos: refreshed } = await photoService.refreshDailyCurationAfterMutation({
                            limit: 3,
                            thumbSize: 300,
                            transport: 'base64'
                        });
                        this.currentIndex = 0;
                    } catch (refreshError) {
                        console.warn('HomeManager: daily refresh after mutation failed', refreshError);
                    }

                    // 삭제 후 데이터 갱신 및 UI 리렌더링 (목록이 바뀌므로 이때는 리렌더링 필요)
                    if (this.currentIndex >= photoService.getPhotos().length) {
                        this.currentIndex = Math.max(0, photoService.getPhotos().length - 1);
                    }
                    console.log('HomeManager: 사진 삭제 성공 및 통계 기록 완료');
                    showToast('사진이 정리되었습니다.', ErrorLevel.INFO);
                    this.render();
                }
            } catch (err) {
                handleError(err, 'PhotoDelete');
            }
        };

        if (this.confirmModal) {
            this.confirmModal.show({
                title: '사진을 비울까요?',
                message: '이 사진을 기기에서 삭제하고 비움 기록을 남깁니다.',
                confirmText: '비우기',
                onConfirm: performDelete
            });
        } else if (confirm('이 사진을 사진첩에서 삭제하시겠습니까?')) {
            await performDelete();
        }
    }

    async render() {
        // 사용자 정보 로딩 로직 (중략...)
        if (!this.user && !this._isFetchingUser) {
            this._isFetchingUser = true;
            supabase.auth.getUser().then(({ data: { user } }) => {
                this.user = user;
                this._isFetchingUser = false;
                const nameEl = document.getElementById('profile-name-display');
                if (nameEl && user) {
                    nameEl.innerText = `${user.user_metadata?.full_name || '사용자'}님, 함께 정리해요`;
                }
            }).catch(() => {
                this._isFetchingUser = false;
            });
        }

        const profileName = this.user?.user_metadata?.full_name || '사용자';

        if (this.error) {
            this.container.innerHTML = `
                <div class="flex flex-col px-6">
                    <header class="flex items-center bg-transparent py-3 shrink-0" style="padding-top: calc(env(safe-area-inset-top) + 12px);">
                        <div class="text-primary flex size-8 shrink-0 items-center justify-center">
                            <span class="material-symbols-outlined text-2xl font-light">water_lux</span>
                        </div>
                        <h2 class="text-white text-base font-bold leading-tight tracking-tight flex-1 text-center uppercase">recoco</h2>
                        <div class="w-8"></div>
                    </header>
                    <div class="flex-1 flex flex-col items-center justify-center text-center space-y-6 pb-32">
                        <span class="material-symbols-outlined text-6xl text-muted-lavender/30">no_photography</span>
                        <p class="text-muted-lavender text-sm leading-relaxed">${this.error}</p>
                        <button id="retry-btn" class="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-primary font-bold text-sm">다시 시도하기</button>
                    </div>
                </div>
            `;
            return;
        }

        if (this.isLoading) {
            this.container.innerHTML = `
                <div class="flex flex-col px-6">
                    <header class="flex items-center bg-transparent py-3 shrink-0" style="padding-top: calc(env(safe-area-inset-top) + 12px);">
                        <div class="text-primary flex size-8 shrink-0 items-center justify-center">
                            <span class="material-symbols-outlined text-2xl font-light">water_lux</span>
                        </div>
                        <h2 class="text-white text-base font-bold leading-tight tracking-tight flex-1 text-center uppercase">recoco</h2>
                        <div class="w-8"></div>
                    </header>
                    <div class="flex-1 flex flex-col items-center justify-center space-y-4 pb-32">
                        <div class="loader"></div>
                        <p class="text-primary font-bold text-sm">사진첩 분석 중...</p>
                        <p class="text-muted-lavender text-xs">당신만을 위한 기록을 고르고 있어요.</p>
                    </div>
                </div>
            `;
            return;
        }

        const photos = photoService.getPhotos();

        if (photos.length === 0) {
            this.container.innerHTML = `
                <div class="flex flex-col px-6">
                    <header class="flex items-center bg-transparent py-3 shrink-0" style="padding-top: calc(env(safe-area-inset-top) + 12px);">
                        <div class="text-primary flex size-8 shrink-0 items-center justify-center">
                            <span class="material-symbols-outlined text-2xl font-light">water_lux</span>
                        </div>
                        <h2 class="text-white text-base font-bold leading-tight tracking-tight flex-1 text-center uppercase">recoco</h2>
                        <div class="w-8"></div>
                    </header>
                    <div class="flex-1 flex flex-col items-center justify-center space-y-4 pb-32">
                        <div class="loader"></div>
                        <p class="text-muted-lavender text-xs">사진 데이터를 분석하고 있습니다...</p>
                    </div>
                </div>
            `;
            this.loadRealPhotos();
            return;
        }

        const VISIBLE_COUNT = 3;
        const visibleMax = Math.min(photos.length, VISIBLE_COUNT);
        if (this.currentIndex >= visibleMax) this.currentIndex = visibleMax - 1;

        const currentPhoto = photos[this.currentIndex];
        const isFirst = this.currentIndex === 0;
        const isLast = this.currentIndex === visibleMax - 1;
        const prevIdx = isFirst ? null : this.currentIndex - 1;
        const nextIdx = isLast ? null : this.currentIndex + 1;
        const prevPhoto = prevIdx !== null ? photos[prevIdx] : null;
        const nextPhoto = nextIdx !== null ? photos[nextIdx] : null;

        this.container.innerHTML = `
            <div class="flex flex-col px-6 h-full">
                <header class="flex items-center bg-transparent pb-3 shrink-0" style="padding-top: calc(env(safe-area-inset-top) + 12px);">
                    <div class="text-primary flex size-8 shrink-0 items-center justify-center">
                        <span class="material-symbols-outlined text-2xl font-light">water_lux</span>
                    </div>
                    <h2 class="text-white text-base font-bold leading-tight tracking-tight flex-1 text-center uppercase">recoco</h2>
                    <div class="w-8"></div>
                </header>

                <div class="py-1 shrink-0">
                    <div class="bg-field-bg rounded-2xl p-4 border border-white/5 shadow-2xl">
                        <div class="flex justify-between items-center mb-2">
                            <div class="flex flex-col">
                                <span class="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-lavender">이번 주 비움 목표</span>
                                <span class="text-sm font-bold text-white">${7 - visibleMax} / 7 장</span>
                            </div>
                            <span class="text-[10px] font-medium text-primary italic">${profileName}님, 함께 정리해요</span>
                        </div>
                        <div class="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div class="absolute top-0 left-0 h-full bg-primary rounded-full transition-all" style="width: ${Math.max(0, (7 - visibleMax) * (100 / 7))}%;"></div>
                        </div>
                    </div>
                </div>

                <div class="py-4 shrink-0 px-1">
                    <h1 class="text-white text-xl font-bold leading-tight tracking-tight">
                        좋은 아침이에요.<br/>
                        <span class="text-muted-lavender font-normal text-sm">기기에서 찾아낸 비우기 좋은 기록들입니다.</span>
                    </h1>
                </div>

                <div class="flex-1 flex flex-col justify-center min-h-0">
                    <!-- Carousel Wrapper: 3장만 노출하여 성능 최적화 -->
                    <div class="carousel-container mb-2" id="carousel-wrapper">
                        <div class="carousel-item side ${prevPhoto ? 'opacity-40' : 'opacity-0 pointer-events-none'}">
                            <div id="img-prev" class="aspect-[2/3] w-full bg-center bg-cover rounded-[24px] border border-white/10 bg-field-bg transition-all duration-300 cursor-pointer hover:opacity-60 grayscale-[50%]"
                                 style='${prevPhoto?.imageUrl ? `background-image: url("${prevPhoto.imageUrl}");` : ""}'>
                            </div>
                        </div>
                        <div class="carousel-item">
                            <div class="relative aspect-[2/3] w-full">
                                <div id="img-curr" class="w-full h-full bg-center bg-cover rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 bg-field-bg transition-all duration-300"
                                     style='${currentPhoto?.imageUrl ? `background-image: url("${currentPhoto.imageUrl}");` : ""}'>
                                </div>
                                ${currentPhoto?.score > 20 ? '<div class="absolute top-4 right-4 bg-primary/90 text-dark-bg text-[10px] font-black px-2 py-1 rounded-full shadow-lg">HIGH DETOX</div>' : ''}
                            </div>
                        </div>
                        <div class="carousel-item side ${nextPhoto ? 'opacity-40' : 'opacity-0 pointer-events-none'}">
                            <div id="img-next" class="aspect-[2/3] w-full bg-center bg-cover rounded-[24px] border border-white/10 bg-field-bg transition-all duration-300 cursor-pointer hover:opacity-60 grayscale-[50%]"
                                 style='${nextPhoto?.imageUrl ? `background-image: url("${nextPhoto.imageUrl}");` : ""}'>
                            </div>
                        </div>
                    </div>

                    <!-- Meta Info & Buttons (마진 축소) -->
                    <div class="px-6 mx-6 shrink-0 max-w-md mx-auto w-full">
                        <div id="photo-meta-info" class="mb-3 h-12 flex flex-col items-center justify-center">
                            <p class="text-white text-[14px] font-medium leading-relaxed text-center break-keep">
                                <span id="meta-date">${currentPhoto?.date || ''}</span> | <span id="meta-location">${currentPhoto?.location || ''}</span><br/>
                                <span id="meta-context" class="text-primary text-xs font-bold">${currentPhoto?.contextMessage || ''}</span>
                            </p>
                        </div>

                        <div class="flex gap-4 w-full pb-8">
                            <button id="thanks-btn" class="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 px-2 rounded-2xl border border-primary/30 bg-field-bg active:scale-95 transition-all">
                                <span class="material-symbols-outlined text-primary text-xl">delete</span>
                                <span class="text-primary font-bold text-[13px] leading-tight">고마웠어</span>
                                <span class="text-primary/60 text-[10px] font-medium">(삭제하기)</span>
                            </button>
                            <button id="precious-btn" class="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 px-2 rounded-2xl bg-primary shadow-lg shadow-primary/20 active:scale-95 transition-all">
                                <span class="material-symbols-outlined text-white text-xl" style="font-variation-settings: 'FILL' 1">auto_awesome</span>
                                <span class="text-white font-bold text-[13px] leading-tight">소중해</span>
                                <span class="text-white/70 text-[10px] font-medium">(기록하기)</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 중앙 정렬 보장 + 스와이프 스냅 리스너 등록
        requestAnimationFrame(() => {
            const wrapper = document.getElementById('carousel-wrapper');
            if (wrapper) {
                const centerItem = wrapper.children[1];
                if (centerItem) centerItem.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
                this._setupCarouselSnap(wrapper);
            }
        });

        // 이미지 로딩 실행 (병렬 처리)
        this._loadAndReflectImages(this.currentIndex, prevIdx, nextIdx, isFirst, isLast);
    }

    async _loadAndReflectImages(currIdx, prevIdx, nextIdx, isFirst, isLast) {
        // 1. 현재 사진 우선 로드 (UX)
        await this._loadSingleImageAndUpdate(currIdx, 'img-curr');

        // 2. 이전/다음 사진 병렬 로드 (경계일 때는 해당 방향 스킵)
        const sideLoads = [];
        if (!isFirst) sideLoads.push(this._loadSingleImageAndUpdate(prevIdx, 'img-prev'));
        if (!isLast) sideLoads.push(this._loadSingleImageAndUpdate(nextIdx, 'img-next'));
        await Promise.all(sideLoads);

        // 3. 나머지 사진 백그라운드 프리페치
        const loaded = new Set([currIdx]);
        if (prevIdx !== null) loaded.add(prevIdx);
        if (nextIdx !== null) loaded.add(nextIdx);
        this._prefetchRemaining(loaded);
    }

    /**
     * 캐러셀에 표시되지 않는 나머지 사진들을 백그라운드로 점진 로드.
     * 2장씩 배치 처리하여 네이티브 브릿지/네트워크 포화 방지.
     */
    async _prefetchRemaining(loadedSet) {
        const photos = photoService.getPhotos();
        const remaining = [];
        for (let i = 0; i < photos.length; i++) {
            if (!loadedSet.has(i)) remaining.push(i);
        }

        const BATCH = 2;
        for (let b = 0; b < remaining.length; b += BATCH) {
            const batch = remaining.slice(b, b + BATCH);
            await Promise.all(batch.map(i => photoService.loadPhotoDetails(i)));
        }
    }

    /**
     * 캐러셀 스와이프 스냅 감지: 스크롤 종료 후 중앙 카드를 찾아 currentIndex 갱신
     */
    _setupCarouselSnap(wrapper) {
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

                // carousel items: [prev(0), current(1), next(2)]
                if (closestVisualIdx === 1) return; // 이미 중앙

                const photos = photoService.getPhotos();
                const visibleMax = Math.min(photos.length, 3);
                if (closestVisualIdx === 0 && this.currentIndex > 0) {
                    this.currentIndex--;
                    this.render();
                } else if (closestVisualIdx === 2 && this.currentIndex < visibleMax - 1) {
                    this.currentIndex++;
                    this.render();
                }
            }, 120);
        }, { passive: true });
    }

    async _loadSingleImageAndUpdate(index, elementId) {
        try {
            const photo = await photoService.loadPhotoDetails(index);
            const el = document.getElementById(elementId);

            if (el && photo && photo.imageUrl) {
                el.style.backgroundImage = `url("${photo.imageUrl}")`;

                if (elementId === 'img-curr') {
                    const locEl = document.getElementById('meta-location');
                    if (locEl) locEl.innerText = photo.location || '위치 정보 없음';
                }
            } else if (el) {
                el.style.backgroundImage = 'none';
            }
        } catch (error) {
            console.error(`HomeManager: Failed to load image at index ${index}:`, error);
        }
    }

}
