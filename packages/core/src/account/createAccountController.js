/**
 * AccountController — profile, logout, withdrawal flow.
 *
 * See:
 *   - docs/refactor/headless-core-agent-instructions.md §6 Account controller
 *   - docs/refactor/slice-3b-controller-mapping.md §2
 *
 * Decisions:
 *   slice-2 #7 — `accountPort.deleteAccount(payload)` wraps only the backend
 *                POST. Signout + storage clear remain controller-slice
 *                responsibilities (this controller orchestrates them).
 *   slice-3b #2 (C) — `hydrateProfile()` reads `store.auth.user` first,
 *                falls back to `authPort.getUser()`.
 *   slice-3b #3 (A) — Uses `authPort.signOut(...)` directly. AuthController's
 *                onAuthStateChange listener (registered in `auth.init`)
 *                propagates the signed_out state to `store.auth.*`.
 *
 * Withdrawal flow order (matches MyPageManager._performWithdrawal):
 *   1. accountPort.deleteAccount({ user_id, reason })  (warn-and-continue)
 *   2. authPort.signOut({ scope: 'global' })
 *   3. storagePort.clearLocal()
 *   4. storagePort.clearSession()
 *   5. store.account.status = 'deleted'
 *
 * @param {{
 *   accountPort: { deleteAccount: (payload: { user_id: string, reason: string }) => Promise<void> },
 *   authPort: {
 *     getUser: () => Promise<{ user: Object|null }>,
 *     signOut: (options?: Object) => Promise<void>
 *   },
 *   storagePort: { clearLocal: () => void, clearSession: () => void },
 *   store: Object,
 *   normalizeError: (error: any, context?: string) => Object
 * }} deps
 */
const ACCOUNT_CONTEXT = 'account';

export function createAccountController({
    accountPort,
    authPort,
    storagePort,
    store,
    normalizeError
} = {}) {
    const writeAccount = (patch) => {
        store.patch({ account: patch });
    };

    const writeError = (error) => {
        const normalized = normalizeError
            ? normalizeError(error, ACCOUNT_CONTEXT)
            : { message: 'account_error', context: ACCOUNT_CONTEXT, code: null, cause: error };
        writeAccount({ status: 'error', error: normalized });
    };

    const resolveUserId = async () => {
        const cachedAccount = store.get('account.profile');
        if (cachedAccount && typeof cachedAccount.id === 'string') return cachedAccount.id;

        const cachedAuthUser = store.get('auth.user');
        if (cachedAuthUser && typeof cachedAuthUser.id === 'string') return cachedAuthUser.id;

        try {
            const result = await authPort.getUser();
            return result?.user?.id || null;
        } catch (_) {
            return null;
        }
    };

    return {
        async hydrateProfile() {
            writeAccount({ status: 'hydrating', error: null });

            // Decision #2C — cache-first.
            const cached = store.get('auth.user');
            if (cached) {
                writeAccount({ profile: cached, status: 'idle', error: null });
                return;
            }

            try {
                const result = await authPort.getUser();
                const user = result?.user || null;
                writeAccount({ profile: user, status: 'idle', error: null });
            } catch (error) {
                writeError(error);
            }
        },

        async logout() {
            writeAccount({ status: 'logging_out', error: null });

            try {
                await authPort.signOut();
            } catch (error) {
                writeError(error);
                return;
            }

            // AuthController.onAuthStateChange listener (slice 3a) propagates
            // signed_out to store.auth.*; this controller updates only
            // account-domain state.
            writeAccount({ profile: null, status: 'logged_out', error: null });
        },

        setWithdrawalReason(reason) {
            const safeReason = typeof reason === 'string' && reason.length > 0
                ? reason
                : 'not_specified';
            writeAccount({ withdrawal: { reason: safeReason } });
        },

        setWithdrawalConfirmed(confirmed) {
            writeAccount({ withdrawal: { confirmed: Boolean(confirmed) } });
        },

        async deleteAccount() {
            writeAccount({ status: 'deleting', error: null });

            const userId = await resolveUserId();
            const withdrawal = store.get('account.withdrawal') || {};
            const reason = typeof withdrawal.reason === 'string' && withdrawal.reason.length > 0
                ? withdrawal.reason
                : 'not_specified';

            // Step 1 — backend POST. AccountPort already swallows network
            // errors as warn-and-continue (slice-2 decision #7), so we treat
            // the call as best-effort.
            if (userId) {
                try {
                    await accountPort.deleteAccount({ user_id: userId, reason });
                } catch (error) {
                    // Adapter is supposed to swallow; if it surfaces, normalize
                    // and stop the destructive cascade.
                    writeError(error);
                    return;
                }
            }

            // Step 2 — global signOut.
            try {
                await authPort.signOut({ scope: 'global' });
            } catch (error) {
                writeError(error);
                return;
            }

            // Steps 3 + 4 — wipe persisted state.
            try {
                storagePort.clearLocal();
                storagePort.clearSession();
            } catch (error) {
                writeError(error);
                return;
            }

            // Step 5 — finalize account state.
            writeAccount({
                profile: null,
                status: 'deleted',
                error: null,
                withdrawal: { reason: 'not_specified', confirmed: false }
            });
        },

        getViewModel() {
            const slice = store.get('account') || {};
            const withdrawal = slice.withdrawal || { reason: 'not_specified', confirmed: false };
            const status = typeof slice.status === 'string' ? slice.status : 'idle';

            return {
                profile: slice.profile || null,
                status,
                withdrawal: {
                    reason: typeof withdrawal.reason === 'string' ? withdrawal.reason : 'not_specified',
                    confirmed: Boolean(withdrawal.confirmed)
                },
                error: slice.error || null,
                canDelete: Boolean(withdrawal.confirmed)
            };
        }
    };
}
