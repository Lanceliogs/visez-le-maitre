import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { contests, adminTokens } from '$lib/server/db/schema_sqlite';
import crypto from 'crypto';

export async function POST({ request }) {
    const body = await request.json();
    const id = crypto.randomUUID();
    const token = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.insert(contests).values({
        id,
        name: body.name,
        teamSize: body.teamSize ?? 1,
        scoreTarget: body.scoreTarget ?? 13,
        scoreTargetFinal: body.scoreTargetFinal ?? 15,
        scoreTargetConsolanteFinal: body.scoreTargetConsolanteFinal ?? 15,
        nbQualified: body.nbQualified ?? 16,
        challengesEnabled: body.challengesEnabled ?? false,
        createdAt: now,
        lastActivityAt: now,
    });
    await db.insert(adminTokens).values({
        token,
        contestId: id,
    });
    return json({ id, adminToken: token });
}
