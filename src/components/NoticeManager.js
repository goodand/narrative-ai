/**
 * NoticeManager - Handles Notification Settings UI and Scheduling.
 *
 * Slice 5a (Decision #6B): platform/service direct imports removed. The
 * component reads its initial state from `core.notifications.getViewModel()`
 * and routes toggle changes through `core.notifications.setEnabled(enabled)`.
 * Permission-denied state is surfaced via the controller view model and
 * presented through toastPresenter.
 */

import { presentToast, ErrorLevel } from '../ui/dom/toastPresenter.js';

export class NoticeManager {
    constructor(containerId, { core } = {}) {
        this.container = document.getElementById(containerId);
        this.core = core || null;
        this.isNoticeEnabled = this._readEnabled();
    }

    _readEnabled() {
        if (!this.core || !this.core.notifications) return false;
        const vm = this.core.notifications.getViewModel();
        return Boolean(vm && vm.enabled);
    }

    async render() {
        this.isNoticeEnabled = this._readEnabled();
        this.container.innerHTML = `
            <div class="flex flex-col h-full bg-dark-bg text-white overflow-hidden">
                <!-- Top App Bar -->
                <header class="flex items-center justify-between px-4 pb-3 shrink-0 relative z-10" style="padding-top: calc(env(safe-area-inset-top) + 12px);">
                    <button id="notice-back" class="flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-white/10 transition-colors duration-200 ease-in-out">
                        <span class="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                    </button>
                    <h1 class="text-lg font-semibold tracking-tight absolute left-1/2 -translate-x-1/2">알림 설정</h1>
                    <div class="w-10 h-10"></div>
                </header>

                <!-- Main Content -->
                <div class="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar relative">
                    <!-- Illustration/Mascot Area -->
                    <div class="flex-1 flex flex-col items-center justify-center min-h-[240px] mb-6 relative">
                        <div class="absolute inset-0 bg-primary/10 blur-[80px] rounded-full pointer-events-none transform scale-75"></div>
                        <div class="relative w-48 h-48 flex items-center justify-center mb-4 dolphin-glow">
                            <span class="material-symbols-outlined text-[140px] text-primary/80 select-none" style="font-variation-settings: 'FILL' 1, 'wght' 200;">
                                water_lux
                            </span>
                        </div>
                    </div>

                    <!-- Main Settings Card -->
                    <div class="bg-field-bg rounded-[2rem] p-6 shadow-xl border border-white/5 backdrop-blur-[20px] relative overflow-hidden group">
                        <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50 pointer-events-none"></div>
                        <div class="flex flex-col gap-6 relative z-10">
                            <!-- Toggle Row -->
                            <div class="flex items-center justify-between">
                                <div class="flex flex-col gap-1">
                                    <span class="text-lg font-semibold text-white">매일 아침 알림 받기</span>
                                    <span id="notice-status-text" class="text-sm font-medium ${this.isNoticeEnabled ? 'text-primary' : 'text-gray-500'} flex items-center gap-1.5">
                                        <span class="w-1.5 h-1.5 rounded-full ${this.isNoticeEnabled ? 'bg-primary animate-pulse' : 'bg-gray-500'}"></span>
                                        ${this.isNoticeEnabled ? '현재 알림이 활성화되어 있습니다' : '알림이 꺼져 있습니다'}
                                    </span>
                                </div>
                                <!-- Toggle Switch -->
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input id="notice-toggle" type="checkbox" ${this.isNoticeEnabled ? 'checked' : ''} class="sr-only peer"/>
                                    <div class="w-14 h-8 bg-zinc-800 border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all duration-300 ease-in-out peer-checked:bg-primary peer-checked:border-primary"></div>
                                </label>
                            </div>
                            <!-- Divider -->
                            <div class="h-px w-full bg-white/5"></div>
                            <!-- Description Text -->
                            <div class="space-y-4">
                                <div class="flex gap-3">
                                    <span class="material-symbols-outlined text-primary/80 shrink-0 mt-0.5">schedule</span>
                                    <p class="text-gray-400 text-sm leading-relaxed font-light">
                                        매일 아침 6시, 리코코가 오늘의 추억을 배달해 드립니다. <br/>
                                        <span class="text-white/60 mt-1 block text-xs">시간은 몸의 리듬에 맞춰 고정되어 있어요.</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-8 text-center px-4 mb-10">
                        <p class="text-xs text-gray-500 font-light">
                            알림을 끄면 지난 추억을 놓칠 수 있어요.
                        </p>
                    </div>
                </div>
            </div>
        `;

        this._bindEvents();
    }

    _bindEvents() {
        const backBtn = document.getElementById('notice-back');
        const toggle = document.getElementById('notice-toggle');
        const statusText = document.getElementById('notice-status-text');

        if (backBtn) {
            backBtn.onclick = () => {
                if (this.core && this.core.navigation) {
                    this.core.navigation.navigate('mypage');
                }
            };
        }

        if (toggle) {
            toggle.onchange = async (e) => {
                const enabled = e.target.checked;

                if (!this.core || !this.core.notifications) {
                    console.error('[NOTICE] core.notifications not available');
                    toggle.checked = !enabled;
                    return;
                }

                await this.core.notifications.setEnabled(enabled);

                const vm = this.core.notifications.getViewModel();
                const finalEnabled = Boolean(vm.enabled);

                if (enabled && vm.status === 'permission_denied') {
                    presentToast('알림 권한이 필요합니다. 설정에서 권한을 허용해주세요.', ErrorLevel.WARN);
                }

                this.isNoticeEnabled = finalEnabled;
                toggle.checked = finalEnabled;

                // UI Update
                if (statusText) {
                    statusText.className = `text-sm font-medium ${finalEnabled ? 'text-primary' : 'text-gray-500'} flex items-center gap-1.5`;
                    statusText.innerHTML = `
                        <span class="w-1.5 h-1.5 rounded-full ${finalEnabled ? 'bg-primary animate-pulse' : 'bg-gray-500'}"></span>
                        ${finalEnabled ? '현재 알림이 활성화되어 있습니다' : '알림이 꺼져 있습니다'}
                    `;
                }
            };
        }
    }
}
