/**
 * MyPageManager - Handles profile, settings and account management
 * 마이페이지 UI 및 관련 기능을 담당하는 클래스
 */

import { supabase } from '../services/supabase.js';
import { API_CONFIG } from '../constants/config.js';
import { handleError } from '../utils/errorHandler.js';
import { requestPermission, scheduleDailyNotification, cancelAll } from '../services/NotificationService.js';

export class MyPageManager {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.onLogout = options.onLogout || null;
        this.user = null;
        this.getCurrentUser = options.getCurrentUser || (() => null);
        this.isHydratingUser = false;
        this._requestSeq = 0;
    }

    /**
     * Render the My Page view
     */
    render() {
        this._renderShell();
        this._hydrateUser();
    }

    async _hydrateUser() {
        const requestSeq = ++this._requestSeq;
        this.isHydratingUser = true;
        this._renderShell();

        try {
            const cachedUser = this.getCurrentUser() || this.user;
            if (cachedUser) {
                this.user = cachedUser;
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            this.user = user;
        } catch (error) {
            console.error('[MYPAGE] Failed to load user:', error);
        } finally {
            if (requestSeq !== this._requestSeq) return;
            this.isHydratingUser = false;
            this._renderShell();
        }
    }

    _renderShell() {
        if (!this.container) return;

        const user = this.user;
        const profileName = user?.user_metadata?.full_name || (this.isHydratingUser ? '불러오는 중' : '사용자');
        const profileEmail = user?.email || (this.isHydratingUser ? '계정 정보를 확인하고 있어요' : '로그인 정보를 확인할 수 없습니다');
        const profileImg = user?.user_metadata?.avatar_url || 'https://lh3.googleusercontent.com/a/default-user';
        const profilePulse = this.isHydratingUser ? 'animate-pulse opacity-60' : '';

        this.container.innerHTML = `
            <div class="sticky top-0 z-10 bg-dark-bg/80 backdrop-blur-md" style="padding-top: env(safe-area-inset-top);">
                <div class="flex items-center px-4 py-4 justify-between max-w-md mx-auto">
                    <div id="mypage-back" class="flex size-10 items-center justify-center cursor-pointer active:scale-90 transition-transform">
                        <span class="material-symbols-outlined text-2xl text-white">arrow_back_ios</span>
                    </div>
                    <h2 class="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10 text-white">마이페이지</h2>
                </div>
            </div>
            <div class="max-w-md mx-auto pb-10">
                <!-- Profile Section -->
                <div class="flex flex-col items-center pt-6 pb-6 gap-3">
                    <div class="relative">
                        <div class="bg-field-bg p-1.5 rounded-full border border-primary/20 shadow-lg">
                            <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-28 h-28 bg-[#2A2635] ${profilePulse}"
                                 style='background-image: url("${profileImg}");'>
                            </div>
                        </div>
                    </div>
                    <div class="text-center">
                        <p class="text-2xl font-bold tracking-tight text-white ${profilePulse}">${profileName}님</p>
                        <p class="text-primary text-sm font-semibold mt-1 ${profilePulse}">${profileEmail}</p>
                    </div>
                </div>

                <!-- Settings Group (mx-6 제거로 너비 확장) -->
                <div class="px-6">
                    <div id="notice-settings-btn" class="flex items-center gap-4 bg-field-bg px-5 min-h-[64px] rounded-[24px] border border-white/5 cursor-pointer active:bg-zinc-800 transition-colors">
                        <div class="w-6 text-primary flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-[22px]">notifications</span>
                        </div>
                        <p class="text-white text-base font-semibold flex-1">알림 설정</p>
                        <div class="shrink-0 text-zinc-600">
                            <span class="material-symbols-outlined">chevron_right</span>
                        </div>
                    </div>
                </div>

                <!-- Account Actions (mx-6 제거로 너비 확장) -->
                <div class="px-6 mt-6 space-y-4">
                    <div id="withdraw-btn" class="flex items-center gap-4 bg-field-bg px-5 min-h-[64px] rounded-3xl border border-white/5 cursor-pointer active:bg-zinc-800 transition-colors">
                        <div class="w-6 text-red-400 flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-[22px]">person_remove</span>
                        </div>
                        <p class="text-red-400 text-base font-semibold flex-1">회원탈퇴</p>
                        <div class="shrink-0 text-zinc-600">
                            <span class="material-symbols-outlined">chevron_right</span>
                        </div>
                    </div>
                </div>
                
                <!-- Footer / Logout (디자인 가이드 반영) -->
                <div class="mt-12 px-6 text-center">
                    <p class="text-xs text-gray-500 font-semibold tracking-wide">recoco v2.4.0</p>
                    <button id="logout-btn" class="mt-4 text-sm text-gray-500 font-medium underline underline-offset-4 decoration-zinc-800 active:text-white transition-colors">로그아웃</button>
                </div>
            </div>
        `;

        this._bindEvents();
    }

    _bindEvents() {
        const backBtn = document.getElementById('mypage-back');
        const logoutBtn = document.getElementById('logout-btn');
        const withdrawBtn = document.getElementById('withdraw-btn');
        const noticeBtn = document.getElementById('notice-settings-btn');

        if (backBtn) {
            backBtn.onclick = () => {
                window.dispatchEvent(new CustomEvent('nav-change', { detail: 'home' }));
            };
        }

        if (noticeBtn) {
            noticeBtn.onclick = () => {
                window.dispatchEvent(new CustomEvent('nav-change', { detail: 'notice' }));
            };
        }

        if (logoutBtn) {
            logoutBtn.onclick = async () => {
                try {
                    const { error } = await supabase.auth.signOut();
                    if (error) throw error;
                    if (this.onLogout) this.onLogout();
                } catch (err) {
                    handleError(err, 'Auth', { userMessage: '로그아웃 중 오류가 발생했습니다.' });
                }
            };
        }

        if (withdrawBtn) {
            withdrawBtn.onclick = () => this._showWithdrawView();
        }
    }

    /**
     * Show withdrawal confirmation view
     */
    _showWithdrawView() {
        this.container.innerHTML = `
            <div class="sticky top-0 z-10 bg-dark-bg/80 backdrop-blur-md" style="padding-top: env(safe-area-inset-top);">
                <div class="flex items-center p-4 justify-between max-w-md mx-auto">
                    <div id="withdraw-back" class="flex size-10 items-center justify-center cursor-pointer hover:bg-white/5 rounded-full transition-colors">
                        <span class="material-symbols-outlined text-2xl text-white">arrow_back_ios</span>
                    </div>
                    <h2 class="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10 text-white">회원 탈퇴</h2>
                </div>
            </div>
            <div class="max-w-md mx-auto px-6 pb-40">
                <div class="flex flex-col items-center py-10 gap-4 text-center">
                    <div class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                        <span class="material-symbols-outlined text-red-400 text-4xl" style="font-variation-settings: 'FILL' 1;">warning</span>
                    </div>
                    <h1 class="text-2xl font-bold tracking-tight text-white">정말 탈퇴하시겠어요?</h1>
                    <p class="text-gray-400 text-sm leading-relaxed">탈퇴하시면 리코코의 모든 데이터가 삭제되며<br/>다시는 복구할 수 없습니다.</p>
                </div>
                <div class="bg-field-bg rounded-[24px] p-6 border border-white/5 mb-8">
                    <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">삭제되는 데이터</h3>
                    <ul class="space-y-4 text-white">
                        <li class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-gray-400 text-xl">photo_library</span>
                            <span class="text-[15px] font-medium">기록된 소중한 추억들</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-gray-400 text-xl">analytics</span>
                            <span class="text-[15px] font-medium">지금까지의 비움 통계</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-gray-400 text-xl">account_circle</span>
                            <span class="text-[15px] font-medium">연동된 구글 계정 정보</span>
                        </li>
                    </ul>
                </div>
                <div class="mb-8">
                    <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-1">탈퇴 사유 (선택)</h3>
                    <div class="space-y-3">
                        <label class="flex items-center justify-between bg-field-bg border border-white/5 rounded-2xl px-5 py-4 cursor-pointer active:scale-[0.98] transition-all">
                            <span class="text-[15px] font-medium text-white">기능이 부족해요</span>
                            <input class="w-5 h-5 border-2 border-zinc-700 bg-transparent text-primary focus:ring-0 focus:ring-offset-0 rounded-full" name="reason" type="radio" value="lack_features"/>
                        </label>
                        <label class="flex items-center justify-between bg-field-bg border border-white/5 rounded-2xl px-5 py-4 cursor-pointer active:scale-[0.98] transition-all">
                            <span class="text-[15px] font-medium text-white">정리가 더 이상 필요 없어요</span>
                            <input class="w-5 h-5 border-2 border-zinc-700 bg-transparent text-primary focus:ring-0 focus:ring-offset-0 rounded-full" name="reason" type="radio" value="no_need"/>
                        </label>
                        <label class="flex items-center justify-between bg-field-bg border border-white/5 rounded-2xl px-5 py-4 cursor-pointer active:scale-[0.98] transition-all">
                            <span class="text-[15px] font-medium text-white">다른 서비스를 이용해요</span>
                            <input class="w-5 h-5 border-2 border-zinc-700 bg-transparent text-primary focus:ring-0 focus:ring-offset-0 rounded-full" name="reason" type="radio" value="other_service"/>
                        </label>
                    </div>
                </div>
                <div class="flex items-start gap-3 px-1 mb-4">
                    <input class="mt-0.5 w-5 h-5 rounded border-2 border-zinc-700 bg-transparent text-primary focus:ring-0 focus:ring-offset-0" id="withdraw-confirm-checkbox" type="checkbox"/>
                    <label class="text-sm text-gray-400 font-medium leading-snug" for="withdraw-confirm-checkbox">모든 데이터가 삭제됨을 확인했으며 이에 동의합니다.</label>
                </div>
            </div>
            <div class="fixed bottom-0 left-0 right-0 bg-dark-bg/80 backdrop-blur-[20px] border-t border-white/5 px-6 pt-10 z-50" style="padding-bottom: calc(env(safe-area-inset-bottom) + 61px);">
                <div class="max-w-md mx-auto flex flex-col gap-4">
                    <button id="withdraw-keep-btn" class="w-full h-14 bg-primary text-dark-bg font-bold rounded-3xl text-base active:scale-[0.97] transition-all">
                        계정 유지하기
                    </button>
                    <button id="withdraw-proceed-btn" class="w-full h-14 bg-transparent border border-white/10 text-[#B2B0B5] font-bold rounded-3xl text-base active:scale-[0.97] transition-all disabled:opacity-50" disabled>
                        탈퇴하기
                    </button>
                </div>
            </div>

            <div id="withdraw-modal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center px-8 hidden">
                <div class="bg-field-bg w-full max-w-xs rounded-[28px] border border-white/5 overflow-hidden shadow-2xl">
                    <div class="p-8 text-center">
                        <h3 class="text-xl font-bold mb-3 tracking-tight text-white">탈퇴를 진행할까요?</h3>
                        <p class="text-[14.5px] text-gray-400 leading-relaxed font-medium">
                            탈퇴 시 모든 데이터는 영구 삭제되며 복구할 수 없습니다. 정말 진행하시겠습니까?
                        </p>
                    </div>
                    <div class="flex border-t border-white/5">
                        <button id="withdraw-modal-cancel" class="flex-1 py-4 text-gray-400 font-semibold text-[16px] hover:bg-white/5 active:bg-white/10 transition-colors border-r border-white/5">
                            취소
                        </button>
                        <button id="withdraw-modal-confirm" class="flex-1 py-4 text-red-400 font-bold text-[16px] hover:bg-red-500/5 active:bg-red-500/10 transition-colors">
                            탈퇴하기
                        </button>
                    </div>
                </div>
            </div>
        `;

        this._bindWithdrawEvents();
    }

    _bindWithdrawEvents() {
        const backBtn = document.getElementById('withdraw-back');
        const keepBtn = document.getElementById('withdraw-keep-btn');
        const proceedBtn = document.getElementById('withdraw-proceed-btn');
        const confirmCheckbox = document.getElementById('withdraw-confirm-checkbox');
        const modal = document.getElementById('withdraw-modal');
        const modalCancel = document.getElementById('withdraw-modal-cancel');
        const modalConfirm = document.getElementById('withdraw-modal-confirm');

        if (backBtn) backBtn.onclick = () => this.render();
        if (keepBtn) keepBtn.onclick = () => this.render();

        if (confirmCheckbox && proceedBtn) {
            confirmCheckbox.onchange = () => {
                proceedBtn.disabled = !confirmCheckbox.checked;
                if (confirmCheckbox.checked) {
                    proceedBtn.classList.remove('text-gray-400');
                    proceedBtn.classList.add('text-red-400');
                } else {
                    proceedBtn.classList.add('text-gray-400');
                    proceedBtn.classList.remove('text-red-400');
                }
            };
        }

        if (proceedBtn && modal) {
            proceedBtn.onclick = () => {
                if (!proceedBtn.disabled) modal.classList.remove('hidden');
            };
        }

        if (modalCancel && modal) modalCancel.onclick = () => modal.classList.add('hidden');
        if (modalConfirm) modalConfirm.onclick = () => this._performWithdrawal();
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            };
        }
    }

    async _performWithdrawal() {
        const modalConfirm = document.getElementById('withdraw-modal-confirm');
        const reasonInput = document.querySelector('input[name="reason"]:checked');
        const reason = reasonInput ? reasonInput.value : 'not_specified';

        try {
            if (modalConfirm) {
                modalConfirm.textContent = '처리 중...';
                modalConfirm.disabled = true;
            }

            let userId = this.user?.id;
            if (!userId) {
                const { data: { user } } = await supabase.auth.getUser();
                userId = user?.id;
            }

            if (userId) {
                const baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/$/, '');
                await fetch(`${baseUrl}/api/v1/delete-account`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, reason })
                }).catch(e => console.warn('[WITHDRAW] Server error:', e));
            }

            await supabase.auth.signOut({ scope: 'global' }).catch(() => {});
            localStorage.clear();
            sessionStorage.clear();
            
            this._showFarewellView();
        } catch (err) {
            handleError(err, 'Withdraw');
            if (modalConfirm) {
                modalConfirm.textContent = '탈퇴하기';
                modalConfirm.disabled = false;
            }
        }
    }

    _showFarewellView() {
        this.container.innerHTML = `
            <div class="flex flex-col h-full bg-dark-bg">
                <div class="flex-1 flex flex-col items-center justify-center px-8 text-center max-w-md mx-auto">
                    <div class="relative mb-12 flex justify-center items-center">
                        <div class="absolute w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
                        <div class="relative dolphin-glow">
                            <span class="material-symbols-outlined text-[120px] text-primary/80 leading-none select-none" style="font-variation-settings: 'FILL' 0, 'wght' 200;">
                                water_drop
                            </span>
                        </div>
                    </div>
                    <h1 class="text-2xl font-medium tracking-tight leading-relaxed mb-6 whitespace-pre-line text-white">
                        비움이 당신에게\n휴식이 되었길 바랍니다.
                    </h1>
                    <p class="text-gray-400 text-[15px] leading-7 font-light mb-12 break-keep">
                        언제든 마음이 무거워질 때 다시 리코코를 찾아주세요.
                    </p>
                </div>
                <div class="pb-16 px-8 flex justify-center w-full max-w-md mx-auto">
                    <button id="farewell-btn" class="px-10 py-3 rounded-full border border-white/10 text-gray-500 text-sm font-medium hover:text-white transition-colors">
                        안녕히 가세요
                    </button>
                </div>
            </div>
        `;
        const farewellBtn = document.getElementById('farewell-btn');
        if (farewellBtn) farewellBtn.onclick = () => window.location.reload();
    }
}
