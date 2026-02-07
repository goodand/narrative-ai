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
    }

    /**
     * 실제 사진 목록 로드 및 큐레이션 (PhotoService 위임)
     */
    async loadRealPhotos() {
        console.log('HomeManager: Starting loadRealPhotos...');
        this.isLoading = true;
        this.error = null;
        this.render();

        try {
            const { photos, totalCount } = await photoService.fetchAndRankPhotos();
            
            if (totalCount > 0) {
                console.log(`HomeManager: 사진 조회 성공 — 총 ${totalCount}장 중 ${photos.length}장 큐레이션`);
            }
            
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

    getCurrentPhotoMeta() {
        const photo = photoService.getPhoto(this.currentIndex);
        if (!photo) return {};
        const asset = photo.rawAsset;
        return {
            Make: "Apple iPhone",
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
            curationScore: photo.score
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
                console.log('HomeManager: Retry button clicked');
                e.preventDefault();
                this.loadRealPhotos();
            } else if (prevImg) {
                e.preventDefault();
                this.currentIndex = (this.currentIndex - 1 + photos.length) % photos.length;
                this.render();
            } else if (nextImg) {
                e.preventDefault();
                this.currentIndex = (this.currentIndex + 1) % photos.length;
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
                const success = await photoService.deletePhoto(this.currentIndex);
                if (success) {
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
        // 사용자 정보 로딩 로직
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

        const currentPhoto = photos[this.currentIndex];
        const prevIdx = (this.currentIndex - 1 + photos.length) % photos.length;
        const nextIdx = (this.currentIndex + 1) % photos.length;
        const prevPhoto = photos[prevIdx];
        const nextPhoto = photos[nextIdx];

        this.container.innerHTML = `
            <div class="flex flex-col px-6">
                <header class="flex items-center bg-transparent pb-3 shrink-0" style="padding-top: calc(env(safe-area-inset-top) + 12px);">
                    <div class="text-primary flex size-8 shrink-0 items-center justify-center">
                        <span class="material-symbols-outlined text-2xl font-light">water_lux</span>
                    </div>
                    <h2 class="text-white text-base font-bold leading-tight tracking-tight flex-1 text-center uppercase">recoco</h2>
                    <div class="flex w-8 items-center justify-end">
                        <button class="flex cursor-pointer items-center justify-center rounded-lg h-8 bg-transparent text-muted-lavender p-0">
                            <span class="material-symbols-outlined text-xl">settings</span>
                        </button>
                    </div>
                </header>

                <div class="py-1 shrink-0">
                    <div class="bg-field-bg rounded-2xl p-4 border border-white/5 shadow-2xl">
                        <div class="flex justify-between items-center mb-2">
                            <div class="flex flex-col">
                                <span class="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-lavender">이번 주 비움 목표</span>
                                <span class="text-sm font-bold text-white">${10 - photos.length} / 10 장</span>
                            </div>
                            <span class="text-[10px] font-medium text-primary italic">${profileName}님, 함께 정리해요</span>
                        </div>
                        <div class="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div class="absolute top-0 left-0 h-full bg-primary rounded-full transition-all" style="width: ${(10 - photos.length) * 10}%;"></div>
                        </div>
                    </div>
                </div>

                <div class="py-4 shrink-0 px-1">
                    <h1 class="text-white text-xl font-bold leading-tight tracking-tight">
                        좋은 아침이에요.<br/>
                        <span class="text-muted-lavender font-normal text-sm">기기에서 찾아낸 비우기 좋은 기록들입니다.</span>
                    </h1>
                </div>

                <div class="flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
                    <div class="carousel-container mb-4">
                        <div class="carousel-item side opacity-40">
                            <div id="img-prev" class="aspect-[4/5] w-full bg-center bg-cover rounded-[24px] border border-white/10 bg-field-bg transition-all duration-300 cursor-pointer hover:opacity-60"
                                 style='${prevPhoto?.imageUrl ? `background-image: url("${prevPhoto.imageUrl}");` : ""} filter: grayscale(50%);'>
                            </div>
                        </div>
                        <div class="carousel-item">
                            <div class="relative aspect-[4/5] w-full">
                                <div id="img-curr" class="w-full h-full bg-center bg-cover rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 bg-field-bg transition-all duration-300" 
                                     style='${currentPhoto?.imageUrl ? `background-image: url("${currentPhoto.imageUrl}");` : ""}'>
                                </div>
                                ${currentPhoto?.score > 20 ? '<div class="absolute top-4 right-4 bg-primary/90 text-dark-bg text-[10px] font-black px-2 py-1 rounded-full shadow-lg">HIGH DETOX</div>' : ''}
                            </div>
                        </div>
                        <div class="carousel-item side opacity-40">
                            <div id="img-next" class="aspect-[4/5] w-full bg-center bg-cover rounded-[24px] border border-white/10 bg-field-bg transition-all duration-300 cursor-pointer hover:opacity-60"
                                 style='${nextPhoto?.imageUrl ? `background-image: url("${nextPhoto.imageUrl}");` : ""} filter: grayscale(50%);'>
                            </div>
                        </div>
                    </div>

                    <div class="px-8 shrink-0">
                        <div class="mb-6">
                            <p class="text-white text-[14px] font-medium leading-relaxed text-center break-keep">
                                ${currentPhoto?.date || ''} | <span id="txt-location">${currentPhoto?.location || ''}</span><br/>
                                <span class="text-primary text-xs font-bold">${currentPhoto?.contextMessage || ''}</span>
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

        this._loadAndReflectImages(this.currentIndex, prevIdx, nextIdx);
    }

    async _loadAndReflectImages(currIdx, prevIdx, nextIdx) {
        // 현재 사진 우선 로드 (사용자가 보는 사진)
        await this._loadSingleImageAndUpdate(currIdx, 'img-curr');
        // 이전/다음 사진은 병렬 로드
        await Promise.all([
            this._loadSingleImageAndUpdate(prevIdx, 'img-prev'),
            this._loadSingleImageAndUpdate(nextIdx, 'img-next'),
        ]);
        // 나머지 사진 백그라운드 프리페치 (UI 블로킹 없음)
        this._prefetchRemaining(new Set([currIdx, prevIdx, nextIdx]));
    }

    /**
     * 캐러셀에 표시되지 않는 나머지 사진들을 백그라운드로 미리 로드.
     * 스와이프 시 캐시 히트로 즉시 표시된다.
     */
    _prefetchRemaining(loadedSet) {
        const photos = photoService.getPhotos();
        for (let i = 0; i < photos.length; i++) {
            if (!loadedSet.has(i)) {
                photoService.loadPhotoDetails(i);
            }
        }
    }

    async _loadSingleImageAndUpdate(index, elementId) {
        const photo = await photoService.loadPhotoDetails(index);
        
        const el = document.getElementById(elementId);
        if (el && photo && photo.imageUrl) {
            el.style.backgroundImage = `url("${photo.imageUrl}")`;
            
            if (elementId === 'img-curr') {
                const locEl = document.getElementById('txt-location');
                if (locEl) locEl.innerText = photo.location || '위치 정보 없음';
            }
        }
    }
}