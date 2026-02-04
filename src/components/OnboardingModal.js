/**
 * OnboardingModal - Multi-step onboarding experience
 * 온보딩 과정을 단계별로 보여주는 모달
 */

import { Modal } from './Modal.js';

export class OnboardingModal extends Modal {
    constructor(element) {
        super(element);
        this.currentStep = 1;
        this.totalSteps = 4;
        
        this.contentElement = this.element.querySelector('#onboarding-content');
        this.setupEventListeners();
    }

    /**
     * Override open to start from step 1
     */
    open() {
        this.currentStep = 1;
        this.renderStep();
        super.open();
    }

    /**
     * Render the current step content
     */
    renderStep() {
        if (!this.contentElement) return;

        let html = '';
        switch (this.currentStep) {
            case 1:
                html = this._getStep1HTML();
                break;
            case 2:
                html = this._getStep2HTML();
                break;
            case 3:
                html = this._getStep3HTML();
                break;
            case 4:
                html = this._getStep4HTML();
                break;
        }

        this.contentElement.innerHTML = html;
        this._bindStepEvents();
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.renderStep();
        } else {
            this.close();
        }
    }

    skip() {
        this.close();
    }

    /**
     * Override to prevent closing when clicking outside (backdrop)
     * 온보딩은 필수 과정이므로 배경 클릭 시 닫히지 않도록 설정
     */
    _setupCloseOnOutsideClick() {
        // Do nothing
    }

    setupEventListeners() {
        // Modal class handles backdrop clicks
    }

    _bindStepEvents() {
        const nextBtn = this.element.querySelector('#onboarding-next');
        const skipBtn = this.element.querySelector('#onboarding-skip');
        const startBtn = this.element.querySelector('#onboarding-start');
        const allowBtn = this.element.querySelector('#onboarding-allow');

        if (nextBtn) nextBtn.onclick = () => this.nextStep();
        if (skipBtn) skipBtn.onclick = () => this.skip();
        if (startBtn) startBtn.onclick = () => this.nextStep();
        if (allowBtn) allowBtn.onclick = () => this.close();
    }

    _getStep1HTML() {
        return `
            <div class="flex flex-col justify-between py-10 px-8 text-center">
                <header class="flex justify-end h-6 mb-2">
                    <button id="onboarding-skip" class="text-white/40 text-sm font-medium">Skip</button>
                </header>
                <main class="flex flex-col items-center justify-center mb-8">
                    <div class="relative w-full max-w-[180px] aspect-square flex flex-col items-center justify-center mb-8">
                        <div class="relative z-10 mb-[-15px]">
                            <span class="material-symbols-outlined text-[80px] text-primary leading-none" style="font-variation-settings: 'FILL' 1">
                                water_lux
                            </span>
                        </div>
                        <div class="wave-container" style="height: 60px;">
                            <div class="wave"></div>
                        </div>
                    </div>
                    <h1 class="text-2xl font-bold leading-tight mb-4 whitespace-pre-line">
                        비움으로 선명해지는
당신의 기록
                    </h1>
                    <p class="text-muted-lavender text-sm leading-relaxed whitespace-pre-line">
                        매일 아침 도착하는 사진 한 장으로
디지털 다이어트를 시작해보세요.
                    </p>
                </main>
                <footer class="flex flex-col items-center gap-6">
                    <div class="flex gap-2">
                        <div class="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <div class="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                        <div class="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                        <div class="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                    </div>
                    <button id="onboarding-next" class="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-base active:scale-[0.98] transition-all">
                        다음
                    </button>
                </footer>
            </div>
        `;
    }

    _getStep2HTML() {
        return `
            <div class="flex flex-col justify-between py-10 px-8 text-center">
                <header class="flex justify-end h-6 mb-2">
                    <button id="onboarding-skip" class="text-white/40 text-sm font-medium">Skip</button>
                </header>
                <main class="flex flex-col items-center justify-center mb-8">
                    <div class="relative w-full max-w-[180px] aspect-square flex items-center justify-center mb-8">
                        <div class="photo-stack" style="width: 140px; height: 170px;">
                            <div class="photo-card" style="width: 110px; height: 140px;"></div>
                            <div class="photo-card" style="width: 110px; height: 140px;"></div>
                            <div class="photo-card flex flex-col gap-2 p-4" style="width: 110px; height: 140px;">
                                <div class="w-12 h-1 bg-primary/20 rounded-full"></div>
                                <div class="w-8 h-1 bg-primary/20 rounded-full"></div>
                            </div>
                            <div class="floating-icon top-0 -right-2 text-primary" style="width: 32px; height: 32px;">
                                <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1">favorite</span>
                            </div>
                            <div class="floating-icon bottom-6 -left-4 text-white/40" style="width: 32px; height: 32px;">
                                <span class="material-symbols-outlined text-lg">delete</span>
                            </div>
                        </div>
                    </div>
                    <h1 class="text-2xl font-bold leading-tight mb-4 whitespace-pre-line">
                        하루 한 장,
기분 좋은 비움
                    </h1>
                    <p class="text-muted-lavender text-sm leading-relaxed whitespace-pre-line">
                        AI가 선별한 불필요한 사진들을
가벼운 마음으로 정리해보세요.
                    </p>
                </main>
                <footer class="flex flex-col items-center gap-6">
                    <div class="flex gap-2">
                        <div class="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                        <div class="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <div class="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                        <div class="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                    </div>
                    <button id="onboarding-next" class="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-base active:scale-[0.98] transition-all">
                        다음
                    </button>
                </footer>
            </div>
        `;
    }

    _getStep3HTML() {
        return `
            <div class="flex flex-col justify-between py-10 px-8 text-center">
                <header class="flex justify-end h-6 mb-2">
                    <button id="onboarding-skip" class="opacity-0 pointer-events-none text-white/40 text-sm font-medium">Skip</button>
                </header>
                <main class="flex flex-col items-center justify-center mb-8">
                    <div class="relative w-full max-w-[180px] aspect-square flex flex-col items-center justify-center mb-8">
                        <div class="photo-frame" style="width: 140px; height: 180px;">
                            <div class="photo-content">
                                <span class="material-symbols-outlined text-white/10 text-3xl">image</span>
                            </div>
                            <div class="mt-3 flex justify-between items-center px-1">
                                <div class="w-12 h-1 bg-white/10 rounded-full"></div>
                                <div class="w-4 h-1 bg-white/10 rounded-full"></div>
                            </div>
                            <div class="icon-badge -left-3 top-1/2 -translate-y-1/2" style="width: 32px; height: 32px;">
                                <span class="material-symbols-outlined text-base" style="font-variation-settings: 'FILL' 1">edit_note</span>
                            </div>
                            <div class="icon-badge -right-3 top-1/4" style="width: 32px; height: 32px;">
                                <span class="material-symbols-outlined text-base" style="font-variation-settings: 'FILL' 1">share</span>
                            </div>
                        </div>
                    </div>
                    <h1 class="text-2xl font-bold leading-tight mb-4 whitespace-pre-line">
                        진짜 소중한 순간은
더 선명하게
                    </h1>
                    <p class="text-muted-lavender text-sm leading-relaxed whitespace-pre-line">
                        삭제하기 아까운 사진은 감각과 함께 기록하고
소중한 사람들과 공유하세요.
                    </p>
                </main>
                <footer class="flex flex-col items-center gap-6">
                    <div class="flex gap-2">
                        <div class="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                        <div class="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                        <div class="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <div class="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                    </div>
                    <button id="onboarding-start" class="w-full py-4 rounded-2xl bg-primary text-dark-bg font-bold text-base active:scale-[0.98] transition-all">
                        시작하기
                    </button>
                </footer>
            </div>
        `;
    }

    _getStep4HTML() {
        return `
            <div class="flex flex-col justify-between py-10 px-8 text-center">
                <header class="h-6 mb-2"></header>
                <main class="flex flex-col items-center justify-center mb-8">
                    <div class="relative w-full max-w-[160px] aspect-square flex items-center justify-center mb-8">
                        <div class="absolute inset-0 bg-primary/5 rounded-[2.5rem] glow-effect"></div>
                        <div class="relative w-24 h-28 border-4 border-white/10 rounded-3xl overflow-hidden flex items-center justify-center bg-field-bg">
                            <span class="material-symbols-outlined text-primary text-4xl" style="font-variation-settings: 'FILL' 1">
                                water_lux
                            </span>
                        </div>
                    </div>
                    <h1 class="text-xl font-bold leading-tight mb-3 whitespace-pre-line">
                        당신의 소중한 순간들을
마주할 수 있게 해주세요
                    </h1>
                    <p class="text-muted-lavender text-[13px] leading-relaxed mb-6">
                        AI가 사진을 분석하여 매일 아침
최적의 기록 한 장을 골라드릴게요.
                    </p>
                    <div class="w-full bg-field-bg/50 rounded-2xl p-4 text-left border border-white/5">
                        <ul class="space-y-3">
                            <li class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary text-sm">check_circle</span>
                                <span class="text-white/50 text-xs font-medium">하루 한 장 최적의 큐레이션</span>
                            </li>
                            <li class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary text-sm">check_circle</span>
                                <span class="text-white/50 text-xs font-medium">중복 및 저화질 사진 분류</span>
                            </li>
                        </ul>
                    </div>
                </main>
                <footer class="flex flex-col items-center gap-3">
                    <button id="onboarding-allow" class="w-full py-4 rounded-2xl bg-primary text-dark-bg font-bold text-base active:scale-[0.98] transition-all">
                        사진첩 접근 허용하기
                    </button>
                    <button id="onboarding-skip" class="py-2 text-white/40 text-sm font-medium hover:text-white/60 transition-colors">
                        나중에 설정하기
                    </button>
                </footer>
            </div>
        `;
    }
}
