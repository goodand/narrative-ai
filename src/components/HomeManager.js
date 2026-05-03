
/**
 * HomeManager - Daily Curation Dashboard
 * 리코코 메인 데일리 큐레이션 화면 (UI View Controller)
 */

import { supabase } from '../services/supabase.js';
import { photoService } from '../services/PhotoService.js';
import { loadAndReflectImages, setupCarouselSnap, triggerBatchAnalysis } from './home/homeImageRuntime.js';
import { setupDailyCurationListener } from './home/homeLoadRuntime.js';

export class HomeManager {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.onPreciousClick = options.onPreciousClick || null;
        this.onThanksClick = options.onThanksClick || null;
        this.confirmModal = options.confirmModal || null;
        this.user = null;
        this.error = null;
        this.isLoading = false;
        this.headerMessage = '기기에서 찾아낸 비우기 좋은 기록들입니다.';
        
        // --- 버퍼링 및 상태 관리 ---
        this.photos = [];
        this._nextBatch = null;
        this._isRefilling = false;
        
        this.currentIndex = 0;
        this._setupEventDelegation();
        setupDailyCurationListener(this);
    }

    async loadRealPhotos() {
        const { loadRealPhotos } = await import('./home/homeLoadRuntime.js');
        const result = await loadRealPhotos(this);
        this.photos = [...photoService.getPhotos()];
        return result;
    }

    async getCurrentImageAsFile() {
        return await photoService.getPhotoAsFile(this.currentIndex);
    }

    async getCurrentPhotoBase64() {
        return await photoService.getPhotoAsBase64(this.currentIndex);
    }

    async getCurrentPhotoMeta() {
        if (this.currentIndex < 0 || this.currentIndex >= this.photos.length) return {};
        const photo = this.photos[this.currentIndex];
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
            const photos = this.photos;

            if (preciousBtn) {
                e.preventDefault();
                if (this.onPreciousClick) await this.onPreciousClick();
            } else if (thanksBtn) {
                e.preventDefault();
                const { handleDelete } = await import('./home/homeDeleteRuntime.js');
                await handleDelete(this);
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
                        <button id="retry-btn" class="px-6 py-3 bg-white/5 border border-white/10 rounded-3xl text-primary font-bold text-sm">다시 시도하기</button>
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

        const photos = this.photos;

        // S3: 데이터 로딩 완료, 에러 없음, 사진 0건 → 빈 상태 안내
        if (photos.length === 0) {
            this.container.innerHTML = `
                <div class="flex flex-col px-6 h-full">
                    <header class="flex items-center bg-transparent py-3 shrink-0" style="padding-top: calc(env(safe-area-inset-top) + 12px);">
                        <div class="text-primary flex size-8 shrink-0 items-center justify-center">
                            <span class="material-symbols-outlined text-2xl font-light">water_lux</span>
                        </div>
                        <h2 class="text-white text-base font-bold leading-tight tracking-tight flex-1 text-center uppercase">recoco</h2>
                        <div class="w-8"></div>
                    </header>
                    <div class="flex-1 flex flex-col items-center justify-center space-y-4 pb-32">
                        <div class="flex flex-col items-center space-y-6">
                            <span class="material-symbols-outlined text-6xl text-muted-lavender/30">no_photography</span>
                            <p class="text-muted-lavender text-sm font-medium">분석된 사진이 없습니다.</p>
                            <button id="retry-btn" class="px-6 py-2 bg-white/5 border border-white/10 rounded-3xl text-primary font-bold text-sm">다시 분석하기</button>
                        </div>
                    </div>
                </div>
            `;
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
                            <div class="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-300 ease-in-out" style="width: ${Math.max(0, (7 - visibleMax) * (100 / 7))}%;"></div>
                        </div>
                    </div>
                </div>

                <div class="py-4 shrink-0 px-1">
                    <h1 class="text-white text-xl font-bold leading-tight tracking-tight">
                        좋은 아침이에요.<br/>
                        <span id="curation-header-desc" class="text-muted-lavender font-normal text-sm">${this.headerMessage}</span>
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
                                <div id="img-curr" class="w-full h-full bg-center bg-cover rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.4)] border border-white/10 bg-field-bg transition-all duration-300 ease-in-out"
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
                        <div id="photo-meta-info" class="mb-5 min-h-[4rem] flex flex-col items-center justify-start transition-all duration-300">
                            <p class="text-white text-[14px] font-medium leading-relaxed text-center break-keep w-full">
                                <span id="meta-date">${currentPhoto?.date || ''}</span> | <span id="meta-location">${currentPhoto?.location || ''}</span><br/>
                                <span id="meta-context" class="text-primary text-sm font-bold block mt-1 leading-snug">${currentPhoto?.contextMessage || ''}</span>
                            </p>
                        </div>

                        <div class="flex gap-4 w-full pb-8">
                            <button id="thanks-btn" class="flex-1 flex flex-row items-center justify-center gap-2 h-14 px-6 rounded-3xl border border-white/10 bg-transparent active:scale-95 transition-all duration-300 ease-in-out">
                                <span class="material-symbols-outlined text-[#B2B0B5] text-xl">delete</span>
                                <span class="text-[#B2B0B5] font-semibold text-base">고마웠어</span>
                            </button>
                            <button id="precious-btn" class="flex-1 flex flex-row items-center justify-center gap-2 h-14 px-6 rounded-3xl bg-primary shadow-[0_8px_24px_rgba(178,165,207,0.3)] active:scale-95 transition-all duration-300 ease-in-out">
                                <span class="material-symbols-outlined text-dark-bg text-xl" style="font-variation-settings: 'FILL' 1">auto_awesome</span>
                                <span class="text-dark-bg font-bold text-base">소중해</span>
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
                setupCarouselSnap(this, wrapper);
            }
        });

        // 이미지 로딩 실행 (병렬 처리)
        loadAndReflectImages(this, this.currentIndex, prevIdx, nextIdx, isFirst, isLast);
    }

    /**
     * 사진 1장을 소비(삭제/기록)하고 다음 상태를 결정합니다.
     */
    async consumePhoto(index) {
        if (index < 0 || index >= this.photos.length) return;
        
        console.log(`[RECOCO-TRACE] Consuming photo at index ${index}. Remaining: ${this.photos.length - 1}`);
        this.photos.splice(index, 1);

        // 마지막 1장 남았을 때 백그라운드 리필 트리거
        if (this.photos.length === 1 && !this._nextBatch && !this._isRefilling) {
            this.triggerBackgroundRefill();
        }

        if (this.photos.length === 0) {
            await this.switchToNextBatch();
        } else {
            if (this.currentIndex >= this.photos.length) {
                this.currentIndex = Math.max(0, this.photos.length - 1);
            }
            this.render();
        }
    }

    /**
     * 백그라운드 리필 엔진 작동
     */
    async triggerBackgroundRefill() {
        if (this._isRefilling) return;
        this._isRefilling = true;
        console.info('[RECOCO-TRACE] Triggering background refill...');
        
        try {
            const { triggerBackgroundPrefetch } = await import('./home/homeRefillRuntime.js');
            this._nextBatch = await triggerBackgroundPrefetch(this);
            console.info('[RECOCO-TRACE] Background refill prepared.');
        } catch (error) {
            console.error('[RECOCO-TRACE] Background refill failed:', error);
        } finally {
            this._isRefilling = false;
        }
    }

    /**
     * 다음 묶음으로 교체
     */
    async switchToNextBatch() {
        if (this._nextBatch && this._nextBatch.length > 0) {
            console.info('[RECOCO-TRACE] Switching to even-ready next batch.');
            this.photos = [...this._nextBatch];
            this._nextBatch = null;
            this.currentIndex = 0;
            this.render();
        } else {
            console.info('[RECOCO-TRACE] Batch empty and no buffer ready. Hard refreshing...');
            // loadRealPhotos가 내부에서 isLoading/render를 직접 관리하므로
            // 여기서 중복 설정하지 않음 (이중 render 방지)
            await this.loadRealPhotos();
            this.currentIndex = 0;
        }
    }
}
