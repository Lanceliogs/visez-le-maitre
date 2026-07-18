import { db, contests, pools as poolsTable, poolTeams, matches as matchesTable } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { getContestTeams } from './teams';

type Team = {
    id: string;
    seedGroup: number;
};

type PoolAssignment = {
    poolNumber: number;
    name: string;
    teamIds: string[];
};

type MatchTemplate = {
    poolNumber: number;
    roundNumber: number;
    team1Id: string;
    team2Id: string;
};

function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function generatePools(teams: Team[], poolSize: number): PoolAssignment[] {
    const nbPools = Math.max(1, Math.floor(teams.length / poolSize));
    const pools: Team[][] = Array.from({ length: nbPools }, () => []);
    const constrained = teams.filter(t => t.seedGroup > 0);
    const unconstrained = shuffleArray(teams.filter(t => t.seedGroup === 0));

    // Group constrained teams by seedGroup
    const seedGroups = new Map<number, Team[]>();
    for (const team of constrained) {
        if (!seedGroups.has(team.seedGroup)) seedGroups.set(team.seedGroup, []);
        seedGroups.get(team.seedGroup)!.push(team);
    }

    // Place constrained teams: spread each group across pools as much as possible
    for (const [, groupTeams] of seedGroups) {
        for (const team of shuffleArray(groupTeams)) {
            const best = pools
                .map((p, i) => ({
                    i,
                    sameGroup: p.filter(t => t.seedGroup === team.seedGroup).length,
                    len: p.length,
                }))
                .sort((a, b) => a.sameGroup - b.sameGroup || a.len - b.len)[0];
            pools[best.i].push(team);
        }
    }

    // Fill with unconstrained teams round-robin (least filled first)
    for (const team of unconstrained) {
        const best = pools
            .map((p, i) => ({ i, len: p.length }))
            .sort((a, b) => a.len - b.len)[0];
        pools[best.i].push(team);
    }

    const poolNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return pools.map((poolTeams, i) => ({
        poolNumber: i + 1,
        name: `Poule ${poolNames[i] ?? i + 1}`,
        teamIds: poolTeams.map(t => t.id),
    }));
}

export function generatePoolMatches(pool: PoolAssignment): MatchTemplate[] {
    const matches: MatchTemplate[] = [];
    const teamIds = pool.teamIds;
    const n = teamIds.length;
    // Round-robin using circle method
    const fixed = teamIds[0];
    const rotating = teamIds.slice(1);
    const rounds = n - 1;
    for (let round = 0; round < rounds; round++) {
        const current = [fixed, ...rotating];
        const half = Math.floor(n / 2);
        for (let i = 0; i < half; i++) {
            const t1 = current[i];
            const t2 = current[n - 1 - i];
            if (t1 && t2) {
                matches.push({
                    poolNumber: pool.poolNumber,
                    roundNumber: round + 1,
                    team1Id: t1,
                    team2Id: t2,
                });
            }
        }
        // Rotate: move last element to position 1
        rotating.unshift(rotating.pop()!);
    }
    return matches;
}

export async function getContestPools(contestId: string) {
    return db.query.pools.findMany({
        where: eq(poolsTable.contestId, contestId),
        with: { poolTeams: true },
    });
}

export async function startPoolPhase(contestId: string, poolSize: number) {
    const teamList = await getContestTeams(contestId);
    const poolAssignments = generatePools(
        teamList.map(t => ({ id: t.id, seedGroup: t.seedGroup })),
        poolSize,
    );

    for (const pool of poolAssignments) {
        const poolId = crypto.randomUUID();
        await db.insert(poolsTable).values({
            id: poolId,
            contestId,
            name: pool.name,
            poolNumber: pool.poolNumber,
        });
        for (const teamId of pool.teamIds) {
            await db.insert(poolTeams).values({ poolId, teamId });
        }
        const poolMatches = generatePoolMatches(pool);
        for (const match of poolMatches) {
            await db.insert(matchesTable).values({
                id: crypto.randomUUID(),
                contestId,
                poolId,
                roundNumber: match.roundNumber,
                team1Id: match.team1Id,
                team2Id: match.team2Id,
                status: 'pending',
            });
        }
    }

    await db.update(contests)
        .set({ status: 'pools', lastActivityAt: new Date().toISOString() })
        .where(eq(contests.id, contestId));

    return poolAssignments;
}
