import { json, error } from '@sveltejs/kit';
import { db, contests } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { extractToken, validateAdminToken } from '$lib/server/auth';
import { getContest } from '$lib/server/contest';
import { getContestMatches } from '$lib/server/contest/matches';
import { broadcast } from '$lib/server/sse';
import { createLogger } from '$lib/server/logger';

const log = createLogger('contest');

export async function POST({ params, request }) {
    const token = extractToken(request);
    if (!token) return error(401, 'Token manquant');

    const isAdmin = await validateAdminToken(token, params.id);
    if (!isAdmin) return error(403, 'Token invalide');

    const contest = await getContest(params.id);
    if (!contest) return error(404, 'Concours introuvable');
    if (contest.status !== 'pools') {
        return error(400, 'Le concours n\'est pas en phase de poules');
    }

    const matches = await getContestMatches(params.id);
    const allCompleted = matches.every(m => m.status === 'completed');
    if (!allCompleted) {
        return error(400, 'Tous les matchs de poule ne sont pas terminés');
    }

    await db.update(contests)
        .set({ status: 'finals', lastActivityAt: new Date().toISOString() })
        .where(eq(contests.id, params.id));

    broadcast(params.id);
    log.info('Finals started', { contestId: params.id });
    return json({ ok: true });
}
