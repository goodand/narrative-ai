/**
 * MyPageManager - Handles profile, settings and account management
 * 마이페이지 UI 및 관련 기능을 담당하는 클래스
 */

import { supabase } from '../services/supabase.js';
import { API_CONFIG } from '../constants/config.js';

export class MyPageManager {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.onLogout = options.onLogout || null;
        this.user = null;
    }

    /**
     * Render the My Page view
     */
    async render() {
        const { data: { user } } = await supabase.auth.getUser();
        this.user = user;

        if (!user) return;

        const profileName = user.user_metadata?.full_name || '사용자';
        const profileEmail = user.email || '';
        const profileImg = user.user_metadata?.avatar_url || 'https://lh3.googleusercontent.com/a/default-user';

        this.container.innerHTML = `
            <div class="sticky top-0 z-10 bg-dark-bg/80 backdrop-blur-md" style="padding-top: env(safe-area-inset-top);">
                <div class="flex items-center px-4 py-4 justify-between max-w-md mx-auto">
                    <div id="mypage-back" class="flex size-10 items-center justify-center cursor-pointer active:scale-90 transition-transform">
                        <span class="material-symbols-outlined text-2xl text-white">arrow_back_ios</span>
                    </div>
                    <h2 class="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">마이페이지</h2>
                </div>
            </div>
            <main class="max-w-md mx-auto pb-16">
                <div class="flex flex-col items-center pt-6 pb-6 gap-3">
                    <div class="relative">
                        <div class="bg-field-bg p-1.5 rounded-full border border-primary/20 shadow-lg">
                            <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-28 h-28 bg-[#2A2635]" 
                                 style='background-image: url("${profileImg}");'>
                            </div>
                        </div>
                        <div class="absolute bottom-1 right-1 bg-primary p-2 rounded-full border-2 border-dark-bg shadow-md cursor-pointer active:scale-95 transition-transform">
                            <span class="material-symbols-outlined text-white text-[16px] block" style="font-variation-settings: 'wght' 600;">edit</span>
                        </div>
                    </div>
                    <div class="text-center">
                        <p class="text-2xl font-bold tracking-tight text-white">${profileName}님</p>
                        <p class="text-primary text-sm font-semibold mt-1">${profileEmail}</p>
                    </div>
                </div>

                <div class="px-6 mb-6">
                    <h3 class="text-[11px] font-bold text-gray-500 uppercase tracking-[0.1em] mb-3 ml-1">이번 달 디지털 디톡스</h3>
                    <div class="bg-field-bg rounded-[24px] p-6 border border-white/5 flex items-center justify-between">
                        <div class="flex flex-col gap-2">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">auto_delete</span>
                                <p class="text-xl font-extrabold text-white leading-none">1.2GB 비워냈어요</p>
                            </div>
                            <div class="flex items-center gap-2 mt-1">
                                <div class="h-1.5 w-32 bg-zinc-800 rounded-full overflow-hidden">
                                    <div class="h-full bg-primary w-[70%]"></div>
                                </div>
                                <p class="text-primary text-xs font-bold">70% 달성</p>
                            </div>
                            <p class="text-gray-400 text-sm font-medium mt-1">이번 달 지운 사진: 428장</p>
                        </div>
                        <div class="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                            <span class="material-symbols-outlined text-primary text-3xl" style="font-variation-settings: 'FILL' 1;">cloud_done</span>
                        </div>
                    </div>
                </div>

                <div class="px-6 space-y-px bg-field-bg rounded-[24px] border border-white/5 overflow-hidden mx-6">
                    <div class="flex items-center gap-4 px-5 min-h-[64px] cursor-pointer active:bg-zinc-800 transition-colors">
                        <div class="text-primary flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-[24px]">notifications</span>
                        </div>
                        <p class="text-white text-base font-semibold flex-1">알림 설정</p>
                        <div class="shrink-0 text-zinc-600">
                            <span class="material-symbols-outlined">chevron_right</span>
                        </div>
                    </div>
                </div>

                <div class="px-6 mt-6 space-y-4">
                    <div id="logout-btn" class="flex items-center gap-4 bg-field-bg px-5 min-h-[64px] rounded-[20px] border border-white/5 cursor-pointer active:bg-zinc-800 transition-colors">
                        <div class="text-primary flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-[22px]">logout</span>
                        </div>
                        <p class="text-white text-base font-semibold flex-1">로그아웃</p>
                    </div>
                    <div id="withdraw-btn" class="flex items-center gap-4 bg-field-bg px-5 min-h-[64px] rounded-[20px] border border-white/5 cursor-pointer active:bg-zinc-800 transition-colors">
                        <div class="text-red-400 flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-[22px]">person_remove</span>
                        </div>
                        <p class="text-red-400 text-base font-semibold flex-1">회원탈퇴</p>
                    </div>
                </div>
                
                <div class="mt-8 px-6 text-center">
                    <p class="text-xs text-gray-500 font-semibold tracking-wide">recoco v2.4.0</p>
                </div>
            </main>
        `;

        this._bindEvents();
    }

    _bindEvents() {
        // Direct binding method (Reverted to ea8a547 logic for reliability)
        const backBtn = document.getElementById('mypage-back');
        const logoutBtn = document.getElementById('logout-btn');
        const withdrawBtn = document.getElementById('withdraw-btn');

        if (backBtn) {
            backBtn.onclick = () => {
                window.dispatchEvent(new CustomEvent('nav-change', { detail: 'home' }));
            };
        }

        if (logoutBtn) {
            logoutBtn.onclick = async () => {
                const { error } = await supabase.auth.signOut();
                if (error) console.error('Logout error:', error.message);
                if (this.onLogout) this.onLogout();
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
            <div class="sticky top-0 z-10 bg-dark-bg/80 backdrop-blur-md">
                <div class="flex items-center p-4 justify-between max-w-md mx-auto">
                    <div id="withdraw-back" class="flex size-10 items-center justify-center cursor-pointer hover:bg-white/5 rounded-full transition-colors">
                        <span class="material-symbols-outlined text-2xl text-white">arrow_back_ios</span>
                    </div>
                    <h2 class="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">회원 탈퇴</h2>
                </div>
            </div>
            <main class="max-w-md mx-auto px-6 pb-40">
                <div class="flex flex-col items-center py-10 gap-4 text-center">
                    <div class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                        <span class="material-symbols-outlined text-red-400 text-4xl" style="font-variation-settings: 'FILL' 1;">warning</span>
                    </div>
                    <h1 class="text-2xl font-bold tracking-tight">정말 탈퇴하시겠어요?</h1>
                    <p class="text-gray-400 text-sm leading-relaxed">탈퇴하시면 리코코의 모든 데이터가 삭제되며<br/>다시는 복구할 수 없습니다.</p>
                </div>
                <div class="bg-field-bg rounded-[24px] p-6 border border-white/5 mb-8">
                    <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">삭제되는 데이터</h3>
                    <ul class="space-y-4">
                        <li class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-gray-400 text-xl">photo_library</span>
                            <span class="text-white text-[15px] font-medium">기록된 소중한 추억들</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-gray-400 text-xl">analytics</span>
                            <span class="text-white text-[15px] font-medium">지금까지의 비움 통계</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-gray-400 text-xl">account_circle</span>
                            <span class="text-white text-[15px] font-medium">연동된 구글 계정 정보</span>
                        </li>
                    </ul>
                </div>
                <div class="mb-8">
                    <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-1">탈퇴 사유 (선택)</h3>
                    <div class="space-y-3">
                        <label class="flex items-center justify-between bg-field-bg border border-white/5 rounded-2xl px-5 py-4 cursor-pointer active:scale-[0.98] transition-all">
                            <span class="text-[15px] font-medium">기능이 부족해요</span>
                            <input class="w-5 h-5 border-2 border-zinc-700 bg-transparent text-primary focus:ring-0 focus:ring-offset-0 rounded-full" name="reason" type="radio" value="lack_features"/>
                        </label>
                        <label class="flex items-center justify-between bg-field-bg border border-white/5 rounded-2xl px-5 py-4 cursor-pointer active:scale-[0.98] transition-all">
                            <span class="text-[15px] font-medium">정리가 더 이상 필요 없어요</span>
                            <input class="w-5 h-5 border-2 border-zinc-700 bg-transparent text-primary focus:ring-0 focus:ring-offset-0 rounded-full" name="reason" type="radio" value="no_need"/>
                        </label>
                        <label class="flex items-center justify-between bg-field-bg border border-white/5 rounded-2xl px-5 py-4 cursor-pointer active:scale-[0.98] transition-all">
                            <span class="text-[15px] font-medium">다른 서비스를 이용해요</span>
                            <input class="w-5 h-5 border-2 border-zinc-700 bg-transparent text-primary focus:ring-0 focus:ring-offset-0 rounded-full" name="reason" type="radio" value="other_service"/>
                        </label>
                    </div>
                </div>
                <div class="flex items-start gap-3 px-1 mb-10">
                    <input class="mt-0.5 w-5 h-5 rounded border-2 border-zinc-700 bg-transparent text-primary focus:ring-0 focus:ring-offset-0" id="withdraw-confirm-checkbox" type="checkbox"/>
                    <label class="text-sm text-gray-400 font-medium leading-snug" for="withdraw-confirm-checkbox">모든 데이터가 삭제됨을 확인했으며 이에 동의합니다.</label>
                </div>
            </main>
            <div class="fixed bottom-0 left-0 right-0 bg-dark-bg/95 backdrop-blur-xl border-t border-white/5 px-6 pb-10 pt-4 z-50">
                <div class="max-w-md mx-auto flex flex-col gap-3">
                    <button id="withdraw-keep-btn" class="w-full py-4 bg-primary text-dark-bg font-bold rounded-[20px] text-base active:scale-[0.97] transition-all">
                        계정 유지하기
                    </button>
                    <button id="withdraw-proceed-btn" class="w-full py-4 bg-zinc-800 text-gray-400 font-bold rounded-[20px] text-base active:scale-[0.97] transition-all disabled:opacity-50" disabled>
                        탈퇴하기
                    </button>
                </div>
            </div>

            <!-- Confirmation Modal -->
            <div id="withdraw-modal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center px-8 hidden">
                <div class="bg-field-bg w-full max-w-xs rounded-[28px] border border-white/5 overflow-hidden shadow-2xl">
                    <div class="p-8 text-center">
                        <h3 class="text-xl font-bold mb-3 tracking-tight">탈퇴를 진행할까요?</h3>
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

        // Back button - return to mypage
        if (backBtn) {
            backBtn.onclick = () => this.render();
        }

        // Keep account button - return to mypage
        if (keepBtn) {
            keepBtn.onclick = () => this.render();
        }

        // Enable/disable proceed button based on checkbox
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

        // Proceed button - show confirmation modal
        if (proceedBtn && modal) {
            proceedBtn.onclick = () => {
                if (!proceedBtn.disabled) {
                    modal.classList.remove('hidden');
                }
            };
        }

        // Modal cancel button
        if (modalCancel && modal) {
            modalCancel.onclick = () => modal.classList.add('hidden');
        }

        // Modal confirm button - actual withdrawal
        if (modalConfirm) {
            modalConfirm.onclick = () => this._performWithdrawal();
        }

        // Close modal on outside click
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            };
        }
    }

    /**
     * Perform actual account withdrawal
     */
    async _performWithdrawal() {
        const modal = document.getElementById('withdraw-modal');
        const modalConfirm = document.getElementById('withdraw-modal-confirm');

        // Get selected reason
        const reasonInput = document.querySelector('input[name="reason"]:checked');
        const reason = reasonInput ? reasonInput.value : 'not_specified';

        try {
            // Show loading state
            if (modalConfirm) {
                modalConfirm.textContent = '처리 중...';
                modalConfirm.disabled = true;
            }

            // 1. 서버에 계정 삭제 요청 (실제 Supabase 계정 삭제)
            let userId = this.user?.id;
            if (!userId) {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    userId = user?.id;
                } catch (e) {
                    console.error('[WITHDRAW] Failed to get user:', e);
                }
            }

            console.log('[WITHDRAW] userId:', userId, 'reason:', reason);

            if (userId) {
                try {
                    const baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/$/, '');
                    const response = await fetch(`${baseUrl}/api/v1/delete-account`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: userId, reason })
                    });

                    const data = await response.json().catch(() => null);
                    console.log('[WITHDRAW] Server:', response.status, data?.message);
                } catch (serverErr) {
                    console.warn('[WITHDRAW] Server request failed:', serverErr);
                }
            }

            // 2. Sign out
            await supabase.auth.signOut({ scope: 'global' }).catch(() => {});

            // 3. Clear all client-side storage
            delete window.supabaseInstance;
            localStorage.clear();
            sessionStorage.clear();
            try {
                const dbs = await indexedDB.databases();
                dbs.forEach(db => db.name && indexedDB.deleteDatabase(db.name));
            } catch (_) {}
            document.cookie.split(";").forEach(c => {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });

            console.log('[WITHDRAW] Complete');
            this._showFarewellView();

        } catch (err) {
            console.error('[WITHDRAW] Error:', err);
            alert('탈퇴 처리 중 오류가 발생했습니다. 다시 시도해주세요.');

            if (modalConfirm) {
                modalConfirm.textContent = '탈퇴하기';
                modalConfirm.disabled = false;
            }
            if (modal) {
                modal.classList.add('hidden');
            }
        }
    }

    /**
     * Show farewell screen after withdrawal
     */
    _showFarewellView() {
        this.container.innerHTML = `
            <main class="flex-1 flex flex-col items-center justify-center px-8 text-center max-w-md mx-auto min-h-screen">
                <div class="relative mb-12 flex justify-center items-center">
                    <div class="absolute w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
                    <div class="relative" style="filter: drop-shadow(0 0 20px rgba(178, 165, 207, 0.3));">
                        <span class="material-symbols-outlined text-[120px] text-primary/80 leading-none select-none" style="font-variation-settings: 'FILL' 0, 'wght' 200;">
                            water_drop
                        </span>
                        <div class="absolute -top-2 -right-2">
                            <span class="material-symbols-outlined text-4xl text-primary/60">waves</span>
                        </div>
                    </div>
                </div>
                <h1 class="text-2xl font-medium tracking-tight leading-relaxed mb-6 whitespace-pre-line">
                    비움이 당신에게
                    휴식이 되었길 바랍니다.
                </h1>
                <p class="text-gray-400 text-[15px] leading-7 font-light mb-12 break-keep">
                    언제든 마음이 무거워질 때 다시 리코코를 찾아주세요.
                    그동안 함께 비울 수 있어 고마웠습니다.
                </p>
                <button id="farewell-btn" class="px-10 py-3 rounded-full border border-white/10 text-gray-500 text-sm font-medium hover:text-white transition-colors active:scale-95">
                    안녕히 가세요
                </button>
            </main>
        `;

        const farewellBtn = document.getElementById('farewell-btn');
        if (farewellBtn) {
            farewellBtn.onclick = () => {
                // 강제 새로고침 (캐시 무시)
                window.location.href = window.location.origin + window.location.pathname;
            };
        }
    }
}
