import { db } from '$lib/server/db';
import { teams, teamMembers } from '$lib/server/db/schema_sqlite';
import { eq } from 'drizzle-orm';

export async function getContestTeams(contestId: string) {
    return db.query.teams.findMany({
        where: eq(teams.contestId, contestId),
        with: { members: true },
    });
}

export async function createNewTeam(
    contestId: string, teamName: string, members: string[], pin: string
) {
    const teamId = crypto.randomUUID();
    const token = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.insert(teams).values({
        id: teamId,
        contestId,
        name: teamName,
        token,
        pin,
        createdAt: now,
    });
    for (const memberName of members) {
        await db.insert(teamMembers).values({
            id: crypto.randomUUID(),
            teamId,
            name: memberName,
        });
    }
    return { teamId, token };
}

export async function setTeamSeedGroup(teamId: string, seedGroup: number) {
    await db.update(teams)
        .set({ seedGroup })
        .where(eq(teams.id, teamId));
}
