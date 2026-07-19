import { json, error } from '@sveltejs/kit';
import { db, teams } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';

export async function POST({ params, request }) {
    const { pin, teamName } = await request.json();

    if (!pin || !teamName) {
        return error(400, 'PIN et nom d\'équipe requis');
    }

    const team = await db.query.teams.findFirst({
        where: and(eq(teams.contestId, params.id), eq(teams.pin, pin), eq(teams.name, teamName)),
        with: { members: true },
    });

    if (!team) {
        return error(404, 'Équipe introuvable');
    }

    return json({
        teamId: team.id,
        teamToken: team.token,
        teamName: team.name,
        members: team.members,
    });
}
