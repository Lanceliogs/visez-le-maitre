import { db, contests, adminTokens } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export async function getContest(id: string) {
    return db.query.contests.findFirst({
        where: eq(contests.id, id),
    });
}

type ContestParams = {
    name: string;
    teamSize?: number;
    scoreTarget?: number;
    scoreTargetFinal?: number;
    scoreTargetConsolanteFinal?: number;
    nbQualified?: number;
    challengesEnabled?: boolean;
    poolSize?: number;
};

export async function createContest(params: ContestParams) {
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
        nbQualified: params.nbQualified ?? 16,
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
