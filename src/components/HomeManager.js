/**
 * HomeManager - Daily Curation Dashboard
 * 리코코 메인 데일리 큐레이션 화면 (최적화 버전)
 */

import { supabase } from '../services/supabase.js';
import RecocolPhotos from '../plugins/RecocolPhotos.ts';
import { geocodingService } from '../services/GeocodingService.js';

export class HomeManager {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.onPreciousClick = options.onPreciousClick || null;
        this.onThanksClick = options.onThanksClick || null;
        this.user = null;

        this.curationPhotos = [];
        this.currentIndex = 0;
        this.isLoading = false;
        this.error = null;
        
        this._setupEventDelegation();
    }

    /**
     * 실제 사진 목록 로드 및 역지오코딩 (캐싱 활용)
     */
    async loadRealPhotos() {
        this.isLoading = true;
        this.error = null;
        this.render();

        try {
            const { photos } = await RecocolPhotos.fetchPhotos({ limit: 10, offset: 0 });
            
            if (photos && photos.length > 0) {
                this.curationPhotos = await Promise.all(photos.map(async (asset) => {
                    const { base64 } = await RecocolPhotos.loadImageData({ 
                        assetId: asset.id, 
                        quality: 'thumbnail' 
                    });
                    
                    // GeocodingService 캐싱 로직 활용
                    let locationLabel = '위치 정보 없음';
                    if (asset.location) {
                        locationLabel = await geocodingService.getAddress(
                            asset.location.latitude, 
                            asset.location.longitude
                        );
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
            console.error('HomeManager: 사진 로드 실패', error);
            this.error = 'iOS 사진첩에 접근할 수 없습니다. 권한을 확인해주세요.';
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    /**
     * 현재 선택된 사진을 File 객체로 변환 (아키텍처 준수)
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
                formatted: photo.location
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
                await this._handleDelete();
            } else if (retryBtn) {
                this.loadRealPhotos();
            }
        });
    }

    /**
     * 사진 삭제 처리 (UX 최적화: 로컬 상태 우선 업데이트)
     */
    async _handleDelete() {
        const current = this.curationPhotos[this.currentIndex];
        if (!current) return;

        if (!confirm('이 사진을 사진첩에서 삭제하시겠습니까?')) return;

        try {
            const { success } = await RecocolPhotos.deletePhoto({ assetId: current.id });
            if (success) {
                // 1. 로컬 배열에서 즉시 제거 (전체 리로드 방지)
                this.curationPhotos.splice(this.currentIndex, 1);
                
                // 2. 인덱스 조정
                if (this.currentIndex >= this.curationPhotos.length) {
                    this.currentIndex = Math.max(0, this.curationPhotos.length - 1);
                }
                
                // 3. UI 갱신 (Toast 대신 간단한 피드백 후 렌더링)
                console.log('HomeManager: 사진 삭제 성공 및 로컬 상태 갱신');
                this.render();
            }
        } catch (err) {
            console.error('삭제 실패:', err);
            alert('사진 삭제 중 오류가 발생했습니다.');
        }
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
                    <p class="text-muted-lavender text-xs">오늘의 기억을 찾는 중...</p>
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
                                <span class="text-sm font-bold text-white">${10 - this.curationPhotos.length} / 10 장</span>
                            </div>
                            <span class="text-[10px] font-medium text-primary italic">${profileName}님, 함께 정리해요</span>
                        </div>
                        <div class="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div class="absolute top-0 left-0 h-full bg-primary rounded-full transition-all" style="width: ${(10 - this.curationPhotos.length) * 10}%;"></div>
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
                                 style='background-image: url("${this.curationPhotos[prevIdx]?.imageUrl || ''}"); filter: grayscale(50%);'>
                            </div>
                        </div>
                        <div class="carousel-item">
                            <div class="relative aspect-[4/5] w-full">
                                <div class="w-full h-full bg-center bg-cover rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10" 
                                     style='background-image: url("${currentPhoto?.imageUrl || ''}");'>
                                </div>
                            </div>
                        </div>
                        <div class="carousel-item side opacity-40">
                            <div class="aspect-[4/5] w-full bg-center bg-cover rounded-[24px] border border-white/10" 
                                 style='background-image: url("${this.curationPhotos[nextIdx]?.imageUrl || ''}"); filter: grayscale(50%);'>
                            </div>
                        </div>
                    </div>

                    <div class="px-8 shrink-0">
                        <div class="mb-6">
                            <p class="text-white text-[14px] font-medium leading-relaxed text-center break-keep">
                                ${currentPhoto?.date || ''} | ${currentPhoto?.location || ''}<br/>
                                <span class="text-white/60 text-xs">${currentPhoto?.contextMessage || ''}</span>
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
