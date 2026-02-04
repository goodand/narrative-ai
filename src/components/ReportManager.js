/**
 * ReportManager - Weekly Detox Analytics Dashboard
 * 사용자의 사진 비움 성과를 시각화하여 보여주는 리포트 화면
 */

import { supabase } from '../services/supabase.js';

export class ReportManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.user = null;
        this.stats = {
            weeklyCount: 0,
            weeklyChange: '0%',
            totalBytesGB: '0.0',
            totalCount: '0',
            dailyData: [0, 0, 0, 0, 0, 0, 0], // 월-일 순서
            tips: '비움 분석을 위해 더 많은 사진을 정리해보세요!'
        };
    }

    /**
     * Supabase에서 실제 통계 데이터를 로드합니다.
     */
    async loadStats() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            this.user = user;

            // 1. 전체 통계 (user_stats)
            const { data: userStats } = await supabase
                .from('user_stats')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (userStats) {
                const gb = (userStats.total_cleared_bytes / (1024 * 1024 * 1024)).toFixed(1);
                this.stats.totalBytesGB = gb;
                this.stats.totalCount = userStats.total_cleared_count.toLocaleString();
            }

            // 2. 주간 비움 데이터 (detox_logs)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const { data: logs } = await supabase
                .from('detox_logs')
                .select('cleared_at')
                .eq('user_id', user.id)
                .gte('cleared_at', sevenDaysAgo.toISOString());

            if (logs) {
                this.stats.weeklyCount = logs.length;
                this._processWeeklyGraphData(logs);
            }

        } catch (error) {
            console.error('[REPORT] 데이터 로드 실패:', error);
        }
    }

    /**
     * 로그 데이터를 요일별 개수로 변환합니다.
     */
    _processWeeklyGraphData(logs) {
        const counts = [0, 0, 0, 0, 0, 0, 0]; // 월(1)-일(0) 기준 처리가 필요할 수 있음
        const now = new Date();
        
        logs.forEach(log => {
            const date = new Date(log.cleared_at);
            // 0(일) ~ 6(토)를 우리 UI 순서(월~일)에 맞게 조정
            let dayIdx = date.getDay() - 1; 
            if (dayIdx === -1) dayIdx = 6; // 일요일
            counts[dayIdx]++;
        });
        
        this.stats.dailyData = counts;
    }

    /**
     * Render the Report Dashboard
     */
    async render() {
        // 렌더링 전 데이터 로드
        await this.loadStats();

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

                        <!-- Mini Chart (SVG) - dailyData 반영 -->
                        <div class="relative w-full h-36 mb-6">
                            <svg class="w-full h-full" preserveAspectRatio="none" viewBox="0 0 300 100">
                                <line class="text-white/5" stroke="currentColor" stroke-width="1" x1="0" x2="300" y1="80" y2="80"></line>
                                ${this._generateSVGPath()}
                                <defs>
                                    <linearGradient id="gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                        <stop offset="0%" style="stop-color:#B2A5CF;stop-opacity:1"></stop>
                                        <stop offset="100%" style="stop-color:#B2A5CF;stop-opacity:0"></stop>
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div class="flex justify-between mt-4 px-1">
                                ${['월', '화', '수', '목', '금', '토', '일'].map((d, i) => `
                                    <span class="text-[11px] ${new Date().getDay()-1 === i ? 'font-bold text-primary' : 'text-white/20 font-medium'}">${d}</span>
                                `).join('')}
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

    /**
     * dailyData를 기반으로 SVG Path를 동적으로 생성합니다.
     */
    _generateSVGPath() {
        const data = this.stats.dailyData;
        const maxVal = Math.max(...data, 5); // 최소 기준점 5
        const points = data.map((val, i) => {
            const x = i * 50; // 300 / 6
            const y = 80 - (val / maxVal * 60);
            return `${x},${y}`;
        });

        const d = `M${points.join(' L')}`;
        return `
            <path d="${d}" fill="none" stroke="#B2A5CF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
            <path class="opacity-10" d="${d} V100 H0 Z" fill="url(#gradient)"></path>
        `;
    }
}