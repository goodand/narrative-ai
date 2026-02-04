/**
 * MyPageManager - Handles profile, settings and account management
 * 마이페이지 UI 및 관련 기능을 담당하는 클래스
 */

import { supabase } from '../services/supabase.js';

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
            <div class="sticky top-0 z-10 bg-dark-bg/80 backdrop-blur-md">
                <div class="flex items-center p-4 justify-between max-w-md mx-auto">
                    <div id="mypage-back" class="flex size-10 items-center justify-center cursor-pointer">
                        <span class="material-symbols-outlined text-2xl text-white">arrow_back_ios</span>
                    </div>
                    <h2 class="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">마이페이지</h2>
                </div>
            </div>
            <main class="max-w-md mx-auto pb-16">
                <div class="flex flex-col items-center py-8 gap-4">
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

                <div class="px-6 mb-8">
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
                    <div class="h-px bg-white/5 mx-5"></div>
                    <div class="flex items-center gap-4 px-5 min-h-[64px] cursor-pointer active:bg-zinc-800 transition-colors">
                        <div class="text-primary flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-[24px]">target</span>
                        </div>
                        <p class="text-white text-base font-semibold flex-1">일일 목표 설정</p>
                        <div class="shrink-0 text-zinc-600">
                            <span class="material-symbols-outlined">chevron_right</span>
                        </div>
                    </div>
                </div>

                <div class="px-6 mt-8 space-y-4">
                    <div id="logout-btn" class="flex items-center gap-4 bg-field-bg px-5 min-h-[64px] rounded-[20px] border border-white/5 cursor-pointer active:bg-zinc-800 transition-colors">
                        <div class="text-primary flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-[22px]">logout</span>
                        </div>
                        <p class="text-white text-base font-semibold flex-1">로그아웃</p>
                    </div>
                    <div class="flex items-center gap-4 bg-field-bg px-5 min-h-[64px] rounded-[20px] border border-white/5 cursor-pointer active:bg-zinc-800 transition-colors">
                        <div class="text-red-400 flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-[22px]">person_remove</span>
                        </div>
                        <p class="text-red-400 text-base font-semibold flex-1">회원탈퇴</p>
                    </div>
                </div>
                
                <div class="mt-12 px-6 text-center">
                    <p class="text-xs text-gray-500 font-semibold tracking-wide">recoco v2.4.0</p>
                </div>
            </main>
        `;

        this._bindEvents();
    }

    _bindEvents() {
        const backBtn = document.getElementById('mypage-back');
        const logoutBtn = document.getElementById('logout-btn');

        if (backBtn) {
            backBtn.onclick = () => {
                // 홈으로 돌아가는 이벤트 발생
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
    }
}
