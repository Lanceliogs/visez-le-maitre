import { json, error } from '@sveltejs/kit';
import { getContest, getContestTeams } from '$lib/server/contest';
import { getContestMatches } from '$lib/server/contest/matches';

export async function GET({ params }) {
    const contest = await getContest(params.id);
    if (!contest) return error(404, 'Concours introuvable');

    const matchList = await getContestMatches(params.id);
    const teamList = await getContestTeams(params.id);
    const teamMap = new Map(teamList.map(t => [t.id, t.name]));

    const result = matchList.map(m => ({
        id: m.id,
        poolId: m.poolId,
        bracket: m.bracket,
        bracketRound: m.bracketRound,
        bracketPosition: m.bracketPosition,
        roundNumber: m.roundNumber,
        team1Id: m.team1Id,
        team2Id: m.team2Id,
        team1Name: teamMap.get(m.team1Id) ?? '?',
        team2Name: teamMap.get(m.team2Id) ?? '?',
        scoreTeam1: m.scoreTeam1,
        scoreTeam2: m.scoreTeam2,
        status: m.status,
        submittedBy: m.submittedBy,
        winnerId: m.winnerId,
    }));

    return json(result);
}
