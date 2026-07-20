import { db, matches, teams } from '$lib/server/db';
import { eq, or, and } from 'drizzle-orm';
import type { Match } from './types';

export async function getContestMatches(contestId: string): Promise<Match[]> {
    return db.query.matches.findMany({
        where: eq(matches.contestId, contestId),
    });
}

export async function getTeamMatches(contestId: string, teamId: string): Promise<Match[]> {
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

export async function getMatch(matchId: string): Promise<Match | undefined> {
    return db.query.matches.findFirst({
        where: eq(matches.id, matchId),
    });
}

export async function startMatch(matchId: string) {
    await db.update(matches)
        .set({ status: 'in_progress' })
        .where(eq(matches.id, matchId));
}

export async function submitScore(matchId: string, scoreTeam1: number, scoreTeam2: number, submittedBy: string) {
    await db.update(matches)
        .set({
            scoreTeam1,
            scoreTeam2,
            submittedBy,
            status: 'score_submitted',
        })
        .where(eq(matches.id, matchId));
}

export async function confirmScore(matchId: string) {
    const match = await getMatch(matchId);
    if (!match) return;
    const winnerId = match.scoreTeam1! > match.scoreTeam2!
        ? match.team1Id
        : match.team2Id;
    await db.update(matches)
        .set({
            confirmed: true,
            winnerId,
            status: 'completed',
        })
        .where(eq(matches.id, matchId));
}

export async function forceScore(matchId: string, scoreTeam1: number, scoreTeam2: number, team1Id: string, team2Id: string) {
    const winnerId = scoreTeam1 > scoreTeam2 ? team1Id : team2Id;
    await db.update(matches)
        .set({
            scoreTeam1,
            scoreTeam2,
            confirmed: true,
            winnerId,
            status: 'completed',
        })
        .where(eq(matches.id, matchId));
}

export async function buildCurrentMatch(teamId: string, teamName: string, contestId: string, teamMatches: Match[]) {
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
        team1Name: isTeam1 ? teamName : (opponent?.name ?? '?'),
        team2Name: isTeam1 ? (opponent?.name ?? '?') : teamName,
        opponentName: opponent?.name ?? '?',
        status: nextMatch.status,
        scoreTeam1: nextMatch.scoreTeam1,
        scoreTeam2: nextMatch.scoreTeam2,
        weSubmitted: nextMatch.submittedBy === teamId,
        isTeam1,
        opponentBusy,
    };
}

export async function buildCompletedMatches(teamId: string, teamName: string, teamMatches: Match[]) {
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
                team1Name: isTeam1 ? teamName : (opponent?.name ?? '?'),
                team2Name: isTeam1 ? (opponent?.name ?? '?') : teamName,
                opponentName: opponent?.name ?? '?',
                scoreTeam1: m.scoreTeam1,
                scoreTeam2: m.scoreTeam2,
                won: m.winnerId === teamId,
            };
        })
    );
}
