import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { teams, kioskTokens } from '$lib/server/db/schema_sqlite';
import { eq, and } from 'drizzle-orm';

export async function POST({ params, request }) {
    const { pin, teamName, kioskToken } = await request.json();

    if (!pin || !teamName || !kioskToken) {
        return error(400, 'PIN, nom d\'équipe et token kiosque requis');
    }

    const kiosk = await db.query.kioskTokens.findFirst({
        where: eq(kioskTokens.token, kioskToken),
    });
    if (!kiosk || kiosk.contestId !== params.id) {
        return error(403, 'Token kiosque invalide');
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
