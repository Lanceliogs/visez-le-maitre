import { json, error } from '@sveltejs/kit';
import { extractToken, getTeamFromToken } from '$lib/server/auth';
import { getMatch, confirmScore } from '$lib/server/contest/matches';
import { broadcast } from '$lib/server/sse';

export async function POST({ params, request }) {
    const token = extractToken(request);
    if (!token) return error(401, 'Token manquant');

    const team = await getTeamFromToken(token, params.id);
    if (!team) return error(403, 'Token invalide');

    const match = await getMatch(params.matchId);
    if (!match) return error(404, 'Match introuvable');
    if (match.team1Id !== team.id && match.team2Id !== team.id) {
        return error(403, 'Ce n\'est pas votre match');
    }
    if (match.status !== 'score_submitted') {
        return error(400, 'Aucun score à confirmer');
    }
    if (match.submittedBy === team.id) {
        return error(400, 'Vous ne pouvez pas confirmer votre propre score');
    }

    await confirmScore(params.matchId);
    broadcast(params.id);
    return json({ ok: true });
}
