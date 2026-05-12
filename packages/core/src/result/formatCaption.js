/**
 * formatCaption — pure helper that splits a caption into structured segments.
 *
 * See:
 *   - docs/refactor/headless-core-agent-instructions.md §6 (Result controller)
 *   - docs/refactor/slice-3c2-controller-mapping.md §3
 *
 * Source extraction range: ResultViewer.js:113-148 (regex build + replace
 * loop). The original returns HTML; this helper returns segment objects so
 * that any UI (DOM, native, etc.) can render keyword spans without HTML
 * injection.
 *
 * Segment shape (instruction §6 line 509-518):
 *   { type: 'text', text: string }
 *   { type: 'keyword', text: string, word: string }
 *
 * Constraints:
 *   - No DOM, no store, no port, no console, no HTML.
 *   - No mutation of `keywords` array.
 *   - Pure function.
 *
 * @param {string} text     Caption text. `null`/`undefined` → empty string.
 * @param {Array<{ word: string }>} [keywords]
 * @returns {Array<{ type: 'text'|'keyword', text: string, word?: string }>}
 */

const escapeRegExp = (input) => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function formatCaption(text, keywords = []) {
    const safeText = typeof text === 'string' ? text : '';
    const list = Array.isArray(keywords) ? keywords : [];

    // Filter to entries with a non-empty word string (matches ResultViewer
    // line 116 validKeywords filter).
    const validKeywords = list.filter((item) => item && typeof item.word === 'string' && item.word.length > 0);

    if (safeText.length === 0) {
        return [{ type: 'text', text: '' }];
    }

    if (validKeywords.length === 0) {
        return [{ type: 'text', text: safeText }];
    }

    // Sort longest-first so keyword overlap resolves to the longer match
    // (matches ResultViewer line 119-121).
    const sortedKeywords = [...validKeywords].sort(
        (a, b) => (b.word.length - a.word.length)
    );

    // Map for case-insensitive lookup (matches ResultViewer line 134).
    const lookup = new Map();
    for (const item of validKeywords) {
        lookup.set(item.word.toLowerCase(), item);
    }

    const pattern = sortedKeywords
        .map((item) => `(${escapeRegExp(item.word)})`)
        .join('|');

    if (pattern.length === 0) {
        return [{ type: 'text', text: safeText }];
    }

    const regex = new RegExp(pattern, 'gi');
    const segments = [];
    let cursor = 0;
    let match;

    while ((match = regex.exec(safeText)) !== null) {
        const matchedText = match[0];
        const matchStart = match.index;
        const matchEnd = matchStart + matchedText.length;

        if (matchStart > cursor) {
            segments.push({ type: 'text', text: safeText.slice(cursor, matchStart) });
        }

        const keyword = lookup.get(matchedText.toLowerCase());
        const word = keyword ? keyword.word : matchedText;
        segments.push({ type: 'keyword', text: matchedText, word });

        cursor = matchEnd;

        // Safety: zero-width match avoidance.
        if (regex.lastIndex === matchStart) {
            regex.lastIndex = matchStart + 1;
        }
    }

    if (cursor < safeText.length) {
        segments.push({ type: 'text', text: safeText.slice(cursor) });
    }

    return segments.length > 0 ? segments : [{ type: 'text', text: safeText }];
}
