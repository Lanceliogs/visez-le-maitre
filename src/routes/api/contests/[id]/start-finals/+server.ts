import { json, error } from '@sveltejs/kit';
import { extractToken, validateAdminToken } from '$lib/server/auth';
import { getContest, getContestMatches, computeQualifications, generateBracket, updateContestStatus } from '$lib/server/contest';
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

    const allMatches = await getContestMatches(params.id);
    const poolMatches = allMatches.filter(m => m.poolId !== null);
    const allCompleted = poolMatches.every(m => m.status === 'completed');
    if (!allCompleted) {
        return error(400, 'Tous les matchs de poule ne sont pas terminés');
    }

    const qualifications = await computeQualifications(params.id);
    const principale = qualifications
        .filter(q => q.qualification === 'principale')
        .map(q => ({ teamId: q.teamId, rank: q.rank }));
    const consolante = qualifications
        .filter(q => q.qualification === 'consolante')
        .map((q, i) => ({ teamId: q.teamId, rank: i + 1 }));

    if (principale.length < 2 || (principale.length & (principale.length - 1)) !== 0) {
        return error(400, `Le nombre de qualifiés principale (${principale.length}) doit être une puissance de 2`);
    }
    if (consolante.length < 2 || (consolante.length & (consolante.length - 1)) !== 0) {
        return error(400, `Le nombre de qualifiés consolante (${consolante.length}) doit être une puissance de 2`);
    }

    await generateBracket(params.id, principale, 'principale');
    await generateBracket(params.id, consolante, 'consolante');
    await updateContestStatus(params.id, 'finals');

    broadcast(params.id);
    log.info('Finals started', {
        contestId: params.id,
        principale: principale.length,
        consolante: consolante.length,
    });

    return json({
        principale: principale.length,
        consolante: consolante.length,
    });
}
