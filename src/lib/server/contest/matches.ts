import { db } from '$lib/server/db';
import { matches, teams } from '$lib/server/db/schema_sqlite';
import { eq, or, and } from 'drizzle-orm';

export async function getTeamMatches(contestId: string, teamId: string) {
    return db.query.matches.findMany({
        where: and(
            eq(matches.contestId, contestId),
            or(
                eq(matches.team1Id, teamId),
                eq(matches.team2Id, teamId),
            ),
        ),
    });
}

export async function isOpponentBusy(contestId: string, opponentId: string) {
    const activeMatch = await db.query.matches.findFirst({
        where: and(
            eq(matches.contestId, contestId),
            or(
                eq(matches.team1Id, opponentId),
                eq(matches.team2Id, opponentId),
            ),
            or(
                eq(matches.status, 'in_progress'),
                eq(matches.status, 'score_submitted'),
            ),
        ),
    });
    return !!activeMatch;
}

export async function buildCurrentMatch(teamId: string, contestId: string, teamMatches: any[]) {
    const active = teamMatches.find(m =>
        m.status === 'in_progress' || m.status === 'score_submitted'
    );
    const pending = teamMatches
        .filter(m => m.status === 'pending')
        .sort((a, b) => a.roundNumber - b.roundNumber);

    const nextMatch = active ?? pending[0] ?? null;
    if (!nextMatch) return null;

    const opponentId = nextMatch.team1Id === teamId
        ? nextMatch.team2Id
        : nextMatch.team1Id;

    const opponent = await db.query.teams.findFirst({
        where: eq(teams.id, opponentId),
    });

    const opponentBusy = nextMatch.status === 'pending'
        ? await isOpponentBusy(contestId, opponentId)
        : false;

    const isTeam1 = nextMatch.team1Id === teamId;
    return {
        id: nextMatch.id,
        roundNumber: nextMatch.roundNumber,
        opponentName: opponent?.name ?? '?',
        status: nextMatch.status,
        myScore: isTeam1 ? nextMatch.scoreTeam1 : nextMatch.scoreTeam2,
        theirScore: isTeam1 ? nextMatch.scoreTeam2 : nextMatch.scoreTeam1,
        weSubmitted: nextMatch.submittedBy === teamId,
        isTeam1,
        opponentBusy,
    };
}

export async function buildCompletedMatches(teamId: string, teamMatches: any[]) {
    const completed = teamMatches.filter(m => m.status === 'completed');
    return Promise.all(
        completed.map(async (m) => {
            const opponentId = m.team1Id === teamId ? m.team2Id : m.team1Id;
            const opponent = await db.query.teams.findFirst({
                where: eq(teams.id, opponentId),
            });
            const isTeam1 = m.team1Id === teamId;
            return {
                roundNumber: m.roundNumber,
                opponentName: opponent?.name ?? '?',
                myScore: isTeam1 ? m.scoreTeam1 : m.scoreTeam2,
                theirScore: isTeam1 ? m.scoreTeam2 : m.scoreTeam1,
                won: m.winnerId === teamId,
            };
        })
    );
}
