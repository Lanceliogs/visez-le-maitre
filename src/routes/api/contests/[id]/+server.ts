import { json, error } from '@sveltejs/kit';
import { getContest } from '$lib/server/contest';

export async function GET({ params }) {
    const contest = await getContest(params.id);
    if (!contest) {
        return error(404, 'Concours introuvable');
    }
    return json(contest);
}
