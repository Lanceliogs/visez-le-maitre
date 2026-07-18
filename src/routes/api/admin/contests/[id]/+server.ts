import { json, error } from '@sveltejs/kit';
import { validateAppAdmin } from '$lib/server/auth';
import { getContest } from '$lib/server/contest/contests';
import { deleteContest } from '$lib/server/contest/cleanup';

export async function DELETE({ request, params }) {
    if (!validateAppAdmin(request)) return error(401, 'Accès refusé');

    const contest = await getContest(params.id);
    if (!contest) return error(404, 'Concours introuvable');

    await deleteContest(params.id);

    return json({ ok: true });
}
