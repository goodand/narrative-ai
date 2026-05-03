/**
 * OnboardingModal - Multi-step onboarding experience
 * 온보딩 과정을 단계별로 보여주는 모달 (모바일 잘림 방지 최적화)
 */

export class OnboardingModal {
    constructor(elementId, options = {}) {
        this.element = document.getElementById(elementId);
        this.currentStep = 1;
        this.totalSteps = 3;
        this.onComplete = options.onComplete || null;
        
        this.contentElement = this.element.querySelector('#onboarding-content');
    }

    open() {
        this.currentStep = 1;
        this.element.classList.remove('hidden');
        this.renderStep();
    }

    close() {
        this.element.classList.add('hidden');
        if (this.onComplete) {
            this.onComplete();
        }
    }

    renderStep() {
        if (!this.contentElement) return;

        let html = '';
        switch (this.currentStep) {
            case 1: html = this._getStep1HTML(); break;
            case 2: html = this._getStep2HTML(); break;
            case 3: html = this._getStep3HTML(); break;
        }

        // 전체 컨테이너에 스크롤 가능하도록 overflow 설정 및 하단 패딩 확보
        this.contentElement.innerHTML = `
            <div class="h-full w-full overflow-y-auto custom-scrollbar bg-dark-bg">
                ${html}
            </div>
        `;
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

    _bindStepEvents() {
        const nextBtn = this.element.querySelector('#onboarding-next');
        const skipBtn = this.element.querySelector('#onboarding-skip');
        const startBtn = this.element.querySelector('#onboarding-start');

        if (nextBtn) nextBtn.onclick = () => this.nextStep();
        if (skipBtn) skipBtn.onclick = () => this.skip();
        if (startBtn) startBtn.onclick = () => this.nextStep();
    }

    // 공통 래퍼: 최소 높이를 보장하되 컨텐츠가 넘치면 스크롤 가능하게 함
    _stepWrapper(content, footer, step) {
        return `
            <div class="flex flex-col min-h-full px-8 pt-4 pb-10 text-center" style="padding-bottom: calc(2rem + env(safe-area-inset-bottom))">
                <header class="flex justify-end h-10 shrink-0">
                    <button id="onboarding-skip" class="text-white/40 text-sm font-medium ${step === 3 ? 'opacity-0 pointer-events-none' : ''}">Skip</button>
                </header>
                
                <main class="flex-1 flex flex-col items-center justify-center py-4">
                    ${content}
                </main>
                
                <footer class="flex flex-col items-center gap-6 shrink-0 mt-auto mb-6">
                    <div class="flex gap-2">
                        ${[1, 2, 3].map(i => `
                            <div class="w-1.5 h-1.5 rounded-full ${i === step ? 'bg-primary' : 'bg-white/10'}"></div>
                        `).join('')}
                    </div>
                    ${footer}
                </footer>
            </div>
        `;
    }

    _getStep1HTML() {
        const content = `
            <div class="relative w-full max-w-[180px] aspect-square flex flex-col items-center justify-center mb-6">
                <div class="relative z-10 mb-[-15px]">
                    <span class="material-symbols-outlined text-[80px] sm:text-[100px] text-primary leading-none" style="font-variation-settings: 'FILL' 1">
                        water_lux
                    </span>
                </div>
                <div class="wave-container" style="height: 60px;">
                    <div class="wave"></div>
                </div>
            </div>
            <h1 class="text-xl sm:text-2xl font-bold leading-tight mb-3 whitespace-pre-line">
                비움으로 선명해지는\n당신의 기록
            </h1>
            <p class="text-muted-lavender text-sm sm:text-base leading-relaxed whitespace-pre-line px-2">
                매일 아침 도착하는 사진 한 장으로\n디지털 웰니스를 시작해보세요.
            </p>
        `;
        const footer = `
            <button id="onboarding-next" class="w-full max-w-sm h-14 rounded-3xl bg-white/5 border border-white/10 text-white font-bold text-lg active:scale-[0.98] transition-all">
                다음
            </button>
        `;
        return this._stepWrapper(content, footer, 1);
    }

    _getStep2HTML() {
        const content = `
            <div class="relative w-full max-w-[220px] aspect-square flex items-center justify-center mb-8">
                <div class="photo-stack scale-90 sm:scale-100">
                    <div class="photo-card"></div>
                    <div class="photo-card"></div>
                    <div class="photo-card flex flex-col gap-2 p-4">
                        <div class="w-20 h-1.5 bg-primary/20 rounded-full"></div>
                        <div class="w-12 h-1.5 bg-primary/20 rounded-full"></div>
                    </div>
                    <div class="floating-icon top-0 -right-2 text-primary">
                        <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1">favorite</span>
                    </div>
                    <div class="floating-icon bottom-8 -left-4 text-white/40">
                        <span class="material-symbols-outlined text-xl">delete</span>
                    </div>
                </div>
            </div>
            <h1 class="text-xl sm:text-2xl font-bold leading-tight mb-3 whitespace-pre-line">
                하루 한 장,
기분 좋은 비움
            </h1>
            <p class="text-muted-lavender text-sm sm:text-base leading-relaxed whitespace-pre-line">
                AI가 선별한 불필요한 사진들을
가벼운 마음으로 정리해보세요.
            </p>
        `;
        const footer = `
            <button id="onboarding-next" class="w-full max-w-sm h-14 rounded-3xl bg-white/5 border border-white/10 text-white font-bold text-lg active:scale-[0.98] transition-all">
                다음
            </button>
        `;
        return this._stepWrapper(content, footer, 2);
    }

    _getStep3HTML() {
        const content = `
            <div class="relative w-full max-w-[220px] aspect-square flex items-center justify-center mb-8">
                <div class="photo-frame scale-90 sm:scale-100">
                    <div class="photo-content">
                        <span class="material-symbols-outlined text-white/10 text-5xl">image</span>
                    </div>
                    <div class="mt-4 flex justify-between items-center px-2">
                        <div class="w-20 h-1.5 bg-white/10 rounded-full"></div>
                        <div class="w-6 h-1.5 bg-white/10 rounded-full"></div>
                    </div>
                    <div class="icon-badge -left-4 top-1/2 -translate-y-1/2">
                        <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1">edit_note</span>
                    </div>
                    <div class="icon-badge -right-4 top-1/4">
                        <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1">share</span>
                    </div>
                </div>
            </div>
            <h1 class="text-xl sm:text-2xl font-bold leading-tight mb-3 whitespace-pre-line">
                진짜 소중한 순간은
더 선명하게
            </h1>
            <p class="text-muted-lavender text-sm sm:text-base leading-relaxed whitespace-pre-line">
                삭제하기 아까운 사진은 감각과 함께 기록하고
소중한 사람들과 공유하세요.
            </p>
        `;
        const footer = `
            <button id="onboarding-start" class="w-full max-w-sm h-14 rounded-3xl bg-primary text-dark-bg font-bold text-lg active:scale-[0.98] transition-all">
                시작하기
            </button>
        `;
        return this._stepWrapper(content, footer, 3);
    }
}