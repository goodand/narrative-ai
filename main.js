/**
 * RECOCO - Narrative AI Application
 * Thin bootstrap (slice 4): construct ports + core + DOM app, then init.
 *
 * See:
 *   - docs/refactor/headless-core-agent-instructions.md §6 conversion table
 *   - docs/refactor/slice-4-integration-mapping.md §12 decision log
 *
 * Decisions in effect:
 *   #1 A3 — pure additive integration (auth/notifications via core).
 *   #5 A  — legacy `store.checkAndResetDaily()` retained here.
 *   slice-6 H2 — `window.__bootErrors` is owned exclusively by this file;
 *                `createDomApp` writes into an injected `bootErrors` object.
 */

import './style.css';
import { store as legacyStore } from './src/state/StateManager.js';
import { createAppPorts } from './src/adapters/createAppPorts.js';
import { createRecocoCore } from '@recoco/core';
import { createDomApp } from './src/ui/dom/createDomApp.js';

const bootErrors = {};
window.__bootErrors = bootErrors;

const rootEls = {
    navHome: document.getElementById('nav-home'),
    navReport: document.getElementById('nav-report'),
    navMypage: document.getElementById('nav-mypage'),
    homeView: document.getElementById('home-view'),
    reportView: document.getElementById('report-view'),
    inputView: document.getElementById('input-view'),
    resultView: document.getElementById('result-view'),
    header: document.querySelector('header'),
    headerTitle: document.getElementById('header-title'),
    backBtn: document.getElementById('back-btn'),
    bottomBar: document.getElementById('bottom-action-bar'),
    mypageView: document.getElementById('mypage-view'),
    noticeView: document.getElementById('notice-view')
};

async function initApp() {
    console.log('[BOOT] Starting initApp...');
    try {
        legacyStore.checkAndResetDaily();

        const ports = createAppPorts();
        const core = createRecocoCore(ports, { webRedirectOrigin: window.location.origin });
        createDomApp({ core, rootEls, bootErrors });

        await core.notifications.init(core.navigation);
        await core.auth.init();
    } catch (err) {
        console.error('[BOOT] Critical initApp failure:', err);
        bootErrors.initApp = err && err.message ? err.message : String(err);
    }
}

initApp();
