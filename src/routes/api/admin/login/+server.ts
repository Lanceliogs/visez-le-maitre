import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import crypto from 'crypto';
import { appAdminTokens } from '$lib/server/auth';
import { createLogger } from '$lib/server/logger';

const log = createLogger('auth');

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const attempts = new Map<string, { count: number; firstAttempt: number }>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const record = attempts.get(ip);

    if (!record || now - record.firstAttempt > WINDOW_MS) {
        attempts.set(ip, { count: 1, firstAttempt: now });
        return false;
    }

    record.count++;
    return record.count > MAX_ATTEMPTS;
}

export async function POST({ request, getClientAddress }) {
    const ip = getClientAddress();

    if (isRateLimited(ip)) {
        log.warn('Rate limited', { ip, maxAttempts: MAX_ATTEMPTS });
        return error(429, 'Trop de tentatives. Réessayez dans 15 minutes.');
    }

    const { password } = await request.json();
    const expected = env.APP_ADMIN_PASSWORD;

    if (!expected || password !== expected) {
        const record = attempts.get(ip);
        log.warn('Failed login attempt', { ip, attempt: record?.count ?? 1, maxAttempts: MAX_ATTEMPTS });
        return error(401, 'Mot de passe incorrect');
    }

    attempts.delete(ip);
    log.info('Login successful', { ip });

    const token = crypto.createHash('sha256').update(expected + Date.now()).digest('hex');
    appAdminTokens.add(token);

    return json({ token });
}
