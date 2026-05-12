/**
 * HomeManager - Daily Curation Dashboard.
 *
 * Slice 5e (Decisions #1A, #3C, #4B): platform/service direct imports
 * removed; legacy `home/*Runtime.js` files replaced. All business logic
 * flows through `core.home`:
 *   - load:           `core.home.loadDailyCuration()`
 *   - move prev/next: `core.home.movePrevious()` / `moveNext()`
 *   - mark precious:  `core.home.markPrecious()`   (records + consumes)
 *   - delete:         `core.home.deleteCurrent()`
 *   - hydrate images: `core.home.ensureVisibleImages()`
 *   - AI analysis:    `core.home.analyzeVisiblePhotos()`
 * Profile name reads from `core.home.getViewModel().profileName` (auth.user
 * derivation lives in createHomeViewModel).
 *
 * The component is now DOM-only: HTML rendering, carousel snap, and image
 * src updates. State is read from VM at render time, and a store subscriber
 * triggers re-render on `home` slice changes.
 */

const VISIBLE_COUNT = 3;

export class HomeManager {
    constructor(containerId, { core, confirmModal } = {}) {
        this.container = document.getElementById(containerId);
        this.core = core || null;
        this.confirmModal = confirmModal || null;
        this._unsubscribeStore = null;
        this._lastRenderKey = '';

        this._setupEventDelegation();

        if (this.core && this.core.store) {
            this._unsubscribeStore = this.core.store.subscribe((next) => {
                const home = next && next.home;
                if (!home) return;
                const photos = Array.isArray(home.photos) ? home.photos : [];
                const key = `${home.status || ''}|${photos.length}|${home.currentIndex || 0}|${home.headerMessage || ''}|${(home.error && home.error.message) || ''}`;
                if (key === this._lastRenderKey) return;
                this._lastRenderKey = key;
                this.render();
            });
        }
    }

    destroy() {
        if (typeof this._unsubscribeStore === 'function') {
            this._unsubscribeStore();
            this._unsubscribeStore = null;
        }
    }

    // Legacy compat: createDomApp may still call homeManager.photos / .isLoading.
    get photos() {
        if (!this.core || !this.core.home) return [];
        const vm = this.core.home.getViewModel();
        return Array.isArray(vm.photos) ? vm.photos : [];
    }

    get isLoading() {
        if (!this.core || !this.core.home) return false;
        return this.core.home.getViewModel().status === 'loading';
    }

    async loadRealPhotos() {
        if (!this.core || !this.core.home) return null;
        return this.core.home.loadDailyCuration();
    }

    async getCurrentImageAsFile() {
        if (!this.core || !this.core.home) return null;
        return this.core.home.getCurrentImageAsFile();
    }

    async getCurrentPhotoBase64() {
        if (!this.core || !this.core.home) return null;
        return this.core.home.getCurrentPhotoBase64();
    }

    async getCurrentPhotoMeta() {
        if (!this.core || !this.core.home) return {};
        return this.core.home.getCurrentPhotoMeta();
    }

    async consumePhoto(_index) {
        // Slice 5e: consume is owned by `markPrecious` / `deleteCurrent`. This
        // wrapper is preserved for legacy callers but defers to the controller's
        // current-photo consume flow if available; otherwise no-op.
        // Direct external consume is not part of the public surface anymore.
        return null;
    }

    _setupEventDelegation() {
        if (!this.container) return;
        this.container.addEventListener('click', async (e) => {
            const preciousBtn = e.target.closest('#precious-btn');
            const thanksBtn = e.target.closest('#thanks-btn');
            const retryBtn = e.target.closest('#retry-btn');
            const prevImg = e.target.closest('#img-prev');
            const nextImg = e.target.closest('#img-next');

            if (!this.core || !this.core.home) return;

            if (preciousBtn) {
                e.preventDefault();
                await this.core.home.markPrecious();
            } else if (thanksBtn) {
                e.preventDefault();
                if (this.confirmModal && typeof this.confirmModal.open === 'function') {
                    this.confirmModal.open({
                        title: '이 사진을 정말 삭제할까요?',
                        message: '삭제된 사진은 복구할 수 없습니다.',
                        confirmText: '삭제',
                        cancelText: '취소',
                        onConfirm: async () => {
                            await this.core.home.deleteCurrent();
                        }
                    });
                } else {
                    await this.core.home.deleteCurrent();
                }
            } else if (retryBtn) {
                e.preventDefault();
                await this.core.home.loadDailyCuration();
            } else if (prevImg) {
                e.preventDefault();
                this.core.home.movePrevious();
            } else if (nextImg) {
                e.preventDefault();
                this.core.home.moveNext();
            }
        });
    }

