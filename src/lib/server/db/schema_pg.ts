import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';

// Contests and admin tokens

export const contests = pgTable('contests', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    status: text('status').notNull().default('registration'),
    teamSize: integer('team_size').notNull().default(2),
    scoreTarget: integer('score_target').notNull().default(13),
    scoreTargetFinal: integer('score_target_final').notNull().default(15),
    scoreTargetConsolanteFinal: integer('score_target_consolante_final').notNull().default(15),
    nbQualified: integer('nb_qualified').notNull().default(16),
    challengesEnabled: boolean('challenges_enabled').notNull().default(false),
    poolSize: integer('pool_size').notNull().default(5),
    createdAt: text('created_at').notNull(),
    completedAt: text('completed_at'),
    lastActivityAt: text('last_activity_at').notNull(),
});

export const adminTokens = pgTable('admin_tokens', {
    token: text('token').primaryKey(),
    contestId: text('contest_id').notNull().references(() => contests.id),
});

export const adminTokensRelations = relations(adminTokens, ({ one }) => ({
    contest: one(contests, { fields: [adminTokens.contestId], references: [contests.id] }),
}));

// Teams

export const teams = pgTable('teams', {
    id: text('id').primaryKey(),
    contestId: text('contest_id').notNull().references(() => contests.id),
    name: text('name').notNull(),
    token: text('token').notNull().unique(),
    pin: text('pin').notNull(),
    seedGroup: integer('seed_group').notNull().default(0),
    createdAt: text('created_at').notNull(),
});

export const teamMembers = pgTable('team_members', {
    id: text('id').primaryKey(),
    teamId: text('team_id').notNull().references(() => teams.id),
    name: text('name').notNull(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
    members: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
    team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
}));

// Pools

export const pools = pgTable('pools', {
    id: text('id').primaryKey(),
    contestId: text('contest_id').notNull().references(() => contests.id),
    name: text('name').notNull(),
    poolNumber: integer('pool_number').notNull(),
});

export const poolTeams = pgTable('pool_teams', {
    poolId: text('pool_id').notNull().references(() => pools.id),
    teamId: text('team_id').notNull().references(() => teams.id),
});

export const poolsRelations = relations(pools, ({ many }) => ({
    poolTeams: many(poolTeams),
}));

export const poolTeamsRelations = relations(poolTeams, ({ one }) => ({
    pool: one(pools, { fields: [poolTeams.poolId], references: [pools.id] }),
    team: one(teams, { fields: [poolTeams.teamId], references: [teams.id] }),
}));

// Matches

export const matches = pgTable('matches', {
    id: text('id').primaryKey(),
    contestId: text('contest_id').notNull().references(() => contests.id),
    poolId: text('pool_id').references(() => pools.id),
    roundNumber: integer('round_number').notNull(),
    team1Id: text('team1_id').notNull().references(() => teams.id),
    team2Id: text('team2_id').notNull().references(() => teams.id),
    scoreTeam1: integer('score_team1'),
    scoreTeam2: integer('score_team2'),
    submittedBy: text('submitted_by').references(() => teams.id),
    confirmed: boolean('confirmed').notNull().default(false),
    winnerId: text('winner_id').references(() => teams.id),
    status: text('status').notNull().default('pending'),
});

export const matchesRelations = relations(matches, ({ one }) => ({
    pool: one(pools, { fields: [matches.poolId], references: [pools.id] }),
    team1: one(teams, { fields: [matches.team1Id], references: [teams.id] }),
    team2: one(teams, { fields: [matches.team2Id], references: [teams.id] }),
}));
