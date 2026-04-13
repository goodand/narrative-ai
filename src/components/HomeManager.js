/**
 * HomeManager - Daily Curation Dashboard
 * 리코코 메인 데일리 큐레이션 화면 (UI View Controller)
 */

import { supabase } from '../services/supabase.js';
import { photoService } from '../services/PhotoService.js';
import { loadRealPhotos, setupDailyCurationListener } from './home/homeLoadRuntime.js';
import { handleDelete } from './home/homeDeleteRuntime.js';
import { loadAndReflectImages, setupCarouselSnap } from './home/homeImageRuntime.js';

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
        setupDailyCurationListener(this);
    }

    async loadRealPhotos() {
        return loadRealPhotos(this);
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
                        <div id="photo-meta-info" class="mb-5 min-h-[4rem] flex flex-col items-center justify-start transition-all duration-300">
                            <p class="text-white text-[14px] font-medium leading-relaxed text-center break-keep w-full">
                                <span id="meta-date">${currentPhoto?.date || ''}</span> | <span id="meta-location">${currentPhoto?.location || ''}</span><br/>
                                <span id="meta-context" class="text-primary text-[13px] font-bold block mt-1 leading-snug">${currentPhoto?.contextMessage || ''}</span>
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
                setupCarouselSnap(this, wrapper);
            }
        });

        // 이미지 로딩 실행 (병렬 처리)
        loadAndReflectImages(this, this.currentIndex, prevIdx, nextIdx, isFirst, isLast);
    }
}
