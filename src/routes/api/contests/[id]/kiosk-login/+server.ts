import { json, error } from '@sveltejs/kit';
import { getTeamByPinAndName } from '$lib/server/contest';

export async function POST({ params, request }) {
    const { pin, teamName } = await request.json();

    if (!pin || !teamName) {
        return error(400, 'PIN et nom d\'équipe requis');
    }

    const team = await getTeamByPinAndName(params.id, pin, teamName);

    if (!team) {
        return error(404, 'Équipe introuvable');
    }

    return json({
        teamId: team.id,
        teamToken: team.token,
        teamName: team.name,
        members: team.members,
    });
}
