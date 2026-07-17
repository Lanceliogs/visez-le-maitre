import { json } from '@sveltejs/kit';
import { createContest } from '$lib/server/contest';

export async function POST({ request }) {
    const body = await request.json();
    const result = await createContest(body);
    return json(result);
}
