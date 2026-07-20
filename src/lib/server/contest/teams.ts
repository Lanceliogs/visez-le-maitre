import { db, teams, teamMembers } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import type { Team } from './types';

export async function getContestTeams(contestId: string): Promise<Team[]> {
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

export async function getTeamByPinAndName(contestId: string, pin: string, teamName: string): Promise<Team | undefined> {
    return db.query.teams.findFirst({
        where: and(eq(teams.contestId, contestId), eq(teams.pin, pin), eq(teams.name, teamName)),
        with: { members: true },
    });
}
