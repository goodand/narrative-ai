/**
 * AccountPort adapter — backend account-delete POST.
 *
 * See: packages/core/src/contracts/ports.js — AccountPort
 *
 * Decision #7 (slice-2-adapter-decisions): this adapter wraps ONLY the
 * backend POST. Signout, storage clear, and farewell UI remain controller
 * responsibilities (slice 3+). The adapter mirrors the existing
 * `MyPageManager._performWithdrawal` warn-and-continue behavior.
 *
 * @param {{
 *   baseUrl: string,
 *   fetchImpl: (input: string, init: Object) => Promise<Response>
 * }} deps
 * @returns {{ deleteAccount: (payload: { user_id: string, reason: string }) => Promise<void> }}
 */
export function createAccountApiPort({ baseUrl, fetchImpl } = {}) {
    const trimmedBase = (baseUrl || '').replace(/\/$/, '');
    return {
        async deleteAccount(payload) {
            try {
                await fetchImpl(`${trimmedBase}/api/v1/delete-account`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                console.warn('[ACCOUNT] delete-account POST failed:', err);
            }
        }
    };
}
