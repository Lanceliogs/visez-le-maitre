import { json, error } from '@sveltejs/kit';
import { extractToken, getTeamFromToken } from '$lib/server/auth';
import { getContest } from '$lib/server/contest';
import { getTeamMatches, getContestMatches, buildCurrentMatch, buildCompletedMatches } from '$lib/server/contest/matches';
import { computeQualifications } from '$lib/server/contest/standings';

export async function GET({ request, params }) {
    const token = extractToken(request);
    if (!token) return error(401, 'Token manquant');

    const team = await getTeamFromToken(token, params.id);
    if (!team) return error(404, 'Équipe introuvable');

    const contest = await getContest(params.id);
    if (!contest) return error(404, 'Concours introuvable');

    if (contest.status === 'registration') {
        return json({
            id: team.id,
            name: team.name,
            members: team.members,
            phase: contest.status,
            currentMatch: null,
            completedMatches: [],
            ranking: null,
        });
    }

    const teamMatches = await getTeamMatches(params.id, team.id);
    const currentMatch = await buildCurrentMatch(team.id, team.name, params.id, teamMatches);
    const completedMatches = await buildCompletedMatches(team.id, team.name, teamMatches);

    // Compute ranking when all pool matches are done (no currentMatch left)
    let ranking = null;
    if (!currentMatch && contest.status === 'pools') {
        const allMatches = await getContestMatches(params.id);
        const allDone = allMatches.every(m => m.status === 'completed');
        if (allDone) {
            const poolRanking = await computeQualifications(params.id);
            ranking = poolRanking.find(r => r.teamId === team.id) ?? null;
        }
    }

    return json({
        id: team.id,
        name: team.name,
        members: team.members,
        phase: contest.status,
        currentMatch,
        completedMatches,
        ranking,
    });
}
