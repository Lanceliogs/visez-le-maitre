import { db, contests, adminTokens } from '$lib/server/db';
import { eq, sql } from 'drizzle-orm';
import type { Contest } from './types';

export async function getContest(id: string): Promise<Contest | undefined> {
    return db.query.contests.findFirst({
        where: eq(contests.id, id),
    });
}

export async function updateContestStatus(id: string, status: string) {
    await db.update(contests)
        .set({ status, lastActivityAt: new Date().toISOString() })
        .where(eq(contests.id, id));
}

export async function completeContest(id: string) {
    const now = new Date().toISOString();
    await db.update(contests)
        .set({ status: 'completed', completedAt: now, lastActivityAt: now })
        .where(eq(contests.id, id));
}

export async function getContests(offset = 0, limit = 50) {
    return db
        .select({
            id: contests.id,
            name: contests.name,
            status: contests.status,
            createdAt: contests.createdAt,
            lastActivityAt: contests.lastActivityAt,
            teamCount: sql<number>`(SELECT COUNT(*) FROM teams WHERE contest_id = ${contests.id})`,
        })
        .from(contests)
        .orderBy(contests.createdAt)
        .offset(offset)
        .limit(limit);
}

type ContestParams = {
    name: string;
    teamSize?: number;
    scoreTarget?: number;
    scoreTargetFinal?: number;
    scoreTargetConsolanteFinal?: number;
    nbQualified?: number;
    nbConsolante?: number;
    challengesEnabled?: boolean;
    poolSize?: number;
};

function isPowerOf2(n: number): boolean {
    return n >= 2 && (n & (n - 1)) === 0;
}

export async function createContest(params: ContestParams) {
    const nbQualified = params.nbQualified ?? 16;
    const nbConsolante = params.nbConsolante ?? 16;

    if (!isPowerOf2(nbQualified)) {
        throw new Error(`nbQualified doit être une puissance de 2 (reçu: ${nbQualified})`);
    }
    if (!isPowerOf2(nbConsolante)) {
        throw new Error(`nbConsolante doit être une puissance de 2 (reçu: ${nbConsolante})`);
    }

    const id = crypto.randomUUID();
    const token = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.insert(contests).values({
        id,
        name: params.name,
        teamSize: params.teamSize ?? 1,
        scoreTarget: params.scoreTarget ?? 13,
        scoreTargetFinal: params.scoreTargetFinal ?? 15,
        scoreTargetConsolanteFinal: params.scoreTargetConsolanteFinal ?? 15,
        nbQualified,
        nbConsolante,
        challengesEnabled: params.challengesEnabled ?? false,
        poolSize: params.poolSize ?? 5,
        createdAt: now,
        lastActivityAt: now,
    });
    await db.insert(adminTokens).values({
        token,
        contestId: id,
    });
    return { id, adminToken: token };
}
