import { json, error } from '@sveltejs/kit';
import { extractToken, getTeamFromToken } from '$lib/server/auth';
import { getMatch, startMatch, isOpponentBusy } from '$lib/server/contest/matches';
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
    if (match.status !== 'pending') {
        return error(400, 'Ce match ne peut plus être démarré');
    }

    const opponentId = match.team1Id === team.id ? match.team2Id : match.team1Id;
    const busy = await isOpponentBusy(params.id, opponentId);
    if (busy) {
        return error(400, 'L\'adversaire est encore en match');
    }

    await startMatch(params.matchId);
    broadcast(params.id);
    return json({ ok: true });
}
