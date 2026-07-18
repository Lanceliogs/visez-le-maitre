import { json, error } from '@sveltejs/kit';
import { getContest, createNewTeam } from '$lib/server/contest';
import { broadcast } from '$lib/server/sse';
import { createLogger } from '$lib/server/logger';

const log = createLogger('team');

export async function POST({ params, request }) {
    const body = await request.json();
    const contest = await getContest(params.id);
    if (!contest) {
        return error(404, 'Concours introuvable');
    }
    if (contest.status !== 'registration') {
        return error(403, 'Les inscriptions sont fermées');
    }

    const {teamId, token} = await createNewTeam(
        contest.id, body.teamName, body.members, body.pin
    );
    broadcast(params.id);
    log.info('Team joined', { contestId: params.id, teamId, teamName: body.teamName });
    return json({ teamId, token });
}
