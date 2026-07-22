import { json, error } from '@sveltejs/kit';
import { extractToken, getTeamFromToken } from '$lib/server/auth';
import { getContest } from '$lib/server/contest';
import { getTeamMatches, getContestMatches, buildCurrentMatch, buildCompletedMatches } from '$lib/server/contest/matches';
import { computeQualifications, computeFinalRanking } from '$lib/server/contest/standings';

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

    let ranking = null;
    let finalRank = null;
    let bracketDone = false;

    if (contest.status === 'finals' || contest.status === 'completed') {
        const poolRanking = await computeQualifications(params.id);
        ranking = poolRanking.find(r => r.teamId === team.id) ?? null;

        if (contest.status === 'finals' && !currentMatch && ranking?.qualification !== 'eliminee') {
            const bracketMatches = teamMatches.filter(m => m.bracket !== null);
            const lastBracket = bracketMatches
                .filter(m => m.status === 'completed')
                .sort((a, b) => (b.bracketRound ?? 0) - (a.bracketRound ?? 0))[0];
            if (lastBracket && lastBracket.winnerId !== team.id) {
                bracketDone = true;
            }
        }
    } else if (contest.status === 'pools') {
        const allMatches = await getContestMatches(params.id);
        const poolMatches = allMatches.filter(m => m.poolId !== null);
        const allDone = poolMatches.length > 0 && poolMatches.every(m => m.status === 'completed');
        if (allDone) {
            const poolRanking = await computeQualifications(params.id);
            ranking = poolRanking.find(r => r.teamId === team.id) ?? null;
        }
    }
    if (contest.status === 'completed') {
        const finalRanking = await computeFinalRanking(params.id);
        finalRank = finalRanking.find(r => r.teamId === team.id) ?? null;
    }

    return json({
        id: team.id,
        name: team.name,
        members: team.members,
        phase: contest.status,
        currentMatch,
        completedMatches,
        ranking,
        finalRank,
        bracketDone,
    });
}
