import { json, error } from '@sveltejs/kit';
import { validateAppAdmin } from '$lib/server/auth';
import { db, contests } from '$lib/server/db';
import { eq, sql } from 'drizzle-orm';

export async function GET({ request }) {
    if (!validateAppAdmin(request)) return error(401, 'Accès refusé');

    const contestList = await db
        .select({
            id: contests.id,
            name: contests.name,
            status: contests.status,
            createdAt: contests.createdAt,
            lastActivityAt: contests.lastActivityAt,
            teamCount: sql<number>`(SELECT COUNT(*) FROM teams WHERE contest_id = ${contests.id})`,
        })
        .from(contests)
        .orderBy(contests.createdAt);

    return json(contestList);
}
