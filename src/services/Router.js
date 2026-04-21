/**
 * Router - Manages view navigation and history
 */

export class Router {
    constructor(elements) {
        this.els = elements;
        this.history = ['home'];
        this.currentView = 'home';
        this.viewManagers = {}; // { home: homeManager, report: reportManager, ... }
    }

    registerManager(viewName, manager) {
        this.viewManagers[viewName] = manager;
    }

    navigate(viewName, addToHistory = true) {
        console.log(`[ROUTER] Switching to: ${viewName}`);

        if (addToHistory && viewName !== this.currentView) {
            this.history.push(viewName);
        }
        this.currentView = viewName;

        // 1. Hide all views (Automated for all elements ending with 'View')
        Object.keys(this.els).forEach(key => {
            if (key.endsWith('View') && this.els[key]) {
                this.els[key].classList.add('hidden');
                this.els[key].style.display = 'none';
            }
        });

        // 2. Control Bottom Bar (Generate Button Area)
        const genBtnContainer = this.els.bottomBar.querySelector('div:first-child');
        if (genBtnContainer) {
            genBtnContainer.style.display = (viewName === 'input') ? 'block' : 'none';
        }

        // 3. Control Header Visibility
        const isMainTab = ['home', 'report', 'mypage', 'notice'].includes(viewName);
        this.els.header.style.display = isMainTab ? 'none' : 'flex';

        // 4. Control Bottom Bar Visibility - Always visible for stability
        this.els.bottomBar.style.display = 'block';

        // 5. Update Navigation Tabs
        this._updateTabState(viewName);

        // 6. Show Target View & Render
        this._showTargetView(viewName);

        window.scrollTo(0, 0);
    }

    goBack() {
        if (this.history.length > 1) {
            this.history.pop();
            const previousView = this.history[this.history.length - 1];
            this.navigate(previousView, false);
        } else {
            this.navigate('home', false);
        }
    }

    _updateTabState(viewName) {
        [this.els.navHome, this.els.navReport, this.els.navMypage].forEach(nav => {
            if (nav) {
                nav.classList.remove('text-primary');
                nav.classList.add('opacity-40');
                const icon = nav.querySelector('.material-symbols-outlined');
                if (icon) icon.style.fontVariationSettings = "'FILL' 0";
            }
        });

        let activeNav = null;
        if (viewName === 'home' || viewName === 'input' || viewName === 'result') activeNav = this.els.navHome;
        else if (viewName === 'report') activeNav = this.els.navReport;
        else if (viewName === 'mypage') activeNav = this.els.navMypage;

        if (activeNav) {
            activeNav.classList.add('text-primary');
            activeNav.classList.remove('opacity-40');
            const icon = activeNav.querySelector('.material-symbols-outlined');
            if (icon) icon.style.fontVariationSettings = "'FILL' 1";
        }
    }

    _showTargetView(viewName) {
        let targetEl = null;
        if (viewName === 'home') targetEl = this.els.homeView;
        else if (viewName === 'input') targetEl = this.els.inputView;
        else if (viewName === 'report') targetEl = this.els.reportView;
        else if (viewName === 'mypage') targetEl = this.els.mypageView;
        else if (viewName === 'notice') targetEl = this.els.noticeView;
        else if (viewName === 'result') targetEl = this.els.resultView;

        if (targetEl) {
            targetEl.classList.remove('hidden');
            targetEl.style.display = 'block';

            // Trigger Component Render
            if (this.viewManagers[viewName]) {
                try {
                    const renderResult = this.viewManagers[viewName].render();
                    if (renderResult && typeof renderResult.catch === 'function') {
                        renderResult.catch(error => {
                            console.error(`[ROUTER] ${viewName} render failed:`, error);
                        });
                    }
                } catch (error) {
                    console.error(`[ROUTER] ${viewName} render failed:`, error);
                }
            }

            // Update Header Title based on view
            if (viewName === 'input') this.els.headerTitle.innerText = '리코코 상세 기록 설정';
            else if (viewName === 'result') this.els.headerTitle.innerText = '리코코 기록 결과';
        }
    }
}
