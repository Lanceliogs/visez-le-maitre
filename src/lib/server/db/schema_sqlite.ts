import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Contests and admin tokens

export const contests = sqliteTable('contests', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    status: text('status').notNull().default('registration'),
    teamSize: integer('team_size').notNull().default(2),
    scoreTarget: integer('score_target').notNull().default(13),
    scoreTargetFinal: integer('score_target_final').notNull().default(15),
    scoreTargetConsolanteFinal: integer('score_target_consolante_final').notNull().default(15),
    nbQualified: integer('nb_qualified').notNull().default(16),
    challengesEnabled: integer('challenges_enabled', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull(),
    completedAt: text('completed_at'),
    lastActivityAt: text('last_activity_at').notNull(),
});

export const adminTokens = sqliteTable('admin_tokens', {
    token: text('token').primaryKey(),
    contestId: text('contest_id').notNull().references(() => contests.id),
});

// Teams related data

export const teams = sqliteTable('teams', {
    id: text('id').primaryKey(),
    contestId: text('contest_id').notNull().references(() => contests.id),
    name: text('name').notNull(),
    token: text('token').notNull().unique(),
    pin: text('pin').notNull(),
    createdAt: text('created_at').notNull(),
});

export const teamMembers = sqliteTable('team_members', {
    id: text('id').primaryKey(),
    teamId: text('team_id').notNull().references(() => teams.id),
    name: text('name').notNull(),
});

// TODO: pools, phases, matches, seed_groups
