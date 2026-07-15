import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { teams } from '$lib/server/db/schema_sqlite';
import { eq } from 'drizzle-orm';

export async function GET({ request, params }) {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
        return error(401, 'Token manquant');
    }
    const token = auth.slice(7);
    const team = await db.query.teams.findFirst({
        where: eq(teams.token, token),
        with: { members: true },
    });
    if (!team || team.contestId !== params.id) {
        return error(404, 'Équipe introuvable');
    }
    return json({
        id: team.id,
        name: team.name,
        members: team.members,
    });
}
