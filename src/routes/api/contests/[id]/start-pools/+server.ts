import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { contests, adminTokens, teams, pools, poolTeams, matches } from '$lib/server/db/schema_sqlite';
import { eq } from 'drizzle-orm';
import { generatePools, generatePoolMatches } from '$lib/server/contest/pools';

export const POST: RequestHandler = async ({ params, request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw error(401, 'Token manquant');
    }
    const token = authHeader.slice(7);

    // Verify admin token
    const adminToken = await db.query.adminTokens.findFirst({
        where: eq(adminTokens.token, token),
    });
    if (!adminToken || adminToken.contestId !== params.id) {
        throw error(403, 'Token invalide');
    }

    // Verify contest status
    const contest = await db.query.contests.findFirst({
        where: eq(contests.id, params.id),
    });
    if (!contest) throw error(404, 'Concours introuvable');
    if (contest.status !== 'registration') {
        throw error(400, 'Le concours n\'est plus en phase d\'inscription');
    }

    // Get all teams
    const teamList = await db.query.teams.findMany({
        where: eq(teams.contestId, params.id),
    });
    if (teamList.length < 2) {
        throw error(400, 'Il faut au moins 2 équipes pour démarrer');
    }

    // Generate pools
    const poolAssignments = generatePools(
        teamList.map(t => ({ id: t.id, seedGroup: t.seedGroup })),
        contest.poolSize,
    );
    
    // Insert pools, pool_teams, and matches
    for (const pool of poolAssignments) {
        const poolId = crypto.randomUUID();
        await db.insert(pools).values({
            id: poolId,
            contestId: params.id,
            name: pool.name,
            poolNumber: pool.poolNumber,
        });
        for (const teamId of pool.teamIds) {
            await db.insert(poolTeams).values({ poolId, teamId });
        }
        const poolMatches = generatePoolMatches(pool);
        for (const match of poolMatches) {
            await db.insert(matches).values({
                id: crypto.randomUUID(),
                contestId: params.id,
                poolId,
                roundNumber: match.roundNumber,
                team1Id: match.team1Id,
                team2Id: match.team2Id,
                status: 'pending',
            });
        }
    }

    // Update contest status
    await db.update(contests)
        .set({ status: 'pools', lastActivityAt: new Date().toISOString() })
        .where(eq(contests.id, params.id));

    return json({
        pools: poolAssignments.map(p => ({ name: p.name, teamCount: p.teamIds.length })),
    });
};
