/**
 * Headless reactive store for the RECOCO core.
 *
 * Decided behaviors (slice 1 — fixed contract):
 *   1. getState()         deep clone of internal state (never expose live ref)
 *   2. get(path)          dot-path read; missing path returns undefined
 *   3. set(path, value)   dot-path write; creates intermediate plain objects
 *   4. patch(partial)     deep merge; arrays REPLACE; primitives overwrite
 *   5. subscribe(cb)      returns unsubscribe; cb signature is fixed:
 *                         (nextState, prevState, change)
 *                         change = { path, value } | { patch }
 *   6. resetTransient()   resets only: input, result, report, account.withdrawal
 *                         preserves: auth, permissions, notifications,
 *                                    navigation, account.profile
 *
 * Independent of legacy state managers — does not delegate to any
 * pre-existing listener registry that may be a placeholder.
 */

const cloneValue = (value) => {
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
};

const isPlainObject = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

const buildInitialState = () => ({
    auth: { user: null, session: null, status: 'unknown', error: null },
    permissions: {
        photo: {
            authorized: false,
            status: null,
            reason: null,
            checking: false,
            requesting: false
        }
    },
    notifications: { enabled: false, status: 'idle', error: null },
    navigation: { currentView: 'home', history: ['home'] },
    home: {
        status: 'idle',
        error: null,
        photos: [],
        currentIndex: 0,
        headerMessage: '기기에서 찾아낸 비우기 좋은 기록들입니다.',
        nextBatch: null,
        isRefilling: false
    },
    input: {
        base64: null,
        dataUrl: null,
        metadata: {},
        meaning: '',
        tags: '',
        status: 'idle',
        error: null
    },
    result: {
        currentResult: null,
        editMode: false,
        copyStatus: 'idle',
        shareStatus: 'idle',
        error: null
    },
    report: { status: 'idle', error: null, stats: null },
    account: {
        profile: null,
        status: 'idle',
        error: null,
        withdrawal: { reason: 'not_specified', confirmed: false }
    }
});

const buildTransientReset = () => {
    const initial = buildInitialState();
    return {
        input: initial.input,
        result: initial.result,
        report: initial.report,
        accountWithdrawal: initial.account.withdrawal
    };
};

const splitPath = (path) => {
    if (typeof path !== 'string' || path.length === 0) return [];
    return path.split('.');
};

const readPath = (root, segments) => {
    let cursor = root;
    for (const segment of segments) {
        if (cursor === null || typeof cursor !== 'object') return undefined;
        cursor = cursor[segment];
    }
    return cursor;
};

const writePath = (root, segments, value) => {
    if (segments.length === 0) return;
    let cursor = root;
    for (let i = 0; i < segments.length - 1; i += 1) {
        const segment = segments[i];
        if (!isPlainObject(cursor[segment])) {
            cursor[segment] = {};
        }
        cursor = cursor[segment];
    }
    cursor[segments[segments.length - 1]] = value;
};

const deepMerge = (target, source) => {
    if (!isPlainObject(target) || !isPlainObject(source)) {
        return source;
    }
    const result = { ...target };
    for (const key of Object.keys(source)) {
        const nextValue = source[key];
        const prevValue = result[key];
        if (Array.isArray(nextValue)) {
            // Arrays REPLACE — no concat / dedup.
            result[key] = nextValue;
        } else if (isPlainObject(nextValue) && isPlainObject(prevValue)) {
            result[key] = deepMerge(prevValue, nextValue);
        } else {
            result[key] = nextValue;
        }
    }
    return result;
};

export const createStore = () => {
    let state = buildInitialState();
    const listeners = new Set();

    const snapshot = () => cloneValue(state);

    const notify = (prev, change) => {
        if (listeners.size === 0) return;
        const nextSnapshot = cloneValue(state);
        const prevSnapshot = prev;
        for (const listener of listeners) {
            listener(nextSnapshot, prevSnapshot, change);
        }
    };

    const getState = () => snapshot();

    const get = (path) => readPath(state, splitPath(path));

    const set = (path, value) => {
        const segments = splitPath(path);
        if (segments.length === 0) return;
        const prev = cloneValue(state);
        writePath(state, segments, value);
        notify(prev, { path, value });
    };

    const patch = (partial) => {
        if (!isPlainObject(partial)) return;
        const prev = cloneValue(state);
        state = deepMerge(state, partial);
        notify(prev, { patch: partial });
    };

    const subscribe = (callback) => {
        if (typeof callback !== 'function') {
            return () => {};
        }
        listeners.add(callback);
        return () => {
            listeners.delete(callback);
        };
    };

    const resetTransient = () => {
        const reset = buildTransientReset();
        const prev = cloneValue(state);
        state.input = reset.input;
        state.result = reset.result;
        state.report = reset.report;
        if (!isPlainObject(state.account)) {
            state.account = { profile: null, status: 'idle', withdrawal: reset.accountWithdrawal };
        } else {
            state.account.withdrawal = reset.accountWithdrawal;
        }
        notify(prev, { patch: {
            input: reset.input,
            result: reset.result,
            report: reset.report,
            account: { withdrawal: reset.accountWithdrawal }
        } });
    };

    return {
        getState,
        get,
        set,
        patch,
        subscribe,
        resetTransient
    };
};
