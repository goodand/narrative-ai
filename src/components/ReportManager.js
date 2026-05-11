/**
 * ReportManager - Weekly Detox Analytics Dashboard
 * 사용자의 사진 비움 성과를 시각화하여 보여주는 리포트 화면.
 *
 * Slice 5b (Decision #1A): 데이터 로드 + 집계는 `core.report.load()` +
 * `getViewModel()`로 위임. 컴포넌트는 view model을 읽어 DOM/SVG render만 담당.
 * 시간 참조(`new Date()`)는 컴포넌트에 남기지 않으며 `todayUiIdx`는 VM에서 옴.
 */

const FALLBACK_STATS = {
    weeklyCount: 0,
    weeklyChange: '0%',
    totalBytesGB: '0.0',
    totalCount: '0',
    dailyData: [0, 0, 0, 0, 0, 0, 0],
    tips: '비움 분석을 위해 더 많은 사진을 정리해보세요!',
    todayUiIdx: -1
};

export class ReportManager {
    constructor(containerId, { core } = {}) {
        this.container = document.getElementById(containerId);
        this.core = core || null;
    }

    async render() {
        this._renderShell();
        if (this.core && this.core.report) {
            await this.core.report.load();
            this._renderShell();
        }
    }

    _readViewModel() {
        if (!this.core || !this.core.report) {
            return {
                status: 'idle',
                error: null,
                isLoading: false,
                profileName: '사용자',
                loadingText: '사용자님의 공간이 더 가벼워지고 있어요.',
                stats: { ...FALLBACK_STATS },
                controls: { canRetry: false }
            };
        }
        return this.core.report.getViewModel();
    }

    _renderShell() {
        if (!this.container) return;

        const vm = this._readViewModel();
        const stats = vm.stats || FALLBACK_STATS;
        const loadingClass = vm.isLoading ? 'animate-pulse opacity-60' : '';

        this.container.innerHTML = `
            <div class="flex flex-col h-full bg-dark-bg text-white overflow-y-auto custom-scrollbar">
                <header class="flex items-center sticky top-0 z-20 px-6 pb-4 justify-between bg-dark-bg/80 backdrop-blur-[20px]" style="padding-top: calc(env(safe-area-inset-top) + 12px);">
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
                        <p class="text-white/40 text-[13px] mt-1.5 font-medium">${vm.loadingText}</p>
                    </div>

                    <div class="bg-field-bg rounded-3xl p-6 mb-4 border border-white/5 shadow-2xl">
                        <div class="flex justify-between items-start mb-8">
                            <div>
                                <h3 class="text-[12px] font-medium text-white/40 mb-1">지난 7일간 비운 사진</h3>
                                <div class="flex items-baseline gap-1">
                                    <span class="text-2xl font-bold text-white tracking-tight ${loadingClass}">${stats.weeklyCount}</span>
                                    <span class="text-xs font-semibold text-primary">장</span>
                                </div>
                            </div>
                            <div class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary ${loadingClass}">
                                ${stats.weeklyChange}
                            </div>
                        </div>

                        <div class="relative w-full h-32 mb-4">
                            <svg class="w-full h-full" preserveAspectRatio="none" viewBox="0 0 300 100">
                                <line class="text-white/5" stroke="currentColor" stroke-width="1" x1="0" x2="300" y1="80" y2="80"></line>
                                ${this._generateSVGPath(stats.dailyData)}
                                <defs>
                                    <linearGradient id="gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                        <stop offset="0%" style="stop-color:#B2A5CF;stop-opacity:1"></stop>
                                        <stop offset="100%" style="stop-color:#B2A5CF;stop-opacity:0"></stop>
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div class="flex justify-between mt-4 px-1">
                                ${['월', '화', '수', '목', '금', '토', '일'].map((d, i) => `
                                    <span class="text-[10px] ${i === stats.todayUiIdx ? 'font-bold text-primary' : 'text-white/20 font-medium'}">${d}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div class="bg-field-bg p-5 rounded-[24px] border border-white/5">
                            <div class="size-9 flex items-center justify-center rounded-3xl mb-3 bg-primary/10 text-primary">
                                <span class="material-symbols-outlined text-xl">database</span>
                            </div>
                            <h4 class="text-[12px] text-white/40 font-medium">확보한 공간</h4>
                            <p class="text-[18px] font-bold mt-0.5 text-white leading-tight">
                                <span class="${loadingClass}">${stats.totalBytesGB}</span> <span class="text-xs font-semibold text-primary">GB</span>
                            </p>
                        </div>
                        <div class="bg-field-bg p-5 rounded-[24px] border border-white/5">
                            <div class="size-9 flex items-center justify-center rounded-3xl mb-3 bg-primary/10 text-primary">
                                <span class="material-symbols-outlined text-xl">auto_awesome</span>
                            </div>
                            <h4 class="text-[12px] text-white/40 font-medium">정리한 추억</h4>
                            <p class="text-[18px] font-bold mt-0.5 text-white leading-tight">
                                <span class="${loadingClass}">${stats.totalCount}</span> <span class="text-xs font-semibold text-primary">개</span>
                            </p>
                        </div>
                    </div>

                    <div class="p-5 bg-field-bg rounded-[24px] border border-white/5 flex items-center gap-4">
                        <div class="size-10 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                            <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1">lightbulb</span>
                        </div>
                        <div class="flex-1">
                            <p class="text-[12px] font-bold mb-0.5 text-primary">비움 팁</p>
                            <p class="text-[13px] text-white/70 leading-snug font-medium">${stats.tips}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _generateSVGPath(dailyData) {
        const data = Array.isArray(dailyData) && dailyData.length === 7
            ? dailyData
            : [0, 0, 0, 0, 0, 0, 0];
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
