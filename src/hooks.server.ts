import { cleanupStaleContests } from '$lib/server/contest/cleanup';

const CLEANUP_INTERVAL_MS = 8 * 60 * 60 * 1000; // 1 hour

let cleanupScheduled = false;

function scheduleCleanup() {
    if (cleanupScheduled) return;
    cleanupScheduled = true;

    cleanupStaleContests().catch(() => {});

    setInterval(() => {
        cleanupStaleContests().catch(() => {});
    }, CLEANUP_INTERVAL_MS);
}

scheduleCleanup();

export const handle = async ({ event, resolve }) => {
    return resolve(event);
};
