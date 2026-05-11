/**
 * AuthPort adapter — wraps the Supabase JS client.
 *
 * See: packages/core/src/contracts/ports.js — AuthPort
 *
 * Decision #2 (slice-2-adapter-decisions): all Supabase auth calls are
 * unwrapped through one helper — `throw error` if present, otherwise
 * `return data` (or a method-specific projection where the port wants a
 * narrower shape than the Supabase wrapper).
 *
 * Side effects from the source layer (not this adapter):
 *   - `src/services/supabase.js` writes `window.supabaseInstance`.
 *   - `main.js` mutates `window.__recocoCurrentUser` on auth state changes.
 * Both stay in the boot-time integration; the adapter is pure DI.
 *
 * @param {{ supabase: { auth: Object } }} deps
 */
export function createSupabaseAuthPort({ supabase } = {}) {
    const auth = supabase.auth;

    const unwrap = ({ data, error } = {}) => {
        if (error) throw error;
        return data;
    };

    return {
        async signInWithOAuth(provider, options) {
            const data = unwrap(
                await auth.signInWithOAuth({ provider, options })
            );
            return data ? { url: data.url } : {};
        },
        async setSession(tokens) {
            unwrap(await auth.setSession(tokens));
        },
        async exchangeCodeForSession(code) {
            unwrap(await auth.exchangeCodeForSession(code));
        },
        async getSession() {
            const data = unwrap(await auth.getSession());
            const session = data?.session ?? null;
            const user = session?.user ?? null;
            return { user, session };
        },
        async getUser() {
            const data = unwrap(await auth.getUser());
            return { user: data?.user ?? null };
        },
        onAuthStateChange(callback) {
            const result = auth.onAuthStateChange(callback);
            const subscription = result?.data?.subscription;
            return {
                unsubscribe() {
                    if (subscription && typeof subscription.unsubscribe === 'function') {
                        subscription.unsubscribe();
                    }
                }
            };
        },
        async signOut(options) {
            const result = await auth.signOut(options);
            if (result?.error) throw result.error;
        }
    };
}
