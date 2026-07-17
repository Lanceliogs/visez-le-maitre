import { json, error } from '@sveltejs/kit';
import { getContestPools, getContestTeams } from '$lib/server/contest';

export async function GET({ params }) {
    const poolList = await getContestPools(params.id);

    if (poolList.length === 0) {
        throw error(404, 'Aucune poule trouvée');
    }

    const teamList = await getContestTeams(params.id);
    const teamMap = new Map(teamList.map(t => [t.id, t.name]));

    const result = poolList
        .sort((a, b) => a.poolNumber - b.poolNumber)
        .map(pool => ({
            id: pool.id,
            name: pool.name,
            teams: pool.poolTeams.map(pt => ({
                id: pt.teamId,
                name: teamMap.get(pt.teamId) ?? '?',
            })),
        }));

    return json(result);
}
