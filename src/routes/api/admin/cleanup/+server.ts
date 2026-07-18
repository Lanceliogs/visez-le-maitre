import { json, error } from '@sveltejs/kit';
import { validateAppAdmin } from '$lib/server/auth';
import { cleanupStaleContests } from '$lib/server/contest/cleanup';
import { createLogger } from '$lib/server/logger';

const log = createLogger('cleanup');

export async function POST({ request }) {
    if (!validateAppAdmin(request)) return error(401, 'Accès refusé');

    const { maxAgeDays } = await request.json().catch(() => ({}));
    const deleted = await cleanupStaleContests(maxAgeDays);
    log.info('Manual cleanup done', { deleted, maxAgeDays });

    return json({ deleted });
}
