import { json, error } from '@sveltejs/kit';
import { getContest, getContestTeams } from '$lib/server/contest';

export async function GET({ params }) {
    const contest = await getContest(params.id);
    if (!contest) {
        return error(404, 'Concours introuvable');
    }
    const teamList = await getContestTeams(params.id);
    return json(teamList);
}