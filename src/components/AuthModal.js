/**
 * AuthModal - Login and Signup modal
 * 로그인 및 회원가입 과정을 담당하는 모달
 */

import { Modal } from './Modal.js';
import { supabase } from '../services/supabase.js';
import { Browser } from '@capacitor/browser';
import { showToast, ErrorLevel } from '../utils/errorHandler.js';

export class AuthModal extends Modal {
    constructor(element) {
        super(element);
        this.onLoginSuccess = null;
        this.contentElement = this.element.querySelector('#auth-content');
    }

    open() {
        this.render();
        super.open();
    }

    render() {
        if (!this.contentElement) return;
        this.contentElement.innerHTML = this._getUnifiedAuthHTML();
        this._bindEvents();
    }

    async _handleGoogleLogin() {
        try {
            console.log('[AUTH] Google 로그인 시작...');
            const isCapacitor = window.Capacitor !== undefined;

            const redirectUrl = isCapacitor
                ? 'com.narrativeai.appv://login-callback'
                : window.location.origin;
            
            console.log('[AUTH] Final Redirect URL:', redirectUrl);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: isCapacitor
                }
            });

            if (error) throw error;

            if (isCapacitor && data?.url) {
                await Browser.open({ 
                    url: data.url,
                    presentationStyle: 'fullscreen'
                });
            }
        } catch (error) {
            console.error('[AUTH] 상세 에러:', error);
            showToast(`로그인 오류: ${error.message}`, ErrorLevel.ERROR);
        }
    }

    _bindEvents() {
        const googleBtn = this.element.querySelector('#google-auth-btn');
        if (googleBtn) {
            googleBtn.onclick = () => this._handleGoogleLogin();
        }
    }

    _getUnifiedAuthHTML() {
        return `
            <div class="flex flex-col h-full px-8 py-12 text-center bg-dark-bg">
                <header class="pt-16 pb-16 flex flex-col items-center">
                    <div class="mb-4">
                        <span class="material-symbols-outlined text-primary text-[64px]">
                            water_lux
                        </span>
                    </div>
                    <h1 class="text-white text-2xl font-bold tracking-[0.3em] font-display">RECOCO</h1>
                </header>
                <main class="flex-1 flex flex-col items-center">
                    <h2 class="text-2xl font-bold leading-tight mb-4">
                        하루 한 장을 비우거나<br/>기록해보세요.
                    </h2>
                    <p class="text-muted-lavender/70 text-[15px] font-medium">
                        디지털 미니멀리즘으로 소중한 순간을 기록하세요.
                    </p>
                </main>
                <footer class="w-full flex flex-col items-center pb-8">
                    <button id="google-auth-btn" class="w-full bg-white text-black py-4 px-6 rounded-[24px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all mb-6 shadow-lg shadow-white/5">
                        <svg height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                        </svg>
                        <span class="text-base font-bold">Google 계정으로 계속하기</span>
                    </button>
                    
                    <div class="mb-3">
                        <button class="text-muted-lavender text-sm font-medium hover:text-white transition-colors">
                            처음이신가요? <span class="underline underline-offset-4 decoration-primary/40 font-bold text-primary">회원가입하기</span>
                        </button>
                    </div>

                    <p class="text-[11px] text-muted-lavender/40 text-center leading-relaxed mt-1">
                        가입 시 <a href="/terms_of_service.html" target="_blank" class="underline decoration-muted-lavender/30 hover:text-white transition-colors">이용약관</a> 및 <a href="/privacy_policy.html" target="_blank" class="underline decoration-muted-lavender/30 hover:text-white transition-colors">개인정보처리방침</a>에 동의하게 됩니다.
                    </p>
                </footer>
            </div>
        `;
    }
}