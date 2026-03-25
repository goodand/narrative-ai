/**
 * ReportManager - Weekly Detox Analytics Dashboard
 * 사용자의 사진 비움 성과를 시각화하여 보여주는 리포트 화면 (고도화 버전)
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
            dailyData: [0, 0, 0, 0, 0, 0, 0], 
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
            const { data: userStats, error: userStatsError } = await supabase
                .from('user_stats')
                .select('*')
                .eq('user_id', user.id)
                .single();

            // user_stats 행이 아직 없을 수 있으므로 에러를 로그로만 남기고 기본값 유지
            if (userStatsError) {
                console.warn('[REPORT] user_stats 조회 경고:', this._normalizeError(userStatsError));
            }

            if (userStats) {
                const clearedBytes = Number(userStats.total_cleared_bytes || 0);
                const clearedCount = Number(userStats.total_cleared_count || 0);
                const gb = (clearedBytes / (1024 * 1024 * 1024)).toFixed(1);
                this.stats.totalBytesGB = gb;
                this.stats.totalCount = clearedCount.toLocaleString();
            }

            // 2. 주간 비움 데이터 분석 (최근 14일치 조회)
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
            
            const { data: logs, error: logsError } = await supabase
                .from('detox_logs')
                .select('cleared_at')
                .eq('user_id', user.id)
                .gte('cleared_at', fourteenDaysAgo.toISOString());

            if (logsError) {
                console.warn('[REPORT] detox_logs 조회 경고:', this._normalizeError(logsError));
            }

            if (logs) {
                this._analyzeWeeklyTrends(logs);
            }

        } catch (error) {
            console.error('[REPORT] 데이터 로드 실패:', this._normalizeError(error));
        }
    }

    _normalizeError(error) {
        if (!error) return 'unknown error';
        if (typeof error === 'string') return error;
        if (error.message) return error.message;
        try {
            return JSON.stringify(error);
        } catch {
            return String(error);
        }
    }

    /**
     * 최근 14일간의 로그를 분석하여 현재 주간 통계 및 변화율을 산출합니다.
     */
    _analyzeWeeklyTrends(logs) {
        const now = new Date();
        
        // 이번 주 월요일 계산 (월요일 시작 기준)
        const getMonday = (d) => {
            const date = new Date(d);
            const day = date.getDay(); // 0(일) ~ 6(토)
            const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
            const monday = new Date(date.setDate(diff));
            monday.setHours(0, 0, 0, 0);
            return monday;
        };

        const thisMonday = getMonday(now);
        const lastMonday = new Date(thisMonday);
        lastMonday.setDate(lastMonday.getDate() - 7);

        // 주차별 그룹화 (Calendar Week 기준)
        const currentWeekLogs = logs.filter(log => new Date(log.cleared_at) >= thisMonday);
        const previousWeekLogs = logs.filter(log => {
            const logDate = new Date(log.cleared_at);
            return logDate >= lastMonday && logDate < thisMonday;
        });

        // 1. 이번 주 카운트 및 그래프 데이터
        this.stats.weeklyCount = currentWeekLogs.length;
        this._processWeeklyGraphData(currentWeekLogs);

        // 2. 전주 대비 변화율 계산
        const currentCount = currentWeekLogs.length;
        const prevCount = previousWeekLogs.length;

        if (prevCount === 0) {
            this.stats.weeklyChange = currentCount > 0 ? '+100%' : '0%';
        } else {
            const changePercent = Math.round(((currentCount - prevCount) / prevCount) * 100);
            this.stats.weeklyChange = `${changePercent >= 0 ? '+' : ''}${changePercent}%`;
        }
    }

    _processWeeklyGraphData(logs) {
        const counts = [0, 0, 0, 0, 0, 0, 0];
        logs.forEach(log => {
            const date = new Date(log.cleared_at);
            let dayIdx = date.getDay() - 1; 
            if (dayIdx === -1) dayIdx = 6; // 일요일 처리
            counts[dayIdx]++;
        });
        this.stats.dailyData = counts;
    }

    /**
     * 현재 렌더링 중인 요일 인덱스가 오늘인지 확인합니다.
     * UI 순서: 0(월) ~ 6(일)
     */
    _isCurrentDay(uiIndex) {
        const day = new Date().getDay(); // 0(일) ~ 6(토)
        const todayUiIdx = (day === 0) ? 6 : day - 1;
        return todayUiIdx === uiIndex;
    }

    async render() {
        await this.loadStats();
        const profileName = this.user?.user_metadata?.full_name?.split(' ')[0] || '사용자';

        this.container.innerHTML = `
            <div class="flex flex-col h-full bg-dark-bg text-white overflow-y-auto custom-scrollbar">
                <header class="flex items-center sticky top-0 z-20 px-6 pb-4 justify-between bg-dark-bg/80 backdrop-blur-md" style="padding-top: calc(env(safe-area-inset-top) + 12px);">
                    <div class="text-primary flex size-10 items-center">
                        <span class="material-symbols-outlined text-2xl">bubbles</span>
                    </div>
                    <h2 class="text-white text-[17px] font-bold leading-tight tracking-widest uppercase font-display">recoco</h2>
                    <div class="flex w-10 items-center justify-end">
                        <button class="text-white/40"><span class="material-symbols-outlined text-2xl">more_horiz</span></button>
                    </div>
                </header>

                <div class="px-8 pt-2 pb-10">
                    <div class="mb-8">
                        <h1 class="text-white text-[22px] font-bold leading-tight">이번 주 비움 리포트</h1>
                        <p class="text-white/40 text-[13px] mt-1.5 font-medium">${profileName}님의 공간이 더 가벼워지고 있어요.</p>
                    </div>

                    <div class="bg-field-bg rounded-[28px] p-6 mb-4 border border-white/5 shadow-2xl">
                        <div class="flex justify-between items-start mb-8">
                            <div>
                                <h3 class="text-[12px] font-medium text-white/40 mb-1">지난 7일간 비운 사진</h3>
                                <div class="flex items-baseline gap-1">
                                    <span class="text-2xl font-bold text-white tracking-tight">${this.stats.weeklyCount}</span>
                                    <span class="text-xs font-semibold text-primary">장</span>
                                </div>
                            </div>
                            <div class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                                ${this.stats.weeklyChange}
                            </div>
                        </div>

                        <div class="relative w-full h-32 mb-4">
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
                                    <span class="text-[10px] ${this._isCurrentDay(i) ? 'font-bold text-primary' : 'text-white/20 font-medium'}">${d}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div class="bg-field-bg p-5 rounded-[24px] border border-white/5">
                            <div class="size-9 flex items-center justify-center rounded-xl mb-3 bg-primary/10 text-primary">
                                <span class="material-symbols-outlined text-xl">database</span>
                            </div>
                            <h4 class="text-[12px] text-white/40 font-medium">확보한 공간</h4>
                            <p class="text-[18px] font-bold mt-0.5 text-white leading-tight">
                                ${this.stats.totalBytesGB} <span class="text-xs font-semibold text-primary">GB</span>
                            </p>
                        </div>
                        <div class="bg-field-bg p-5 rounded-[24px] border border-white/5">
                            <div class="size-9 flex items-center justify-center rounded-xl mb-3 bg-primary/10 text-primary">
                                <span class="material-symbols-outlined text-xl">auto_awesome</span>
                            </div>
                            <h4 class="text-[12px] text-white/40 font-medium">정리한 추억</h4>
                            <p class="text-[18px] font-bold mt-0.5 text-white leading-tight">
                                ${this.stats.totalCount} <span class="text-xs font-semibold text-primary">개</span>
                            </p>
                        </div>
                    </div>

                    <div class="p-5 bg-field-bg rounded-[24px] border border-white/5 flex items-center gap-4">
                        <div class="size-10 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                            <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1">lightbulb</span>
                        </div>
                        <div class="flex-1">
                            <p class="text-[12px] font-bold mb-0.5 text-primary">비움 팁</p>
                            <p class="text-[13px] text-white/70 leading-snug font-medium">${this.stats.tips}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _generateSVGPath() {
        const data = this.stats.dailyData;
        const maxVal = Math.max(...data, 5);
        const points = data.map((val, i) => {
            const x = i * 50;
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
