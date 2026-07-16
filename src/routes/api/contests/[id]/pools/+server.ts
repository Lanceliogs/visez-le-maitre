import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { pools, poolTeams, teams } from '$lib/server/db/schema_sqlite';
import { eq } from 'drizzle-orm';

export async function GET({ params }) {
    const poolList = await db.query.pools.findMany({
        where: eq(pools.contestId, params.id),
        with: {
            poolTeams: true,
        },
    });

    if (poolList.length === 0) {
        throw error(404, 'Aucune poule trouvée');
    }

    const teamList = await db.query.teams.findMany({
        where: eq(teams.contestId, params.id),
    });
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
