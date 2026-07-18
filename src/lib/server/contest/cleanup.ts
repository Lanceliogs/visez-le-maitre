import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { contests, teams, teamMembers, adminTokens, kioskTokens, pools, poolTeams, matches } from '$lib/server/db/schema_sqlite';
import { eq, lt, inArray } from 'drizzle-orm';
import { createLogger } from '$lib/server/logger';

const log = createLogger('cleanup');

export async function deleteContest(contestId: string) {
    await db.delete(matches).where(eq(matches.contestId, contestId));

    const poolIds = (await db.select({ id: pools.id }).from(pools).where(eq(pools.contestId, contestId))).map(p => p.id);
    if (poolIds.length > 0) {
        await db.delete(poolTeams).where(inArray(poolTeams.poolId, poolIds));
    }
    await db.delete(pools).where(eq(pools.contestId, contestId));

    const teamIds = (await db.select({ id: teams.id }).from(teams).where(eq(teams.contestId, contestId))).map(t => t.id);
    if (teamIds.length > 0) {
        await db.delete(teamMembers).where(inArray(teamMembers.teamId, teamIds));
    }
    await db.delete(teams).where(eq(teams.contestId, contestId));

    await db.delete(adminTokens).where(eq(adminTokens.contestId, contestId));
    await db.delete(kioskTokens).where(eq(kioskTokens.contestId, contestId));
    await db.delete(contests).where(eq(contests.id, contestId));
}

export async function cleanupStaleContests(maxAgeDays?: number): Promise<number> {
    const days = maxAgeDays ?? parseInt(env.APP_CLEANUP_DAYS || '7', 10);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const staleContests = await db
        .select({ id: contests.id })
        .from(contests)
        .where(lt(contests.lastActivityAt, cutoff));

    for (const { id } of staleContests) {
        await deleteContest(id);
    }

    if (staleContests.length > 0) {
        log.info('Auto-cleanup done', { deleted: staleContests.length, cutoffDays: days });
    }

    return staleContests.length;
}
