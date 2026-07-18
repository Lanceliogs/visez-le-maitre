import { json } from '@sveltejs/kit';
import { createContest } from '$lib/server/contest';
import { createLogger } from '$lib/server/logger';

const log = createLogger('contest');

export async function POST({ request }) {
    const body = await request.json();
    const result = await createContest(body);
    log.info('Contest created', { contestId: result.id, name: body.name });
    return json(result);
}
