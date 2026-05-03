/**
 * PermissionModal - Album access permission request modal
 * 사진첩 접근 권한 요청을 담당하는 모달 (회원가입 후 표시)
 */

import { Modal } from './Modal.js';
import { Capacitor } from '@capacitor/core';
import RecocolPhotos from '../plugins/RecocolPhotos.ts';

export class PermissionModal extends Modal {
    constructor(element) {
        super(element);
        this.onPermissionResolved = null;
        this.lastKnownStatus = null;
        this.contentElement = this.element.querySelector('#permission-content');
    }

    _emitPermissionResolution({ authorized, status = null, reason }) {
        const payload = { authorized, status, reason };
        if (status) this.lastKnownStatus = status;
        if (this.onPermissionResolved) this.onPermissionResolved(payload);
    }

    async checkAndOpen() {
        if (!Capacitor.isNativePlatform()) {
            console.log('[PERM] Skipping photo permissions on web environment');
            this._emitPermissionResolution({
                authorized: true,
                status: 'authorized',
                reason: 'web_non_native'
            });
            return;
        }

        let isCompleted = false;

        // Safety timeout: 2.5 seconds to prevent boot hang
        const timeout = setTimeout(() => {
            if (!isCompleted) {
                console.warn('[PERM] Permission check timed out. Opening permission modal.');
                isCompleted = true;
                this.open();
            }
        }, 2500);

        try {
            console.log('[PERM] Checking permissions...');
            const status = await RecocolPhotos.getPhotoLibraryPermissionStatus();
            console.log('[PERM] Status:', status.status, 'Authorized:', status.authorized);

            if (!isCompleted || status.authorized) {
                clearTimeout(timeout);
                this.lastKnownStatus = status.status || null;

                if (status.authorized) {
                    isCompleted = true;
                    this.close();
                    this._emitPermissionResolution({
                        authorized: true,
                        status: status.status || 'authorized',
                        reason: 'already_authorized'
                    });
                    return;
                }
                isCompleted = true;
                this.open();
            }
        } catch (error) {
            console.error('[PERM] Error checking permissions:', error);
            if (!isCompleted) {
                clearTimeout(timeout);
                isCompleted = true;
                this.open();
            }
        }
    }

    open() {
        this.render();
        super.open();
    }

    render() {
        if (!this.contentElement) return;

        this.contentElement.innerHTML = `
            <div class="flex flex-col h-full px-8 bg-dark-bg" style="padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);">
                <main class="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full overflow-hidden py-4">
                    <div class="relative w-full max-w-[200px] aspect-square flex items-center justify-center mb-6 shrink-0">
                        <div class="absolute inset-0 bg-primary/5 rounded-[2.5rem] glow-effect"></div>
                        <div class="relative w-40 h-48 border-4 border-white/10 rounded-3xl overflow-hidden flex items-center justify-center bg-field-bg">
                            <span class="material-symbols-outlined text-primary text-6xl" style="font-variation-settings: 'FILL' 1">
                                water_lux
                            </span>
                            <div class="absolute -bottom-2 -right-2">
                                <span class="material-symbols-outlined text-primary text-5xl transform -rotate-12" style="font-variation-settings: 'FILL' 1">
                                    water_lux
                                </span>
                            </div>
                        </div>
                        <div class="absolute -top-4 -left-4 w-12 h-12 bg-primary/20 rounded-full blur-xl"></div>
                    </div>
                    <h1 class="text-[24px] font-bold leading-tight mb-3 whitespace-pre-line text-center">
                        당신의 소중한 순간들을\n마주할 수 있게 해주세요
                    </h1>
                    <p class="text-muted-lavender text-sm leading-relaxed whitespace-pre-line mb-6 text-center">
                        AI가 사진을 분석하여 매일 아침\n최적의 기록 한 장을 골라드릴게요.
                        <span class="text-white/30 block mt-1">(권한은 언제든지 설정에서 변경 가능해요)</span>
                    </p>
                    <div class="w-full bg-field-bg/50 rounded-lg p-5 text-left border border-white/5 mb-4">
                        <h2 class="text-white/60 text-[11px] font-semibold mb-3 tracking-wider uppercase">왜 접근 권한이 필요한가요?</h2>
                        <ul class="space-y-3">
                            <li class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-primary text-sm">check_circle</span>
                                <span class="text-white/50 text-sm">하루 한 장 최적의 큐레이션</span>
                            </li>
                            <li class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-primary text-sm">check_circle</span>
                                <span class="text-white/50 text-sm">중복 및 저화질 사진 분류</span>
                            </li>
                        </ul>
                    </div>
                </main>
                <footer class="flex flex-col items-center gap-3 pb-8 shrink-0">
                    <button id="permission-allow-btn" class="w-full max-w-sm h-14 rounded-3xl bg-primary text-dark-bg font-bold text-lg active:scale-[0.98] transition-all duration-300 ease-in-out">
                        사진첩 접근 허용하기
                    </button>
                    <button id="permission-skip-btn" class="py-2 text-white/40 text-sm font-medium hover:text-white/60 transition-colors duration-200 ease-in-out">
                        나중에 설정하기
                    </button>
                </footer>
            </div>
        `;

        this._bindEvents();
    }

    async _handlePermissionRequest() {
        try {
            console.log('Requesting native photo library permissions...');
            const result = await RecocolPhotos.requestPhotoLibraryPermission();
            console.log('Permission result:', result.status);
            this.lastKnownStatus = result.status || this.lastKnownStatus;

            if (result.authorized) {
                this.close();
                this._emitPermissionResolution({
                    authorized: true,
                    status: result.status || 'authorized',
                    reason: 'user_granted'
                });
            } else {
                console.warn('Permission denied by user');
                // 거부된 경우에도 일단 닫거나 안내 문구를 띄울 수 있음
                this.close();
                this._emitPermissionResolution({
                    authorized: false,
                    status: result.status || 'denied',
                    reason: 'user_denied'
                });
            }
        } catch (error) {
            console.error('Error requesting permissions:', error);
            // 웹 환경일 경우 오류 발생 가능 -> 그냥 진행
            this.close();
            this._emitPermissionResolution({
                authorized: false,
                status: this.lastKnownStatus,
                reason: 'request_error'
            });
        }
    }

    _bindEvents() {
        const allowBtn = this.element.querySelector('#permission-allow-btn');
        const skipBtn = this.element.querySelector('#permission-skip-btn');

        if (allowBtn) {
            allowBtn.onclick = () => this._handlePermissionRequest();
        }

        if (skipBtn) {
            skipBtn.onclick = () => {
                console.log('Permission Skipped');
                this.close();
                this._emitPermissionResolution({
                    authorized: false,
                    status: this.lastKnownStatus || 'not_requested',
                    reason: 'user_skipped'
                });
            };
        }
    }

    _setupCloseOnOutsideClick() {
        // Do nothing (required)
    }
}
