import { json, error } from '@sveltejs/kit';
import { extractToken, getTeamFromToken } from '$lib/server/auth';
import { getContest } from '$lib/server/contest';
import { getTeamMatches, buildCurrentMatch, buildCompletedMatches } from '$lib/server/contest/matches';

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
        });
    }

    const teamMatches = await getTeamMatches(params.id, team.id);

    return json({
        id: team.id,
        name: team.name,
        members: team.members,
        phase: contest.status,
        currentMatch: await buildCurrentMatch(team.id, team.name, params.id, teamMatches),
        completedMatches: await buildCompletedMatches(team.id, team.name, teamMatches),
    });
}
