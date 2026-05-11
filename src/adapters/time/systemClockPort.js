/**
 * ClockPort adapter — system clock.
 *
 * See: packages/core/src/contracts/ports.js — ClockPort
 * Decision: instruction doc §8 — clock returns `new Date()`.
 *
 * No external deps. Pure factory.
 *
 * @returns {{ now: () => Date }}
 */
export function createSystemClockPort() {
    return {
        now() {
            return new Date();
        }
    };
}
