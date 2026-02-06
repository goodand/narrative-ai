/**
 * ErrorHandler - 중앙 에러 처리 및 토스트 UI
 * alert() 대신 토스트 메시지로 통일하고, 발생 위치를 자동 기록합니다.
 */

const TOAST_DURATION = 4000;
const TOAST_CONTAINER_ID = 'toast-container';

export const ErrorLevel = {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
};

let toastContainer = null;

function ensureContainer() {
    if (toastContainer && document.body.contains(toastContainer)) return toastContainer;
    toastContainer = document.getElementById(TOAST_CONTAINER_ID);
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = TOAST_CONTAINER_ID;
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

/**
 * 화면 하단에 토스트 메시지를 표시합니다.
 * @param {string} message - 표시할 메시지
 * @param {string} level - ErrorLevel (info/warn/error)
 * @param {number} duration - 표시 시간 (ms)
 */
export function showToast(message, level = ErrorLevel.INFO, duration = TOAST_DURATION) {
    const container = ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${level}`;
    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });

    const timer = setTimeout(() => dismiss(toast), duration);
    toast.addEventListener('click', () => {
        clearTimeout(timer);
        dismiss(toast);
    });
}

function dismiss(toast) {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    // fallback: 애니메이션이 실행되지 않는 경우 대비
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
}

/**
 * 에러를 중앙에서 처리합니다: 콘솔 기록 + 토스트 표시.
 * @param {Error|string} error - 에러 객체 또는 메시지
 * @param {string} context - 발생 위치 (예: 'HomeManager', 'PhotoDelete')
 * @param {object} options
 * @param {string} options.level - ErrorLevel (기본: ERROR)
 * @param {string} options.userMessage - 사용자에게 보여줄 메시지 (없으면 자동 매핑)
 * @param {boolean} options.silent - true면 토스트 없이 콘솔만 기록
 */
export function handleError(error, context = '', options = {}) {
    const { level = ErrorLevel.ERROR, userMessage, silent = false } = options;
    const source = context ? `[${context}]` : '';
    const raw = error?.message || String(error);

    // 1. 콘솔에 항상 기록 (개발자 추적용)
    if (level === ErrorLevel.WARN) {
        console.warn(`${source} ${raw}`, error);
    } else {
        console.error(`${source} ${raw}`, error);
    }

    // 2. 토스트 표시
    if (!silent) {
        const display = userMessage || USER_MESSAGES[context] || raw;
        showToast(display, level);
    }
}

/** context → 사용자 친화적 메시지 매핑 */
const USER_MESSAGES = {
    HomeManager: '사진 처리 중 문제가 발생했습니다.',
    PhotoDelete: '사진 삭제 중 오류가 발생했습니다.',
    Withdraw: '탈퇴 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
    Stats: '통계 기록에 실패했습니다.',
    Geocoding: '위치 정보를 가져올 수 없습니다.',
    Share: '공유 중 오류가 발생했습니다.',
    AI: 'AI 생성 중 오류가 발생했습니다.',
    Auth: '인증 처리 중 오류가 발생했습니다.',
    Notification: '알림 설정 중 오류가 발생했습니다.',
};
