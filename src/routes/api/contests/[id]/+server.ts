import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { contests } from '$lib/server/db/schema_sqlite';
import { eq } from 'drizzle-orm';

export async function GET({ params }) {
    const contest = await db.query.contests.findFirst({
        where: eq(contests.id, params.id),
    });
    if (!contest) {
        return error(404, 'Concours introuvable');
    }
    return json(contest);
}
