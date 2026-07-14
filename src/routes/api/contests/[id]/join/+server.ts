import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { contests, teams, teamMembers } from '$lib/server/db/schema_sqlite';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST({ params, request }) {
    const body = await request.json();
    const contest = await db.query.contests.findFirst({
        where: eq(contests.id, params.id),
    });
    if (!contest) {
        return error(404, 'Concours introuvable');
    }
    if (contest.status !== 'registration') {
        return error(403, 'Les inscriptions sont fermées');
    }
    const teamId = crypto.randomUUID();
    const token = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.insert(teams).values({
        id: teamId,
        contestId: params.id,
        name: body.teamName,
        token,
        pin: body.pin,
        createdAt: now,
    });
    for (const memberName of body.members) {
        await db.insert(teamMembers).values({
            id: crypto.randomUUID(),
            teamId,
            name: memberName,
        });
    }
    return json({ teamId, token });
}
