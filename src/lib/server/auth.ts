import { db, teams, adminTokens } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export function extractToken(request: Request): string | null {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
}

export async function getTeamFromToken(token: string, contestId: string) {
    const team = await db.query.teams.findFirst({
        where: eq(teams.token, token),
        with: { members: true },
    });
    if (!team || team.contestId !== contestId) return null;
    return team;
}

export async function validateAdminToken(token: string, contestId: string) {
    const record = await db.query.adminTokens.findFirst({
        where: eq(adminTokens.token, token),
    });
    if (!record || record.contestId !== contestId) return false;
    return true;
}

export function validateAppAdmin(request: Request): boolean {
    const token = extractToken(request);
    if (!token) return false;
    return appAdminTokens.has(token);
}

export const appAdminTokens = new Set<string>();
