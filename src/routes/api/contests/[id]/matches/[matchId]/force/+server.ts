import { json, error } from '@sveltejs/kit';
import { extractToken, validateAdminToken } from '$lib/server/auth';
import { getMatch, forceScore } from '$lib/server/contest/matches';
import { broadcast } from '$lib/server/sse';

export async function POST({ params, request }) {
    const token = extractToken(request);
    if (!token) return error(401, 'Token manquant');

    const isAdmin = await validateAdminToken(token, params.id);
    if (!isAdmin) return error(403, 'Token invalide');

    const match = await getMatch(params.matchId);
    if (!match) return error(404, 'Match introuvable');

    const body = await request.json();
    const { scoreTeam1, scoreTeam2 } = body;

    if (typeof scoreTeam1 !== 'number' || typeof scoreTeam2 !== 'number') {
        return error(400, 'Scores invalides');
    }

    await forceScore(params.matchId, scoreTeam1, scoreTeam2, match.team1Id, match.team2Id);
    broadcast(params.id);
    return json({ ok: true });
}
