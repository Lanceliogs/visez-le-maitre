import { json, error } from '@sveltejs/kit';
import { extractToken, getTeamFromToken } from '$lib/server/auth';
import { getMatch, submitScore } from '$lib/server/contest/matches';
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
    if (match.status !== 'in_progress' && match.status !== 'score_submitted') {
        return error(400, 'Impossible de soumettre un score pour ce match');
    }

    const body = await request.json();
    const { myScore, theirScore } = body;

    if (typeof myScore !== 'number' || typeof theirScore !== 'number') {
        return error(400, 'Scores invalides');
    }

    const isTeam1 = match.team1Id === team.id;
    const scoreTeam1 = isTeam1 ? myScore : theirScore;
    const scoreTeam2 = isTeam1 ? theirScore : myScore;

    await submitScore(params.matchId, scoreTeam1, scoreTeam2, team.id);
    broadcast(params.id);
    return json({ ok: true });
}
