import { json, error } from '@sveltejs/kit';
import { setTeamSeedGroup } from '$lib/server/contest/teams';
import { extractToken, validateAdminToken } from '$lib/server/auth';

export async function PUT({ params, request }) {
    const token = extractToken(request);
    if (!token) return error(401, 'Token manquant');

    const isAdmin = await validateAdminToken(token, params.id);
    if (!isAdmin) return error(403, 'Non autorisé');

    const body = await request.json();
    await setTeamSeedGroup(params.teamId, body.seedGroup);
    return json({ ok: true });
}
