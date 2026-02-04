/**
 * ReportManager - Weekly Detox Analytics Dashboard
 * 사용자의 사진 비움 성과를 시각화하여 보여주는 리포트 화면
 */

import { supabase } from '../services/supabase.js';

export class ReportManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.user = null;
        
        // 정적 기본 데이터 (추후 Supabase 연동 예정)
        this.stats = {
            weeklyCount: 128,
            weeklyChange: '+12%',
            totalBytesGB: '2.4',
            totalCount: '1,240',
            tips: '비슷한 풍경 사진이 12장 더 있어요. 지금 정리해볼까요?'
        };
    }

    /**
     * Render the Report Dashboard
     */
    async render() {
        if (!this.user) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                this.user = user;
            } catch (e) {}
        }

        const profileName = this.user?.user_metadata?.full_name?.split(' ')[0] || '사용자';

        this.container.innerHTML = `
            <div class="flex flex-col h-full bg-dark-bg text-white overflow-y-auto custom-scrollbar">
                <!-- Header -->
                <header class="flex items-center sticky top-0 z-20 px-6 py-4 justify-between bg-dark-bg/80 backdrop-blur-md">
                    <div class="text-primary flex size-10 items-center">
                        <span class="material-symbols-outlined text-2xl">bubbles</span>
                    </div>
                    <h2 class="text-white text-[17px] font-bold leading-tight tracking-widest uppercase font-display">recoco</h2>
                    <div class="flex w-10 items-center justify-end">
                        <button class="text-white/40"><span class="material-symbols-outlined text-2xl">more_horiz</span></button>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="px-6 pt-2 pb-32">
                    <div class="mb-8">
                        <h1 class="text-white text-[24px] font-bold leading-tight">이번 주 비움 리포트</h1>
                        <p class="text-white/40 text-[14px] mt-1.5 font-medium">${profileName}님의 공간이 더 가벼워지고 있어요.</p>
                    </div>

                    <!-- Weekly Chart Card -->
                    <div class="bg-field-bg rounded-[28px] p-6 mb-4 border border-white/5 shadow-2xl">
                        <div class="flex justify-between items-start mb-10">
                            <div>
                                <h3 class="text-[13px] font-medium text-white/40 mb-1">지난 7일간 비운 사진</h3>
                                <div class="flex items-baseline gap-1">
                                    <span class="text-3xl font-bold text-white tracking-tight">${this.stats.weeklyCount}</span>
                                    <span class="text-sm font-semibold text-primary">장</span>
                                </div>
                            </div>
                            <div class="px-3 py-1 rounded-full text-[12px] font-bold bg-primary/10 text-primary">
                                ${this.stats.weeklyChange}
                            </div>
                        </div>

                        <!-- Mini Chart (SVG) -->
                        <div class="relative w-full h-36 mb-6">
                            <svg class="w-full h-full" preserveAspectRatio="none" viewBox="0 0 300 100">
                                <line class="text-white/5" stroke="currentColor" stroke-width="1" x1="0" x2="300" y1="80" y2="80"></line>
                                <path d="M0,80 Q30,75 50,60 T100,65 T150,40 T200,45 T250,20 T300,30" fill="none" stroke="#B2A5CF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
                                <path class="opacity-10" d="M0,80 Q30,75 50,60 T100,65 T150,40 T200,45 T250,20 T300,30 V100 H0 Z" fill="url(#gradient)"></path>
                                <defs>
                                    <linearGradient id="gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                        <stop offset="0%" style="stop-color:#B2A5CF;stop-opacity:1"></stop>
                                        <stop offset="100%" style="stop-color:#B2A5CF;stop-opacity:0"></stop>
                                    </linearGradient>
                                </defs>
                                <circle cx="250" cy="20" fill="#B2A5CF" r="4"></circle>
                                <circle cx="250" cy="20" fill="#1E1E1E" r="1.5"></circle>
                            </svg>
                            <div class="flex justify-between mt-4 px-1">
                                <span class="text-[11px] text-white/20 font-medium">월</span>
                                <span class="text-[11px] text-white/20 font-medium">화</span>
                                <span class="text-[11px] text-white/20 font-medium">수</span>
                                <span class="text-[11px] text-white/20 font-medium">목</span>
                                <span class="text-[11px] font-bold text-primary">금</span>
                                <span class="text-[11px] text-white/20 font-medium">토</span>
                                <span class="text-[11px] text-white/20 font-medium">일</span>
                            </div>
                        </div>
                    </div>

                    <!-- Summary Grid -->
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="bg-field-bg p-5 rounded-[28px] border border-white/5">
                            <div class="size-10 flex items-center justify-center rounded-2xl mb-4 bg-primary/10 text-primary">
                                <span class="material-symbols-outlined">database</span>
                            </div>
                            <h4 class="text-[13px] text-white/40 font-medium">확보한 저장 공간</h4>
                            <p class="text-[22px] font-bold mt-1 text-white leading-tight">
                                ${this.stats.totalBytesGB} <span class="text-xs font-semibold text-primary">GB</span>
                            </p>
                        </div>
                        <div class="bg-field-bg p-5 rounded-[28px] border border-white/5">
                            <div class="size-10 flex items-center justify-center rounded-2xl mb-4 bg-primary/10 text-primary">
                                <span class="material-symbols-outlined">auto_awesome</span>
                            </div>
                            <h4 class="text-[13px] text-white/40 font-medium">정리한 추억</h4>
                            <p class="text-[22px] font-bold mt-1 text-white leading-tight">
                                ${this.stats.totalCount} <span class="text-xs font-semibold text-primary">개</span>
                            </p>
                        </div>
                    </div>

                    <!-- Insight Tip -->
                    <div class="p-5 bg-field-bg rounded-[28px] border border-white/5 flex items-center gap-4">
                        <div class="size-12 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                            <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1">lightbulb</span>
                        </div>
                        <div class="flex-1">
                            <p class="text-[13px] font-bold mb-0.5 text-primary">비움 팁</p>
                            <p class="text-[14px] text-white/70 leading-snug font-medium">${this.stats.tips}</p>
                        </div>
                        <span class="material-symbols-outlined text-white/20">chevron_right</span>
                    </div>
                </main>
            </div>
        `;
    }
}
