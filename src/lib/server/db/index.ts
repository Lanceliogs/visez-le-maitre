import type * as PgSchema from './schema_pg';

type Schema = typeof PgSchema;

let _db: any;
let _schema: Schema;

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl) {
    const { neon } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-http');
    const mod = await import('./schema_pg');
    const sql = neon(databaseUrl);
    _db = drizzle(sql, { schema: mod });
    _schema = mod;
} else {
    const { default: Database } = await import('better-sqlite3');
    const { drizzle } = await import('drizzle-orm/better-sqlite3');
    const mod = await import('./schema_sqlite');
    const sqlite = new Database('local.db');
    _db = drizzle(sqlite, { schema: mod });
    _schema = mod as unknown as Schema;
}

export const db = _db;

export const contests = _schema.contests;
export const adminTokens = _schema.adminTokens;
export const teams = _schema.teams;
export const teamMembers = _schema.teamMembers;
export const pools = _schema.pools;
export const poolTeams = _schema.poolTeams;
export const matches = _schema.matches;
