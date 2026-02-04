/**
 * HomeManager - Daily Curation Dashboard
 * 리코코 메인 데일리 큐레이션 화면 (실제 기기 사진 연동 및 역지오코딩)
 */

import { supabase } from '../services/supabase.js';
import RecocolPhotos from '../plugins/RecocolPhotos.ts';
import { GeminiService } from '../services/GeminiService.js';

export class HomeManager {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.onPreciousClick = options.onPreciousClick || null;
        this.onThanksClick = options.onThanksClick || null;
        this.user = null;
        this.geminiService = new GeminiService();

        this.curationPhotos = [];
        this.currentIndex = 0;
        this.isLoading = false;
        this.error = null;
        
        this._setupEventDelegation();
    }

    /**
     * 네이티브 플러그인을 통해 실제 사진 목록을 로드하고 주소로 변환합니다.
     */
    async loadRealPhotos() {
        this.isLoading = true;
        this.error = null;
        this.render();

        try {
            console.log('HomeManager: 실제 사진 목록 요청 중...');
            const { photos } = await RecocolPhotos.fetchPhotos({ limit: 10, offset: 0 });
            
            if (photos && photos.length > 0) {
                this.curationPhotos = await Promise.all(photos.map(async (asset) => {
                    const { base64 } = await RecocolPhotos.loadImageData({ 
                        assetId: asset.id, 
                        quality: 'thumbnail' 
                    });
                    
                    // 실제 주소 변환 수행 (백엔드 API 활용)
                    let locationLabel = '위치 정보 없음';
                    if (asset.location) {
                        try {
                            locationLabel = await this.geminiService.getAddress(
                                asset.location.latitude, 
                                asset.location.longitude
                            );
                        } catch (e) {
                            console.warn('주소 변환 실패:', e);
                            locationLabel = '위치 확인 불가';
                        }
                    }
                    
                    return {
                        id: asset.id,
                        imageUrl: `data:image/jpeg;base64,${base64}`,
                        date: asset.creationDate.split('T')[0],
                        location: locationLabel,
                        contextMessage: '이 순간을 기억하시나요? 당신의 소중한 기록 한 장입니다.',
                        rawAsset: asset
                    };
                }));
                this.currentIndex = Math.min(1, this.curationPhotos.length - 1);
            } else {
                this.error = '사진첩에 분석할 수 있는 사진이 없습니다.';
            }
        } catch (error) {
            console.error('HomeManager: 네이티브 사진 로드 실패', error);
            this.error = 'iOS 사진첩에 접근할 수 없습니다. 설정에서 권한을 확인해주세요.';
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    /**
     * 현재 선택된 사진을 File 객체로 변환하여 반환합니다.
     */
    async getCurrentImageAsFile() {
        const photo = this.curationPhotos[this.currentIndex];
        if (!photo) return null;

        try {
            const { base64 } = await RecocolPhotos.loadImageData({ 
                assetId: photo.id, 
                quality: 'original' 
            });
            
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            
            return new File([blob], `photo_${photo.id}.jpg`, { type: 'image/jpeg' });
        } catch (error) {
            console.error('HomeManager: 원본 파일 변환 실패', error);
            return null;
        }
    }

    /**
     * 현재 선택된 사진의 메타데이터를 반환합니다.
     */
    getCurrentPhotoMeta() {
        const photo = this.curationPhotos[this.currentIndex];
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
                formatted: photo.location // 변환된 주소 주입
            } : null,
            _isNative: true
        };
    }

    _setupEventDelegation() {
        if (!this.container) return;
        this.container.addEventListener('click', async (e) => {
            const preciousBtn = e.target.closest('#precious-btn');
            const thanksBtn = e.target.closest('#thanks-btn');
            const retryBtn = e.target.closest('#retry-btn');

            if (preciousBtn) {
                e.preventDefault();
                if (this.onPreciousClick) await this.onPreciousClick();
            } else if (thanksBtn) {
                e.preventDefault();
                const current = this.curationPhotos[this.currentIndex];
                if (confirm('이 사진을 사진첩에서 삭제하시겠습니까?')) {
                    try {
                        const { success } = await RecocolPhotos.deletePhoto({ assetId: current.id });
                        if (success) {
                            alert('사진이 삭제되었습니다.');
                            this.loadRealPhotos();
                        }
                    } catch (err) {
                        console.error('삭제 실패:', err);
                        alert('사진 삭제 중 오류가 발생했습니다.');
                    }
                }
            } else if (retryBtn) {
                this.loadRealPhotos();
            }
        });
    }

    async render() {
        if (!this.user) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                this.user = user;
            } catch (e) {}
        }

        const profileName = this.user?.user_metadata?.full_name || '사용자';

        if (this.error) {
            this.container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full px-10 text-center space-y-6">
                    <span class="material-symbols-outlined text-6xl text-muted-lavender/30">no_photography</span>
                    <p class="text-muted-lavender text-sm leading-relaxed">${this.error}</p>
                    <button id="retry-btn" class="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-primary font-bold text-sm">다시 시도하기</button>
                </div>
            `;
            return;
        }

        if (this.isLoading) {
            this.container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full space-y-4">
                    <div class="loader"></div>
                    <p class="text-muted-lavender text-xs">오늘의 기억을 기기에서 찾는 중...</p>
                </div>
            `;
            return;
        }
        
        if (this.curationPhotos.length === 0) {
            this.loadRealPhotos();
            return;
        }

        const currentPhoto = this.curationPhotos[this.currentIndex];
        const prevIdx = (this.currentIndex - 1 + this.curationPhotos.length) % this.curationPhotos.length;
        const nextIdx = (this.currentIndex + 1) % this.curationPhotos.length;

        this.container.innerHTML = `
            <div class="flex flex-col h-full overflow-hidden">
                <div class="py-1 shrink-0">
                    <div class="bg-field-bg rounded-2xl p-4 border border-white/5 shadow-2xl">
                        <div class="flex justify-between items-center mb-2">
                            <div class="flex flex-col">
                                <span class="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-lavender">오늘의 비움 목표</span>
                                <span class="text-sm font-bold text-white">0 / 10 장</span>
                            </div>
                            <span class="text-[10px] font-medium text-primary italic">${profileName}님, 함께 정리해요</span>
                        </div>
                        <div class="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div class="absolute top-0 left-0 h-full bg-primary rounded-full" style="width: 5%;"></div>
                        </div>
                    </div>
                </div>

                <div class="py-4 shrink-0 px-1">
                    <h1 class="text-white text-xl font-bold leading-tight tracking-tight">
                        좋은 아침이에요.<br/>
                        <span class="text-muted-lavender font-normal text-sm">기기에서 찾아낸 오늘의 기억입니다.</span>
                    </h1>
                </div>

                <div class="flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
                    <div class="carousel-container mb-4">
                        <div class="carousel-item side opacity-40">
                            <div class="aspect-[4/5] w-full bg-center bg-cover rounded-[24px] border border-white/10" 
                                 style='background-image: url("${this.curationPhotos[prevIdx].imageUrl}"); filter: grayscale(50%);'>
                            </div>
                        </div>
                        <div class="carousel-item">
                            <div class="relative aspect-[4/5] w-full">
                                <div class="w-full h-full bg-center bg-cover rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10" 
                                     style='background-image: url("${this.curationPhotos[this.currentIndex].imageUrl}");'>
                                </div>
                            </div>
                        </div>
                        <div class="carousel-item side opacity-40">
                            <div class="aspect-[4/5] w-full bg-center bg-cover rounded-[24px] border border-white/10" 
                                 style='background-image: url("${this.curationPhotos[nextIdx].imageUrl}"); filter: grayscale(50%);'>
                            </div>
                        </div>
                    </div>

                    <div class="px-8 shrink-0">
                        <div class="mb-6">
                            <p class="text-white text-[14px] font-medium leading-relaxed text-center break-keep">
                                ${currentPhoto.date} | ${currentPhoto.location}<br/>
                                <span class="text-white/60 text-xs">${currentPhoto.contextMessage}</span>
                            </p>
                        </div>

                        <div class="flex gap-4 w-full pb-8">
                            <button id="thanks-btn" class="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl border border-primary/30 bg-field-bg active:scale-95 transition-all">
                                <span class="material-symbols-outlined text-primary text-xl">delete</span>
                                <span class="text-primary font-bold text-[13px]">고마웠어</span>
                            </button>
                            <button id="precious-btn" class="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl bg-primary shadow-lg shadow-primary/20 active:scale-95 transition-all">
                                <span class="material-symbols-outlined text-white text-xl" style="font-variation-settings: 'FILL' 1">auto_awesome</span>
                                <span class="text-white font-bold text-[13px]">소중해</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}