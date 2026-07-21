const PX_PER_SECOND = 50;
const PAUSE_MS = 3000;

export type AutoScrollHandle = {
    stop: () => void;
};

/**
 * Auto-scrolls an element at a constant speed (50px/s), pausing at top and bottom.
 * Loops infinitely. Call `handle.stop()` to cancel.
 */
export function autoScroll(el: HTMLElement): AutoScrollHandle {
    let frame: number | null = null;
    let start: number | null = null;

    const scrollHeight = el.scrollHeight - el.clientHeight;
    if (scrollHeight <= 0) {
        return { stop: () => {} };
    }

    const scrollDuration = Math.max((scrollHeight / PX_PER_SECOND) * 1000, 4000);
    const totalDuration = PAUSE_MS + scrollDuration + PAUSE_MS;

    function step(now: number) {
        if (!start) start = now;
        const elapsed = (now - start) % totalDuration;

        if (elapsed < PAUSE_MS) {
            el.scrollTop = 0;
        } else if (elapsed < PAUSE_MS + scrollDuration) {
            const progress = (elapsed - PAUSE_MS) / scrollDuration;
            el.scrollTop = scrollHeight * progress;
        } else {
            el.scrollTop = scrollHeight;
        }
        frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);

    return {
        stop() {
            if (frame) cancelAnimationFrame(frame);
            frame = null;
        },
    };
}

/**
 * Auto-scrolls once (not looping), then calls `onDone`.
 * Pauses at top and bottom before/after scrolling.
 */
export function autoScrollOnce(el: HTMLElement, onDone?: () => void): AutoScrollHandle {
    let frame: number | null = null;
    let start: number | null = null;

    const scrollHeight = el.scrollHeight - el.clientHeight;
    if (scrollHeight <= 0) {
        onDone?.();
        return { stop: () => {} };
    }

    const scrollDuration = Math.max((scrollHeight / PX_PER_SECOND) * 1000, 4000);
    const totalDuration = PAUSE_MS + scrollDuration + PAUSE_MS;

    function step(now: number) {
        if (!start) start = now;
        const elapsed = now - start;

        if (elapsed < PAUSE_MS) {
            el.scrollTop = 0;
        } else if (elapsed < PAUSE_MS + scrollDuration) {
            const progress = (elapsed - PAUSE_MS) / scrollDuration;
            el.scrollTop = scrollHeight * progress;
        } else if (elapsed < totalDuration) {
            el.scrollTop = scrollHeight;
        } else {
            el.scrollTop = scrollHeight;
            onDone?.();
            return;
        }
        frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);

    return {
        stop() {
            if (frame) cancelAnimationFrame(frame);
            frame = null;
        },
    };
}

/**
 * Returns the total duration (in ms) an autoScrollOnce would take for the given element.
 */
export function autoScrollDuration(el: HTMLElement): number {
    const scrollHeight = el.scrollHeight - el.clientHeight;
    if (scrollHeight <= 0) return 0;
    const scrollDuration = Math.max((scrollHeight / PX_PER_SECOND) * 1000, 4000);
    return PAUSE_MS + scrollDuration + PAUSE_MS;
}
