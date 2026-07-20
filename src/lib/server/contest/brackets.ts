import { db, matches, contests } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { createLogger } from '$lib/server/logger';
import type { Match } from './types';

const log = createLogger('brackets');

type SeedEntry = { teamId: string; rank: number };

/**
 * Generate the standard bracket seeding order for N teams.
 * Returns an array of match pairings (by seed index) in proper bracket position order,
 * ensuring that if higher seeds win, #1 and #2 meet in the final.
 */
function bracketSeeding(n: number): [number, number][] {
    if (n < 2) return [];
    if (n === 2) return [[0, 1]];

    const rounds = Math.log2(n);
    let positions = [0, 1];

    for (let r = 1; r < rounds; r++) {
        const newPositions: number[] = [];
        const sum = (1 << (r + 1)) - 1;
        for (const pos of positions) {
            newPositions.push(pos);
            newPositions.push(sum - pos);
        }
        positions = newPositions;
    }

    const pairs: [number, number][] = [];
    for (let i = 0; i < positions.length; i += 2) {
        pairs.push([positions[i], positions[i + 1]]);
    }
    return pairs;
}

/**
 * Generate round 1 bracket matches for a set of ranked teams.
 */
export async function generateBracket(
    contestId: string,
    rankedTeams: SeedEntry[],
    bracket: 'principale' | 'consolante',
): Promise<number> {
    const n = rankedTeams.length;
    if (n < 2 || (n & (n - 1)) !== 0) {
        throw new Error(`Bracket size must be a power of 2, got ${n}`);
    }

    const pairs = bracketSeeding(n);
    const sorted = [...rankedTeams].sort((a, b) => a.rank - b.rank);

    let created = 0;
    for (let pos = 0; pos < pairs.length; pos++) {
        const [seedA, seedB] = pairs[pos];
        const teamA = sorted[seedA];
        const teamB = sorted[seedB];

        await db.insert(matches).values({
            id: crypto.randomUUID(),
            contestId,
            poolId: null,
            bracket,
            bracketRound: 1,
            bracketPosition: pos,
            roundNumber: 1,
            team1Id: teamA.teamId,
            team2Id: teamB.teamId,
            status: 'pending',
        });
        created++;
    }

    log.info('Bracket generated', { contestId, bracket, teams: n, matches: created });
    return created;
}

/**
 * Check if all matches in the current round of a bracket are completed.
 * Returns the current round number, or null if bracket has no matches.
 */
export async function getCurrentBracketRound(contestId: string, bracket: string): Promise<{
    round: number;
    allCompleted: boolean;
    matches: Match[];
} | null> {
    const bracketMatches: Match[] = await db.query.matches.findMany({
        where: and(
            eq(matches.contestId, contestId),
            eq(matches.bracket, bracket),
        ),
    });

    if (bracketMatches.length === 0) return null;

    const maxRound = Math.max(...bracketMatches.map(m => m.bracketRound!));
    const currentRoundMatches = bracketMatches.filter(m => m.bracketRound === maxRound);
    const allCompleted = currentRoundMatches.every(m => m.status === 'completed');

    return { round: maxRound, allCompleted, matches: currentRoundMatches };
}

/**
 * Advance a bracket to the next round by creating matches from the winners.
 * Returns the number of new matches created, or 0 if the bracket is complete (final was played).
 */
export async function advanceBracket(contestId: string, bracket: string): Promise<number> {
    const state = await getCurrentBracketRound(contestId, bracket);
    if (!state) throw new Error(`No bracket matches found for ${bracket}`);
    if (!state.allCompleted) throw new Error(`Round ${state.round} is not complete`);

    const currentMatches = state.matches.sort((a, b) => a.bracketPosition! - b.bracketPosition!);

    if (currentMatches.length === 1) {
        log.info('Bracket complete', { contestId, bracket, winner: currentMatches[0].winnerId });
        return 0;
    }

    const nextRound = state.round + 1;
    let created = 0;

    for (let i = 0; i < currentMatches.length; i += 2) {
        const matchA = currentMatches[i];
        const matchB = currentMatches[i + 1];
        const winner1 = matchA.winnerId!;
        const winner2 = matchB.winnerId!;

        await db.insert(matches).values({
            id: crypto.randomUUID(),
            contestId,
            poolId: null,
            bracket,
            bracketRound: nextRound,
            bracketPosition: Math.floor(i / 2),
            roundNumber: nextRound,
            team1Id: winner1,
            team2Id: winner2,
            status: 'pending',
        });
        created++;
    }

    await db.update(contests)
        .set({ lastActivityAt: new Date().toISOString() })
        .where(eq(contests.id, contestId));

    log.info('Bracket advanced', { contestId, bracket, round: nextRound, matches: created });
    return created;
}

/**
 * Check if both brackets are complete (finals have been played).
 */
export async function areBracketsComplete(contestId: string): Promise<boolean> {
    const principale = await getCurrentBracketRound(contestId, 'principale');
    const consolante = await getCurrentBracketRound(contestId, 'consolante');

    if (!principale || !consolante) return false;

    const principaleComplete = principale.matches.length === 1 && principale.allCompleted;
    const consolanteComplete = consolante.matches.length === 1 && consolante.allCompleted;

    return principaleComplete && consolanteComplete;
}
