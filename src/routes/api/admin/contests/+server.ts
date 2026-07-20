import { json, error } from '@sveltejs/kit';
import { validateAppAdmin } from '$lib/server/auth';
import { getContests } from '$lib/server/contest';

export async function GET({ request, url }) {
    if (!validateAppAdmin(request)) return error(401, 'Accès refusé');

    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
    const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);

    const contestList = await getContests(offset, limit);
    return json(contestList);
}
