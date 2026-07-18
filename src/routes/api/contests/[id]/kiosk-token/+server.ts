import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { kioskTokens } from '$lib/server/db/schema_sqlite';
import { eq } from 'drizzle-orm';
import { extractToken, validateAdminToken } from '$lib/server/auth';
import { getContest } from '$lib/server/contest';
import { createLogger } from '$lib/server/logger';

const log = createLogger('kiosk');

export async function POST({ params, request }) {
    const token = extractToken(request);
    if (!token) return error(401, 'Token manquant');

    const isAdmin = await validateAdminToken(token, params.id);
    if (!isAdmin) return error(403, 'Token invalide');

    const contest = await getContest(params.id);
    if (!contest) return error(404, 'Concours introuvable');

    const kioskToken = crypto.randomUUID();
    await db.insert(kioskTokens).values({
        token: kioskToken,
        contestId: params.id,
        createdAt: new Date().toISOString(),
    });

    log.info('Kiosk token created', { contestId: params.id });
    return json({ token: kioskToken });
}

export async function GET({ params, url }) {
    const token = url.searchParams.get('token');
    if (!token) return error(400, 'Token manquant');

    const record = await db.query.kioskTokens.findFirst({
        where: eq(kioskTokens.token, token),
    });

    if (!record || record.contestId !== params.id) {
        return error(404, 'Token kiosque invalide');
    }

    return json({ valid: true });
}
