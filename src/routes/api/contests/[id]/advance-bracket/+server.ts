import { json, error } from '@sveltejs/kit';
import { extractToken, validateAdminToken } from '$lib/server/auth';
import { getContest, advanceBracket, getCurrentBracketRound, areBracketsComplete, completeContest } from '$lib/server/contest';
import { broadcast } from '$lib/server/sse';
import { createLogger } from '$lib/server/logger';

const log = createLogger('brackets');

export async function POST({ params, request, url }) {
    const token = extractToken(request);
    if (!token) return error(401, 'Token manquant');

    const isAdmin = await validateAdminToken(token, params.id);
    if (!isAdmin) return error(403, 'Token invalide');

    const contest = await getContest(params.id);
    if (!contest) return error(404, 'Concours introuvable');
    if (contest.status !== 'finals') {
        return error(400, 'Le concours n\'est pas en phase finale');
    }

    const bracket = url.searchParams.get('bracket');
    if (bracket !== 'principale' && bracket !== 'consolante') {
        return error(400, 'Paramètre bracket invalide (principale ou consolante)');
    }

    const state = await getCurrentBracketRound(params.id, bracket);
    if (!state) return error(404, 'Aucun match de bracket trouvé');
    if (!state.allCompleted) {
        return error(400, 'Tous les matchs du tour actuel ne sont pas terminés');
    }

    const created = await advanceBracket(params.id, bracket);

    if (created === 0 && await areBracketsComplete(params.id)) {
        await completeContest(params.id);
        log.info('Contest completed', { contestId: params.id });
    }

    broadcast(params.id);

    return json({
        bracket,
        newMatches: created,
        bracketComplete: created === 0,
    });
}
