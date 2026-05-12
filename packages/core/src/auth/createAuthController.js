/**
 * AuthController — OAuth, deep link, session lifecycle.
 *
 * See:
 *   - docs/refactor/headless-core-agent-instructions.md §6 Auth controller
 *   - docs/refactor/slice-3-controller-mapping.md §1
 *
 * Decisions (slice-3 decision log):
 *   #1 — writes `store.auth.*` ONLY. Does NOT call navigation directly.
 *        Navigation reaction lives in `createDomApp.js` / future reactor.
 *   #3 — `handleUrl` calls `browserPort.close()` itself (matches main.js:80,
 *        instruction §6 assigns Browser open/close to Auth).
 *   #4 — `restoreSession()` calls `authPort.getSession()` only. Launch URL
 *        handling stays in `init()` orchestration.
 *
 * Redirect URL rule (instruction §6):
 *   - native: `com.narrativeai.appv://login-callback`
 *   - web: supplied via `options.webRedirectOrigin` because core cannot
 *          read host location info directly (no platform globals).
 *
 * @param {{
 *   authPort: Object,
 *   appPort: { isNative: () => boolean, getLaunchUrl: () => Promise<{ url?: string }|null>, addListener: Function },
 *   browserPort: { open: (options: Object) => Promise<void>, close: () => Promise<void> },
 *   store: Object,
 *   normalizeError: (error: any, context?: string) => Object,
 *   webRedirectOrigin?: string
 * }} deps
 */
const NATIVE_REDIRECT_URL = 'com.narrativeai.appv://login-callback';
const AUTH_CONTEXT = 'auth';
const NATIVE_DEEP_LINK_DELAY_MS = 150;

export function createAuthController({
    authPort,
    appPort,
    browserPort,
    store,
    normalizeError,
    webRedirectOrigin = ''
} = {}) {
    const writeAuth = (patch) => {
        store.patch({ auth: patch });
    };

    const writeError = (error) => {
        const normalized = normalizeError
            ? normalizeError(error, AUTH_CONTEXT)
            : { message: 'auth_error', context: AUTH_CONTEXT, code: null, cause: error };
        writeAuth({ status: 'error', error: normalized });
    };

    const applySession = (session) => {
        const user = session?.user || null;
        writeAuth({
            user,
            session: session || null,
            status: session ? 'signed_in' : 'signed_out',
            error: null
        });
    };

    const handleAuthEvent = (event, session) => {
        if (event === 'SIGNED_IN') {
            const user = session?.user || null;
            writeAuth({ user, session: session || null, status: 'signed_in', error: null });
            return;
        }
        if (event === 'SIGNED_OUT') {
            writeAuth({ user: null, session: null, status: 'signed_out', error: null });
        }
    };

    const parseCallbackParts = (urlStr) => {
        let accessToken = null;
        let refreshToken = null;
        let code = null;
        const parts = String(urlStr).split(/[#?&]/);
        for (const part of parts) {
            if (part.startsWith('access_token=')) accessToken = part.slice('access_token='.length);
            else if (part.startsWith('refresh_token=')) refreshToken = part.slice('refresh_token='.length);
            else if (part.startsWith('code=')) code = part.slice('code='.length);
        }
        return { accessToken, refreshToken, code };
    };

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    return {
        async init() {
            writeAuth({ status: 'checking', error: null });

            try {
                authPort.onAuthStateChange((event, session) => {
                    handleAuthEvent(event, session);
                });
            } catch (error) {
                writeError(error);
            }

            try {
                appPort.addListener('appUrlOpen', (data) => {
                    if (data && typeof data.url === 'string') {
                        // Fire-and-forget; handleUrl writes its own error state.
                        this.handleUrl(data.url);
                    }
                });
            } catch (error) {
                writeError(error);
            }

            try {
                const launchUrl = await appPort.getLaunchUrl();
                if (launchUrl && launchUrl.url) {
                    await this.handleUrl(launchUrl.url);
                }
            } catch (error) {
                writeError(error);
            }

            await this.restoreSession();
        },

        async startGoogleOAuth() {
            writeAuth({ status: 'oauth_starting', error: null });

            try {
                const isNative = appPort && appPort.isNative ? appPort.isNative() : false;
                const redirectTo = isNative ? NATIVE_REDIRECT_URL : webRedirectOrigin;
                const data = await authPort.signInWithOAuth('google', {
                    redirectTo,
                    skipBrowserRedirect: isNative
                });

                if (isNative && data && data.url) {
                    await browserPort.open({ url: data.url, presentationStyle: 'fullscreen' });
                }

                writeAuth({ status: 'oauth_pending' });
            } catch (error) {
                writeError(error);
            }
        },

        async handleUrl(urlStr) {
            if (!urlStr) return;

            // Match native deep-link timing from main.js:77 — give the native
            // layer a moment before browser close + token exchange.
            await delay(NATIVE_DEEP_LINK_DELAY_MS);

            try {
                await browserPort.close();
            } catch (_) {
                // Swallow — matches main.js:80 non-fatal close behavior.
            }

            try {
                const { accessToken, refreshToken, code } = parseCallbackParts(urlStr);
                if (accessToken && refreshToken) {
                    await authPort.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });
                    writeAuth({ error: null });
                } else if (code) {
                    await authPort.exchangeCodeForSession(code);
                    writeAuth({ error: null });
                }
                // If neither tokens nor code present, no state change — auth
                // state listener will reflect any side-effect session change.
            } catch (error) {
                writeError(error);
            }
        },

        async restoreSession() {
            writeAuth({ status: 'checking', error: null });

            try {
                const result = await authPort.getSession();
                applySession(result?.session || null);
            } catch (error) {
                writeError(error);
            }
        },

        async signOut(options) {
            writeAuth({ status: 'signing_out', error: null });

            try {
                await authPort.signOut(options);
                writeAuth({ user: null, session: null, status: 'signed_out', error: null });
            } catch (error) {
                writeError(error);
            }
        },

        getViewModel() {
            const auth = store.get('auth') || {};
            const status = typeof auth.status === 'string' ? auth.status : 'unknown';
            const isAuthenticated = status === 'signed_in' && Boolean(auth.user);
            const isChecking = status === 'checking' || status === 'oauth_starting' || status === 'oauth_pending' || status === 'signing_out';
            const canStartOAuth = status === 'signed_out' || status === 'unknown' || status === 'error';

            return {
                user: auth.user || null,
                session: auth.session || null,
                status,
                error: auth.error || null,
                isAuthenticated,
                isChecking,
                canStartOAuth
            };
        }
    };
}
