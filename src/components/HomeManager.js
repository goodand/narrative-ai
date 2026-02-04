/**
 * HomeManager - Main Dashboard Component
 * 홈 화면 대시보드 및 소중해/고마웠어 버튼 관리
 */

import { supabase } from '../services/supabase.js';

export class HomeManager {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.onPreciousClick = options.onPreciousClick || null;
        this.onThanksClick = options.onThanksClick || null;
        this.user = null;
    }

    /**
     * Render the Home Dashboard
     */
    async render() {
        const { data: { user } } = await supabase.auth.getUser();
        this.user = user;

        const profileName = user?.user_metadata?.full_name || '사용자';
        const profileImg = user?.user_metadata?.avatar_url || 'https://lh3.googleusercontent.com/a/default-user';

        this.container.innerHTML = `
            <!-- Top Profile Section -->
            <div class="flex flex-col items-center py-8 gap-4">
                <div class="relative">
                    <div class="bg-field-bg p-1.5 rounded-full border border-primary/20 shadow-lg">
                        <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-24 h-24 bg-[#2A2635]" 
                             style='background-image: url("${profileImg}");'>
                        </div>
                    </div>
                </div>
                <div class="text-center">
                    <p class="text-xl font-bold tracking-tight text-white">${profileName}님, 반가워요!</p>
                    <p class="text-muted-lavender text-xs mt-1">오늘의 기록을 정리해볼까요?</p>
                </div>
            </div>

            <!-- Digital Detox Stats Card -->
            <div class="mb-10">
                <h3 class="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em] mb-3 ml-1">이번 달 디지털 비움</h3>
                <div class="bg-field-bg rounded-[24px] p-6 border border-white/5 flex items-center justify-between shadow-xl">
                    <div class="flex flex-col gap-2">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">auto_delete</span>
                            <p class="text-xl font-extrabold text-white leading-none">1.2GB 비워냈어요</p>
                        </div>
                        <div class="flex items-center gap-2 mt-1">
                            <div class="h-1.5 w-32 bg-zinc-800 rounded-full overflow-hidden">
                                <div class="h-full bg-primary w-[70%]"></div>
                            </div>
                            <p class="text-primary text-xs font-bold">70%</p>
                        </div>
                    </div>
                    <div class="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary text-2xl" style="font-variation-settings: 'FILL' 1;">cloud_done</span>
                    </div>
                </div>
            </div>

            <!-- Main Action Buttons (Core UX) -->
            <div class="grid grid-cols-2 gap-4 mb-12">
                <button id="thanks-btn" class="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/10 transition-all active:scale-95 group">
                    <div class="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4 group-hover:bg-zinc-700 transition-colors">
                        <span class="material-symbols-outlined text-3xl text-white/40">delete_sweep</span>
                    </div>
                    <span class="text-lg font-bold text-white">고마웠어</span>
                    <span class="text-[10px] text-muted-lavender mt-1">사진 비우기</span>
                </button>

                <button id="precious-btn" class="flex flex-col items-center justify-center p-8 bg-primary rounded-[2.5rem] shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95 group">
                    <div class="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                        <span class="material-symbols-outlined text-3xl text-dark-bg" style="font-variation-settings: 'FILL' 1">auto_awesome</span>
                    </div>
                    <span class="text-lg font-bold text-dark-bg">소중해</span>
                    <span class="text-[10px] text-dark-bg/60 mt-1">기억 기록하기</span>
                </button>
            </div>

            <!-- Extra Settings (from my_page design) -->
            <div class="space-y-3 opacity-60">
                <div class="flex items-center justify-between p-5 bg-field-bg/50 rounded-2xl border border-white/5">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-muted-lavender">notifications</span>
                        <span class="text-sm font-medium text-white">알림 및 목표 설정</span>
                    </div>
                    <span class="material-symbols-outlined text-muted-lavender/40">chevron_right</span>
                </div>
            </div>
        `;

        this._bindEvents();
    }

    _bindEvents() {
        const preciousBtn = document.getElementById('precious-btn');
        const thanksBtn = document.getElementById('thanks-btn');

        if (preciousBtn) {
            preciousBtn.onclick = () => {
                if (this.onPreciousClick) this.onPreciousClick();
            };
        }

        if (thanksBtn) {
            thanksBtn.onclick = () => {
                if (this.onThanksClick) this.onThanksClick();
            };
        }
    }
}
