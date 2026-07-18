import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { extractToken, validateAdminToken } from '$lib/server/auth';
import { getContest, getContestTeams, startPoolPhase } from '$lib/server/contest';
import { broadcast } from '$lib/server/sse';
import { createLogger } from '$lib/server/logger';

const log = createLogger('contest');

export const POST: RequestHandler = async ({ params, request }) => {
    const token = extractToken(request);
    if (!token) throw error(401, 'Token manquant');

    const isAdmin = await validateAdminToken(token, params.id);
    if (!isAdmin) throw error(403, 'Token invalide');

    const contest = await getContest(params.id);
    if (!contest) throw error(404, 'Concours introuvable');
    if (contest.status !== 'registration') {
        throw error(400, 'Le concours n\'est plus en phase d\'inscription');
    }

    const teamList = await getContestTeams(params.id);
    if (teamList.length < 2) {
        throw error(400, 'Il faut au moins 2 équipes pour démarrer');
    }

    const poolAssignments = await startPoolPhase(params.id, contest.poolSize);
    broadcast(params.id);
    log.info('Pool phase started', { contestId: params.id, pools: poolAssignments.length, teams: teamList.length });

    return json({
        pools: poolAssignments.map(p => ({ name: p.name, teamCount: p.teamIds.length })),
    });
};
