import { getContestPools } from './pools';
import { getContestMatches } from './matches';
import { getContestTeams } from './teams';
import { getContest } from './contests';
import type { Match } from './types';

export type TeamStanding = {
    teamId: string;
    teamName: string;
    played: number;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    goalAverage: number;
};

export type PoolStanding = {
    poolId: string;
    poolName: string;
    standings: TeamStanding[];
};

export async function computeStandings(contestId: string): Promise<PoolStanding[]> {
    const pools = await getContestPools(contestId);
    const matches = await getContestMatches(contestId);
    const teams = await getContestTeams(contestId);
    const teamMap = new Map(teams.map(t => [t.id, t.name]));

    const completedMatches = matches.filter(m => m.status === 'completed');

    return pools
        .sort((a, b) => a.poolNumber - b.poolNumber)
        .map(pool => {
            const poolTeamIds = pool.poolTeams.map(pt => pt.teamId);
            const poolMatches = completedMatches.filter(m => m.poolId === pool.id);

            const standings: TeamStanding[] = poolTeamIds.map(teamId => {
                let wins = 0;
                let losses = 0;
                let pointsFor = 0;
                let pointsAgainst = 0;

                for (const match of poolMatches) {
                    if (match.team1Id === teamId) {
                        pointsFor += match.scoreTeam1 ?? 0;
                        pointsAgainst += match.scoreTeam2 ?? 0;
                        if (match.winnerId === teamId) wins++;
                        else losses++;
                    } else if (match.team2Id === teamId) {
                        pointsFor += match.scoreTeam2 ?? 0;
                        pointsAgainst += match.scoreTeam1 ?? 0;
                        if (match.winnerId === teamId) wins++;
                        else losses++;
                    }
                }

                return {
                    teamId,
                    teamName: teamMap.get(teamId) ?? '?',
                    played: wins + losses,
                    wins,
                    losses,
                    pointsFor,
                    pointsAgainst,
                    goalAverage: pointsFor - pointsAgainst,
                };
            });

            standings.sort((a, b) =>
                b.wins - a.wins
                || b.pointsFor - a.pointsFor
                || b.goalAverage - a.goalAverage
            );

            return {
                poolId: pool.id,
                poolName: pool.name,
                standings,
            };
        });
}

export type PoolRanking = {
    rank: number;
    teamId: string;
    teamName: string;
    poolName: string;
    wins: number;
    pointsFor: number;
    goalAverage: number;
    qualification: 'principale' | 'consolante' | 'eliminee';
};

export async function computeQualifications(contestId: string): Promise<PoolRanking[]> {
    const contest = await getContest(contestId);
    if (!contest) return [];

    const poolStandings = await computeStandings(contestId);

    const allTeams: (TeamStanding & { poolName: string })[] = [];
    for (const pool of poolStandings) {
        for (const team of pool.standings) {
            allTeams.push({ ...team, poolName: pool.poolName });
        }
    }

    allTeams.sort((a, b) =>
        b.wins - a.wins
        || b.pointsFor - a.pointsFor
        || b.goalAverage - a.goalAverage
    );

    const nbQualified = contest.nbQualified;
    const nbConsolante = contest.nbConsolante;

    return allTeams.map((team, i) => {
        let qualification: 'principale' | 'consolante' | 'eliminee';
        if (i < nbQualified) {
            qualification = 'principale';
        } else if (i < nbQualified + nbConsolante) {
            qualification = 'consolante';
        } else {
            qualification = 'eliminee';
        }
        return {
            rank: i + 1,
            teamId: team.teamId,
            teamName: team.teamName,
            poolName: team.poolName,
            wins: team.wins,
            pointsFor: team.pointsFor,
            goalAverage: team.goalAverage,
            qualification,
        };
    });
}

export type FinalRanking = {
    teamId: string;
    teamName: string;
    finalRank: number;
    bracket: 'principale' | 'consolante' | 'eliminee';
};

export async function computeFinalRanking(contestId: string): Promise<FinalRanking[]> {
    const contest = await getContest(contestId);
    if (!contest) return [];

    const matches = await getContestMatches(contestId);
    const qualifications = await computeQualifications(contestId);

    const poolRankMap = new Map(qualifications.map(q => [q.teamId, q.rank]));
    const teamNameMap = new Map(qualifications.map(q => [q.teamId, q.teamName]));

    const results: FinalRanking[] = [];

    for (const bracketName of ['principale', 'consolante'] as const) {
        const offset = bracketName === 'principale' ? 0 : contest.nbQualified;
        const bracketMatches = matches.filter(m => m.bracket === bracketName && m.status === 'completed') as Match[];

        if (bracketMatches.length === 0) continue;

        const maxRound = Math.max(...bracketMatches.map(m => m.bracketRound!));

        // Winner of the finale
        const finale = bracketMatches.filter(m => m.bracketRound === maxRound);
        if (finale.length === 1 && finale[0].winnerId) {
            const winnerId = finale[0].winnerId;
            const loserId = finale[0].team1Id === winnerId ? finale[0].team2Id : finale[0].team1Id;

            results.push({
                teamId: winnerId,
                teamName: teamNameMap.get(winnerId) ?? '?',
                finalRank: offset + 1,
                bracket: bracketName,
            });
            results.push({
                teamId: loserId,
                teamName: teamNameMap.get(loserId) ?? '?',
                finalRank: offset + 2,
                bracket: bracketName,
            });
        }

        // Losers of earlier rounds get rank bands
        // Round maxRound-1 (semis): ranks 3-4
        // Round maxRound-2 (quarters): ranks 5-8
        // Round maxRound-3: ranks 9-16, etc.
        for (let round = maxRound - 1; round >= 1; round--) {
            const roundMatches = bracketMatches.filter(m => m.bracketRound === round);
            const bandStart = offset + Math.pow(2, maxRound - round - 1) + 1;

            const losers: { teamId: string; poolRank: number }[] = [];
            for (const m of roundMatches) {
                if (!m.winnerId) continue;
                const loserId = m.team1Id === m.winnerId ? m.team2Id : m.team1Id;
                losers.push({ teamId: loserId, poolRank: poolRankMap.get(loserId) ?? 999 });
            }

            losers.sort((a, b) => a.poolRank - b.poolRank);

            for (let i = 0; i < losers.length; i++) {
                results.push({
                    teamId: losers[i].teamId,
                    teamName: teamNameMap.get(losers[i].teamId) ?? '?',
                    finalRank: bandStart + i,
                    bracket: bracketName,
                });
            }
        }
    }

    // Eliminated teams keep their pool rank offset
    const rankedTeamIds = new Set(results.map(r => r.teamId));
    const eliminated = qualifications
        .filter(q => q.qualification === 'eliminee')
        .filter(q => !rankedTeamIds.has(q.teamId));

    for (const team of eliminated) {
        results.push({
            teamId: team.teamId,
            teamName: team.teamName,
            finalRank: team.rank,
            bracket: 'eliminee',
        });
    }

    results.sort((a, b) => a.finalRank - b.finalRank);
    return results;
}