    async render() {
        if (!this.container || !this.core || !this.core.home) return;

        const vm = this.core.home.getViewModel();
        const photos = Array.isArray(vm.photos) ? vm.photos : [];
        const profileName = vm.profileName || '사용자';

        if (vm.error) {
            const errorMsg = (vm.error && vm.error.message) ? vm.error.message : '데이터를 불러오지 못했습니다.';
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
                        <p class="text-muted-lavender text-sm leading-relaxed">${this._escapeHtml(errorMsg)}</p>
                        <button id="retry-btn" class="px-6 py-3 bg-white/5 border border-white/10 rounded-3xl text-primary font-bold text-sm">다시 시도하기</button>
                    </div>
                </div>
            `;
            return;
        }

        if (vm.status === 'loading') {
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

        const visibleMax = Math.min(photos.length, VISIBLE_COUNT);
        const currentIdx = Math.min(vm.currentIndex, visibleMax - 1);
        const currentPhoto = photos[currentIdx] || {};
        const isFirst = currentIdx === 0;
        const isLast = currentIdx === visibleMax - 1;
        const prevPhoto = isFirst ? null : photos[currentIdx - 1];
        const nextPhoto = isLast ? null : photos[currentIdx + 1];
        const clearedCount = vm.progress ? vm.progress.clearedCount : Math.max(0, 7 - visibleMax);
        const targetCount = vm.progress ? vm.progress.targetCount : 7;
        const percent = vm.progress ? vm.progress.percent : Math.max(0, clearedCount * (100 / targetCount));
        const headerMessage = vm.headerMessage || '기기에서 찾아낸 비우기 좋은 기록들입니다.';

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
                                <span class="text-sm font-bold text-white">${clearedCount} / ${targetCount} 장</span>
                            </div>
                            <span id="profile-name-display" class="text-[10px] font-medium text-primary italic">${this._escapeHtml(profileName)}님, 함께 정리해요</span>
                        </div>
                        <div class="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div class="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-300 ease-in-out" style="width: ${percent}%;"></div>
                        </div>
                    </div>
                </div>

                <div class="py-4 shrink-0 px-1">
                    <h1 class="text-white text-xl font-bold leading-tight tracking-tight">
                        좋은 아침이에요.<br/>
                        <span id="curation-header-desc" class="text-muted-lavender font-normal text-sm">${this._escapeHtml(headerMessage)}</span>
                    </h1>
                </div>

                <div class="flex-1 flex flex-col justify-center min-h-0">
                    <div class="carousel-container mb-2" id="carousel-wrapper">
                        <div class="carousel-item side ${prevPhoto ? 'opacity-40' : 'opacity-0 pointer-events-none'}">
                            <div id="img-prev" class="aspect-[2/3] w-full bg-center bg-cover rounded-[24px] border border-white/10 bg-field-bg transition-all duration-300 cursor-pointer hover:opacity-60 grayscale-[50%]"
                                 style='${prevPhoto?.imageUrl ? `background-image: url("${this._escapeHtmlAttr(prevPhoto.imageUrl)}");` : ''}'>
                            </div>
                        </div>
                        <div class="carousel-item">
                            <div class="relative aspect-[2/3] w-full">
                                <div id="img-curr" class="w-full h-full bg-center bg-cover rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.4)] border border-white/10 bg-field-bg transition-all duration-300 ease-in-out"
                                     style='${currentPhoto?.imageUrl ? `background-image: url("${this._escapeHtmlAttr(currentPhoto.imageUrl)}");` : ''}'>
                                </div>
                                ${currentPhoto?.score > 20 ? '<div class="absolute top-4 right-4 bg-primary/90 text-dark-bg text-[10px] font-black px-2 py-1 rounded-full shadow-lg">HIGH DETOX</div>' : ''}
                            </div>
                        </div>
                        <div class="carousel-item side ${nextPhoto ? 'opacity-40' : 'opacity-0 pointer-events-none'}">
                            <div id="img-next" class="aspect-[2/3] w-full bg-center bg-cover rounded-[24px] border border-white/10 bg-field-bg transition-all duration-300 cursor-pointer hover:opacity-60 grayscale-[50%]"
                                 style='${nextPhoto?.imageUrl ? `background-image: url("${this._escapeHtmlAttr(nextPhoto.imageUrl)}");` : ''}'>
                            </div>
                        </div>
                    </div>

                    <div class="px-6 mx-6 shrink-0 max-w-md mx-auto w-full">
                        <div id="photo-meta-info" class="mb-5 min-h-[4rem] flex flex-col items-center justify-start transition-all duration-300">
                            <p class="text-white text-[14px] font-medium leading-relaxed text-center break-keep w-full">
                                <span id="meta-date">${this._escapeHtml(vm.meta && vm.meta.date ? vm.meta.date : '')}</span> | <span id="meta-location">${this._escapeHtml(vm.meta && vm.meta.location ? vm.meta.location : '')}</span><br/>
                                <span id="meta-context" class="text-primary text-sm font-bold block mt-1 leading-snug">${this._escapeHtml(vm.meta && vm.meta.contextMessage ? vm.meta.contextMessage : '')}</span>
                            </p>
                        </div>

                        <div class="flex gap-4 w-full pb-8">
                            <button id="thanks-btn" class="flex-1 flex flex-row items-center justify-center gap-2 h-14 px-6 rounded-3xl border border-white/10 bg-transparent active:scale-95 transition-all duration-300 ease-in-out" ${vm.controls && !vm.controls.canDelete ? 'disabled' : ''}>
                                <span class="material-symbols-outlined text-[#B2B0B5] text-xl">delete</span>
                                <span class="text-[#B2B0B5] font-semibold text-base">고마웠어</span>
                            </button>
                            <button id="precious-btn" class="flex-1 flex flex-row items-center justify-center gap-2 h-14 px-6 rounded-3xl bg-primary shadow-[0_8px_24px_rgba(178,165,207,0.3)] active:scale-95 transition-all duration-300 ease-in-out" ${vm.controls && !vm.controls.canMarkPrecious ? 'disabled' : ''}>
                                <span class="material-symbols-outlined text-dark-bg text-xl" style="font-variation-settings: 'FILL' 1">auto_awesome</span>
                                <span class="text-dark-bg font-bold text-base">소중해</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Carousel snap (DOM-only, inlined from former homeImageRuntime.js).
        requestAnimationFrame(() => {
            const wrapper = document.getElementById('carousel-wrapper');
            if (wrapper) {
                const centerItem = wrapper.children[1];
                if (centerItem) centerItem.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
                this._setupCarouselSnap(wrapper);
            }
        });

        // Trigger image hydration + AI analysis through controller.
        // Fire-and-forget; controller writes to store and store subscribe
        // triggers our re-render when relevant fields change.
        this.core.home.ensureVisibleImages().catch((err) => {
            console.error('[HomeManager] ensureVisibleImages failed:', err);
        });
        this.core.home.analyzeVisiblePhotos().catch((err) => {
            console.error('[HomeManager] analyzeVisiblePhotos failed:', err);
        });
    }

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

                if (closestVisualIdx === 1) return;
                if (!this.core || !this.core.home) return;

                if (closestVisualIdx === 0) this.core.home.movePrevious();
                else if (closestVisualIdx === 2) this.core.home.moveNext();
            }, 120);
        }, { passive: true });
    }

    _escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    _escapeHtmlAttr(s) {
        return this._escapeHtml(s);
    }
}
