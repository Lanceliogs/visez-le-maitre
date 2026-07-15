import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { teams, adminTokens } from '$lib/server/db/schema_sqlite';
import { eq } from 'drizzle-orm';

export async function PUT({ params, request }) {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
        return error(401, 'Token manquant');
    }
    const token = auth.slice(7);
    const adminToken = await db.query.adminTokens.findFirst({
        where: eq(adminTokens.token, token),
    });
    if (!adminToken || adminToken.contestId !== params.id) {
        return error(403, 'Non autorisé');
    }
    const body = await request.json();
    await db.update(teams)
        .set({ seedGroup: body.seedGroup })
        .where(eq(teams.id, params.teamId));
    return json({ ok: true });
}