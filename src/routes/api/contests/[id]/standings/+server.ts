import { json, error } from '@sveltejs/kit';
import { getContest } from '$lib/server/contest';
import { computeStandings } from '$lib/server/contest/standings';

export async function GET({ params }) {
    const contest = await getContest(params.id);
    if (!contest) return error(404, 'Concours introuvable');

    const standings = await computeStandings(params.id);
    return json(standings);
}
