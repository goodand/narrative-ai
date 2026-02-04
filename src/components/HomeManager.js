/**
 * HomeManager - Daily Curation Dashboard
 * 리코코 메인 데일리 큐레이션 화면 (캐러셀 뷰)
 */

import { supabase } from '../services/supabase.js';

export class HomeManager {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.onPreciousClick = options.onPreciousClick || null;
        this.onThanksClick = options.onThanksClick || null;
        this.user = null;

        // 큐레이션 사진 데이터
        this.curationPhotos = [
            {
                id: 1,
                imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=800',
                date: '2025-01-15',
                location: '제주도 서귀포시',
                contextMessage: '벌써 1년 전이네요! 이 풍경, 여전히 당신을 설레게 하나요?'
            },
            {
                id: 2,
                imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800',
                date: '2024-08-22',
                location: '강원도 속초시',
                contextMessage: '이 순간을 기억하시나요? 그때의 감정이 떠오르나요?'
            },
            {
                id: 3,
                imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800',
                date: '2024-05-10',
                location: '서울 북한산',
                contextMessage: '자연 속에서의 시간, 소중하게 간직하고 싶은 순간이네요.'
            }
        ];

        this.currentIndex = 1; 
        this._setupEventDelegation();
    }

    /**
     * 현재 선택된 사진을 File 객체로 변환하여 반환합니다. (아키텍처 요구사항)
     */
    async getCurrentImageAsFile() {
        const photo = this.curationPhotos[this.currentIndex];
        try {
            console.log('HomeManager: 이미지를 파일 객체로 변환 중...', photo.imageUrl);
            const response = await fetch(photo.imageUrl);
            const blob = await response.blob();
            return new File([blob], `curation_${photo.id}.jpg`, { type: blob.type });
        } catch (error) {
            console.error('HomeManager: 이미지 파일 변환 실패', error);
            return null;
        }
    }

    /**
     * 현재 선택된 사진의 큐레이션 메타데이터를 반환합니다.
     */
    getCurrentPhotoMeta() {
        const photo = this.curationPhotos[this.currentIndex];
        return {
            Make: "Recoco Curation",
            Model: "Daily Moments",
            DateTime: photo.date,
            Location: photo.location,
            _isCuration: true
        };
    }

    _setupEventDelegation() {
        if (!this.container) return;
        
        this.container.addEventListener('click', async (e) => {
            const preciousBtn = e.target.closest('#precious-btn');
            const thanksBtn = e.target.closest('#thanks-btn');

            if (preciousBtn) {
                e.preventDefault();
                console.log('HomeManager: "소중해" 버튼 클릭됨');
                if (this.onPreciousClick) {
                    await this.onPreciousClick();
                }
            } else if (thanksBtn) {
                e.preventDefault();
                if (this.onThanksClick) {
                    this.onThanksClick(this.curationPhotos[this.currentIndex]);
                }
            }
        });
    }

    async render() {
        if (!this.user) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                this.user = user;
            } catch (e) {
                console.warn('HomeManager: 사용자 정보 로드 실패');
            }
        }

        const profileName = this.user?.user_metadata?.full_name || '사용자';
        const currentPhoto = this.curationPhotos[this.currentIndex];
        
        this.container.innerHTML = `
            <div class="flex flex-col h-full overflow-hidden">
                <!-- Progress Header -->
                <div class="py-1 shrink-0">
                    <div class="bg-field-bg rounded-2xl p-4 border border-white/5 shadow-2xl">
                        <div class="flex justify-between items-center mb-2">
                            <div class="flex flex-col">
                                <span class="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-lavender">오늘의 목표</span>
                                <span class="text-sm font-bold text-white">3 / 10 장 비우기</span>
                            </div>
                            <span class="text-[10px] font-medium text-primary italic">거의 다 왔어요, ${profileName}님</span>
                        </div>
                        <div class="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div class="absolute top-0 left-0 h-full bg-primary rounded-full" style="width: 30%;"></div>
                        </div>
                    </div>
                </div>

                <!-- Greeting -->
                <div class="py-4 shrink-0 px-1">
                    <h1 class="text-white text-xl font-bold leading-tight tracking-tight">
                        좋은 아침이에요, ${profileName}님.<br/>
                        <span class="text-muted-lavender font-normal text-sm">오늘의 기억 한 조각입니다.</span>
                    </h1>
                </div>

                <!-- Carousel Section -->
                <div class="flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
                    <div class="carousel-container mb-4">
                        <div class="carousel-item side opacity-40">
                            <div class="aspect-[4/5] w-full bg-center bg-cover rounded-[24px] border border-white/10" 
                                 style='background-image: url("${this.curationPhotos[0].imageUrl}"); filter: grayscale(50%);'>
                            </div>
                        </div>
                        <div class="carousel-item">
                            <div class="relative aspect-[4/5] w-full">
                                <div class="w-full h-full bg-center bg-cover rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10" 
                                     style='background-image: url("${this.curationPhotos[1].imageUrl}");'>
                                </div>
                            </div>
                        </div>
                        <div class="carousel-item side opacity-40">
                            <div class="aspect-[4/5] w-full bg-center bg-cover rounded-[24px] border border-white/10" 
                                 style='background-image: url("${this.curationPhotos[2].imageUrl}"); filter: grayscale(50%);'>
                            </div>
                        </div>
                    </div>

                    <!-- Paging Dots -->
                    <div class="flex justify-center gap-1.5 mb-6">
                        <div class="h-1.5 w-1.5 rounded-full bg-white/20"></div>
                        <div class="h-1.5 w-4 rounded-full bg-primary"></div>
                        <div class="h-1.5 w-1.5 rounded-full bg-white/20"></div>
                        <div class="h-1.5 w-1.5 rounded-full bg-white/20"></div>
                    </div>

                    <!-- Context Text -->
                    <div class="px-8 shrink-0">
                        <div class="mb-6">
                            <p class="text-white text-[14px] font-medium leading-relaxed text-center break-keep">
                                ${currentPhoto.contextMessage.replace('\n', '<br/>')}
                            </p>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex gap-4 w-full pb-8">
                            <button id="thanks-btn" class="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl border border-primary/30 bg-field-bg active:scale-95 transition-all">
                                <span class="material-symbols-outlined text-primary text-xl">delete</span>
                                <div class="flex flex-col items-center">
                                    <span class="text-primary font-bold text-[13px]">고마웠어</span>
                                    <span class="text-primary/60 text-[10px]">(삭제하기)</span>
                                </div>
                            </button>
                            <button id="precious-btn" class="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl bg-primary shadow-lg shadow-primary/20 active:scale-95 transition-all">
                                <span class="material-symbols-outlined text-white text-xl" style="font-variation-settings: 'FILL' 1">auto_awesome</span>
                                <div class="flex flex-col items-center">
                                    <span class="text-white font-bold text-[13px]">소중해</span>
                                    <span class="text-white/80 text-[10px]">(공유하기)</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
